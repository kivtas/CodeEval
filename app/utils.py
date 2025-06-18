import random
import string
from sqlalchemy import select
from app.models_db import classes

async def generate_unique_class_code(database):
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        query = select(classes).where(classes.c.class_code == code)
        existing = await database.fetch_one(query)
        if not existing:
            return code


