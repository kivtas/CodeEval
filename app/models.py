from pydantic import BaseModel
from typing import List, Optional, Any
import datetime

# For raw code execution (no test cases)
class CodeRunRequest(BaseModel):
    code: str # The code to run

class CodeRunResult(BaseModel):
    stdout: str # The stdout of the run
    stderr: str # The error of the run
    error: Optional[str] = None

class TestCase(BaseModel):
    input: list
    expected_output: Any

class FunctionTestGroup(BaseModel):
    target_function: str
    test_cases: List[TestCase]

class CodeOnlySubmissionRequest(BaseModel):
    code: str
    
class GradingResult(BaseModel):
    passed: bool  # Whether the submission passed all test cases
    output: Optional[str]  # The output of running the code (stdout, error messages, etc.)
    details: list  # Any additional details about the grading process (e.g., error messages)

class InstructorRegistrationRequest(BaseModel):
    name: str
    email: str

class CreateClassRequest(BaseModel):
    name: str
    instructor_id: int

class PasswordSetRequest(BaseModel):
    email: str
    password: str

class InstructorLoginRequest(BaseModel):
    email: str
    password: str

class AddStudentRequest(BaseModel):
    first_name: str
    last_name: str

class ClassCreateRequest(BaseModel):
    name: str

class StudentLoginRequest(BaseModel):
    username: str
    password: str

class CreateTestCase(BaseModel):
    input: list
    expected_output: Any
    public: bool = False

class CreateFunctionTestGroup(BaseModel):
    target_function: str
    test_cases: List[CreateTestCase]

class AssignmentCreate(BaseModel):
    title: str
    description: str
    due_date: datetime.datetime
    starter_code: Optional[str] = None
    tests: List[CreateFunctionTestGroup]

class StarterCodeUpdate(BaseModel):
    starter_code: Optional[str] = None

class NewTestCase(BaseModel):
    target_function: str
    input: Any
    expected_output: Any
    public: bool

class GradeUpdate(BaseModel):
    grade: str  # You can change to int or float if grading is numeric

