from fastapi import FastAPI, HTTPException, status, Request, Depends
from app.models import AssignmentSubmissionRequest, GradingResult, CodeRunRequest, CodeRunResult, InstructorRegistrationRequest, CreateClassRequest, InstructorLoginRequest, StudentLoginRequest, PasswordSetRequest, AddStudentRequest, ClassCreateRequest, AssignmentCreate, TestCase, FunctionTestGroup
from app.grader import grade_python_submission, run_code
from app.database import database, engine, metadata
from app.models_db import users, classes, assignments, submissions, class_membership, test_cases
from app.email_utils import send_verification_email, verify_token
from app.utils import generate_unique_class_code
from app.auth_utils import set_user_password, authenticate_instructor, authenticate_student, hash_password
from app.auth_jwt import create_access_token, get_current_user
from datetime import timedelta
from collections import defaultdict
import random
import string

from sqlalchemy import insert, select, update

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

@app.post("/run", response_model=CodeRunResult)
async def run_code_endpoint(request: CodeRunRequest):
    # Run the code and get the result
    result = run_code(request.code)
    return result

@app.post("/instructor/classes/{class_id}/assignments")
async def create_assignment(
    class_id: int,
    data: AssignmentCreate,
    instructor=Depends(get_current_user)
):
    # Verify instructor owns the class
    class_check_query = classes.select().where(
        classes.c.id == class_id,
        classes.c.instructor_id == instructor["id"]
    )
    class_row = await database.fetch_one(class_check_query)
    if not class_row:
        raise HTTPException(status_code=403, detail="You do not own this class.")

    # Insert assignment
    insert_assignment = assignments.insert().values(
        title=data.title,
        description=data.description,
        class_id=class_id,
        due_date=data.due_date,
        starter_code=data.starter_code
    )
    assignment_id = await database.execute(insert_assignment)

    # Insert test cases
    for group in data.tests:
        for test in group.test_cases:
            insert_test_case = test_cases.insert().values(
                assignment_id=assignment_id,
                target_function=group.target_function,
                input=test.input,
                expected_output=test.expected_output,
                public=test.public
            )
            await database.execute(insert_test_case)

    return {"message": "Assignment created successfully", "assignment_id": assignment_id}

@app.on_event("startup")
async def startup():
    metadata.create_all(engine)
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.post("/register-instructor")
async def register_instructor(data: InstructorRegistrationRequest):
    # Check if user with this email already exists
    query = select(users).where(users.c.email == data.email)
    existing_user = await database.fetch_one(query)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")

    # Insert into users table with is_verified=False and role='instructor'
    insert_query = insert(users).values(
        name=data.name,
        email=data.email,
        role="instructor",
        is_verified=False
    )
    await database.execute(insert_query)

    # Send email
    await send_verification_email(data.email)

    return {"message": "Registration successful. Check your email to verify your account."}

@app.get("/verify-email")
async def verify_email(token: str):
    try:
        email = verify_token(token)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")

    # Update user’s is_verified field
    update_query = (
        update(users)
        .where(users.c.email == email)
        .values(is_verified=True)
    )
    await database.execute(update_query)

    return {"message": f"Email {email} has been verified."}

@app.post("/set-password")
async def set_password_endpoint(data: PasswordSetRequest):
    await set_user_password(database, data.email, data.password)
    return {"message": "Password set successfully."}

@app.post("/login/instructor")
async def instructor_login(data: InstructorLoginRequest):
    user = await authenticate_instructor(database, data)

    # Create JWT access token
    access_token = create_access_token(
        data={"sub": str(user["id"])},
        expires_delta=timedelta(days=1)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["id"],
        "name": user["name"]
    }

@app.post("/instructor/class")
async def create_class(
    data: ClassCreateRequest,
    instructor=Depends(get_current_user),
):
    if instructor["role"] != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can create classes.")

    class_code = await generate_unique_class_code(database)

    insert_query = classes.insert().values(
        name=data.name,
        class_code=class_code,
        instructor_id=instructor["id"]
    )
    class_id = await database.execute(insert_query)

    return {
        "message": "Class created successfully",
        "class_id": class_id,
        "class_code": class_code
    }

@app.get("/instructor/classes")
async def get_instructor_classes(
    instructor=Depends(get_current_user)
):
    if instructor["role"] != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can view their classes.")

    query = select(classes).where(classes.c.instructor_id == instructor["id"])
    result = await database.fetch_all(query)

    return {"classes": result}


