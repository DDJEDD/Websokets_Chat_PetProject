

from sqlalchemy.orm import DeclarativeBase


from petproject_shared.database import DB
from config import ASYNC_DATABASE_URL
db = DB(ASYNC_DATABASE_URL)

class Base(DeclarativeBase):
    pass