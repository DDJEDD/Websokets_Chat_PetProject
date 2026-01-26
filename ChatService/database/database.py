
from sqlalchemy.orm import DeclarativeBase

from config import ASYNC_DATABASE_URL
from petproject_shared.database import DB

db = DB(ASYNC_DATABASE_URL)

class Base(DeclarativeBase):
    pass