@app.post("/instructor/classes/{class_id}/add-student")
async def add_student(
    class_id: int,
    data: AddStudentRequest,
    instructor=Depends(get_current_user)
):
    # Make sure the current user is an instructor
    if instructor["role"] != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can add students.")

    # Verify instructor owns the class
    class_query = select(classes).where(
        classes.c.id == class_id,
        classes.c.instructor_id == instructor["id"]
    )
    class_row = await database.fetch_one(class_query)
    if not class_row:
        raise HTTPException(status_code=404, detail="Class not found or not owned by you.")

    # Generate username
    username = f"{data.first_name[0].lower()}{data.last_name.lower()}"

    # Check for username collision
    existing = await database.fetch_one(select(users).where(users.c.username == username))
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Generate 5-character alphanumeric password
    login_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    hashed_password = hash_password(login_code)

    # Insert into users table
    user_insert_query = insert(users).values(
        name=f"{data.first_name} {data.last_name}",
        username=username,
        role="student",
        is_verified=True,
        password_hash=hashed_password,
        raw_password=login_code
    )
    user_id = await database.execute(user_insert_query)

    # Link student to class via class_membership
    membership_insert_query = insert(class_membership).values(
        class_id=class_id,
        student_id=user_id
    )
    await database.execute(membership_insert_query)

    return {
        "message": "Student added successfully",
        "username": username,
        "password": login_code  # So instructor can give it to student
    }

@app.post("/login/student")
async def student_login(data: StudentLoginRequest):
    user = await authenticate_student(database, data)

    access_token = create_access_token(
        data={"sub": str(user["id"])},
        expires_delta=timedelta(days=1)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["id"],
        "name": user["name"]
    }

from sqlalchemy import delete

@app.delete("/instructor/classes/{class_id}")
async def delete_class(
    class_id: int,
    instructor=Depends(get_current_user)
):
    if instructor["role"] != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can delete classes.")

    # Verify instructor owns the class
    class_query = select(classes).where(
        classes.c.id == class_id,
        classes.c.instructor_id == instructor["id"]
    )
    class_row = await database.fetch_one(class_query)
    if not class_row:
        raise HTTPException(status_code=404, detail="Class not found or not owned by you.")

    # Get all student_ids linked to this class
    student_ids_query = select(class_membership.c.student_id).where(class_membership.c.class_id == class_id)
    student_ids = await database.fetch_all(student_ids_query)
    student_ids = [row["student_id"] for row in student_ids]

    # Delete from class_membership
    await database.execute(delete(class_membership).where(class_membership.c.class_id == class_id))

    # Delete all students (who were added to this class by the instructor)
    if student_ids:
        await database.execute(delete(users).where(users.c.id.in_(student_ids), users.c.role == "student"))

    # Delete the class itself
    await database.execute(delete(classes).where(classes.c.id == class_id))

    return {"message": f"Class {class_id} and all related data deleted successfully."}

@app.delete("/instructor/classes/{class_id}/students/{student_id}")
async def delete_student(
    class_id: int,
    student_id: int,
    instructor=Depends(get_current_user)
):
    if instructor["role"] != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can delete students.")

    # Confirm the class belongs to this instructor
    class_query = select(classes).where(
        classes.c.id == class_id,
        classes.c.instructor_id == instructor["id"]
    )
    class_row = await database.fetch_one(class_query)
    if not class_row:
        raise HTTPException(status_code=404, detail="Class not found or not owned by you.")

    # Check if the student is part of this class
    membership_check = await database.fetch_one(
        select(class_membership).where(
            class_membership.c.class_id == class_id,
            class_membership.c.student_id == student_id
        )
    )
    if not membership_check:
        raise HTTPException(status_code=404, detail="Student not found in this class.")

    # Delete from class_membership
    await database.execute(
        delete(class_membership).where(
            class_membership.c.class_id == class_id,
            class_membership.c.student_id == student_id
        )
    )

    # Delete student user account (only if role is student)
    await database.execute(
        delete(users).where(
            users.c.id == student_id,
            users.c.role == "student"
        )
    )

    return {"message": f"Student {student_id} removed from class {class_id} and deleted."}

