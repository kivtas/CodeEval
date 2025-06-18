import bcrypt
from fastapi import HTTPException
from app.models import InstructorLoginRequest, StudentLoginRequest
from app.models_db import users
from sqlalchemy import select
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def set_user_password(database, email: str, password: str):
    query = select(users).where(users.c.email == email, users.c.is_verified == True)
    user = await database.fetch_one(query)
    if not user:
        raise HTTPException(status_code=400, detail="Email not verified or does not exist.")

    hashed = pwd_context.hash(password)
    update_query = users.update().where(users.c.email == email).values(password_hash=hashed)
    await database.execute(update_query)

async def authenticate_instructor(database, login: InstructorLoginRequest):
    query = select(users).where(users.c.email == login.email)
    user = await database.fetch_one(query)
    if not user or not user["password_hash"] or not pwd_context.verify(login.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return user

async def authenticate_student(database, login: StudentLoginRequest):
    query = select(users).where(users.c.username == login.username, users.c.role == "student")
    user = await database.fetch_one(query)
    if not user or not user["password_hash"] or not pwd_context.verify(login.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return user

def hash_password(password: str) -> str:
    return pwd_context.hash(password)






