from sqlalchemy import Table, Column, Integer, String, ForeignKey, DateTime, Text, Boolean, JSON
from app.database import metadata
import datetime

users = Table(
    "users", metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("email", String, unique=True, nullable=True),
    Column("username", String, unique=True, nullable=True),
    Column("role", String, nullable=False),
    Column("is_verified", Boolean, default=False),
    Column("password_hash", String, nullable=True),  # only for instructors
    Column("login_code", String, unique=True, nullable=True),  # only for students
    Column("raw_password", String, nullable=True) # only for students
)

classes = Table(
    "classes", metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("class_code", String, unique=True, nullable=False),
    Column("instructor_id", Integer, ForeignKey("users.id"))
)

class_membership = Table(
    "class_membership", metadata,
    Column("class_id", Integer, ForeignKey("classes.id")),
    Column("student_id", Integer, ForeignKey("users.id")),
    Column("id", Integer, primary_key=True)
)

assignments = Table(
    "assignments", metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String, nullable=False),
    Column("description", Text),
    Column("class_id", Integer, ForeignKey("classes.id")),
    Column("due_date", DateTime),
    Column("starter_code", Text, nullable=True)
)

test_cases = Table(
    "test_cases", metadata,
    Column("id", Integer, primary_key=True),
    Column("assignment_id", Integer, ForeignKey("assignments.id")),
    Column("target_function", String, nullable=False),
    Column("input", JSON, nullable=False),        # e.g. [2, 3]
    Column("expected_output", JSON, nullable=False), # e.g. 5
    Column("public", Boolean, default=False)      # optional: whether student can see it
)

submissions = Table(
    "submissions", metadata,
    Column("id", Integer, primary_key=True),
    Column("student_id", Integer, ForeignKey("users.id")),
    Column("assignment_id", Integer, ForeignKey("assignments.id")),
    Column("code", Text),
    Column("grade", Integer),
    Column("submitted_at", DateTime, default=datetime.datetime.utcnow),
    Column("test_results", Text)
)