@app.get("/instructor/classes/{class_id}/students")
async def get_students_in_class(class_id: int, instructor=Depends(get_current_user)):
    if instructor["role"] != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can view students.")

    # Verify instructor owns the class
    class_query = select(classes).where(
        classes.c.id == class_id,
        classes.c.instructor_id == instructor["id"]
    )
    class_row = await database.fetch_one(class_query)
    if not class_row:
        raise HTTPException(status_code=404, detail="Class not found or not owned by you.")

    # Get student IDs from class_membership
    student_ids_query = select(class_membership.c.student_id).where(class_membership.c.class_id == class_id)
    student_ids = await database.fetch_all(student_ids_query)
    student_ids = [row["student_id"] for row in student_ids]

    if not student_ids:
        return {"students": []}

    # Get student details
    students_query = select(users).where(users.c.id.in_(student_ids))
    students = await database.fetch_all(students_query)

    return {"students": students}

@app.get("/instructor/students")
async def get_all_students(instructor=Depends(get_current_user)):
    if instructor["role"] != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can view students.")

    # Get all class IDs owned by instructor
    class_ids_query = select(classes.c.id).where(classes.c.instructor_id == instructor["id"])
    class_ids = await database.fetch_all(class_ids_query)
    class_ids = [row["id"] for row in class_ids]

    if not class_ids:
        return {"students": []}

    # Get all student IDs from class_membership
    student_ids_query = select(class_membership.c.student_id).where(class_membership.c.class_id.in_(class_ids))
    student_ids = await database.fetch_all(student_ids_query)
    student_ids = [row["student_id"] for row in student_ids]

    if not student_ids:
        return {"students": []}

    # Get student details from users table
    students_query = select(users).where(users.c.id.in_(student_ids))
    students = await database.fetch_all(students_query)

    return {"students": students}

@app.get("/instructor/classes/{class_id}/students-passwords")
async def get_student_passwords(class_id: int, instructor=Depends(get_current_user)):
    if instructor["role"] != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can view student passwords.")

    # Make sure the class belongs to the instructor
    class_check = select(classes).where(
        classes.c.id == class_id,
        classes.c.instructor_id == instructor["id"]
    )
    class_obj = await database.fetch_one(class_check)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found or not yours.")

    # Get student IDs
    membership_query = select(class_membership.c.student_id).where(class_membership.c.class_id == class_id)
    student_ids = await database.fetch_all(membership_query)
    student_ids = [row["student_id"] for row in student_ids]

    if not student_ids:
        return {"students": []}

    # Fetch student usernames and raw passwords
    student_query = select(users.c.username, users.c.raw_password).where(users.c.id.in_(student_ids))
    students = await database.fetch_all(student_query)

    return {"students": students}

@app.get("/student/assignments")
async def get_student_assignments(student=Depends(get_current_user)):
    if student["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view assignments.")

    query = """
        SELECT assignments.id, assignments.title, assignments.description, assignments.due_date, assignments.starter_code
        FROM assignments
        JOIN class_membership ON assignments.class_id = class_membership.class_id
        WHERE class_membership.student_id = :student_id
    """
    rows = await database.fetch_all(query, values={"student_id": student["id"]})
    return {"assignments": rows}

@app.post("/student/submit")
async def submit_assignment(
    data: AssignmentSubmissionRequest,
    student=Depends(get_current_user)
):
    if student["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can submit assignments.")

    # Get test cases for this assignment
    test_case_query = test_cases.select().where(test_cases.c.assignment_id == data.assignment_id)
    raw_cases = await database.fetch_all(test_case_query)

    # Structure them as FunctionTestGroup-style objects
    grouped = defaultdict(list)
    for case in raw_cases:
        grouped[case["target_function"]].append(TestCase(input=case["input"], expected_output=case["expected_output"]))

    structured_tests = [FunctionTestGroup(target_function=k, test_cases=v) for k, v in grouped.items()]

    # Grade the code
    grading_result = grade_python_submission(data.code, structured_tests)

    # Store results
    insert_query = submissions.insert().values(
        student_id=student["id"],
        assignment_id=data.assignment_id,
        code=data.code,
        grade=100 if grading_result.passed else 0,
        test_results=grading_result.details
    )
    await database.execute(insert_query)

    return {
        "message": "Submission received",
        "passed": grading_result.passed,
        "results": grading_result.details
    }


