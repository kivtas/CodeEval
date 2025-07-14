import os
from sqlalchemy import create_engine, MetaData
from databases import Database

# Choose DB location based on environment
if os.getenv("RENDER"):  # Render sets this env var automatically
    db_path = "/data/codeeval.db"
else:
    db_path = "./codeeval.db"

DATABASE_URL = f"sqlite:///{db_path}"

database = Database(DATABASE_URL)
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
metadata = MetaData()