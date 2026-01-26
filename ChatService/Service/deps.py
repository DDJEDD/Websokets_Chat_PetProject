
from Service.ChatService import ChatService
from database.database import db

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from petproject_shared.jwt_decode import JWTDecode

from Directory.ChatDirectory import ChatDirectory
from Directory.RecipientsDirectory import RecipientsDirectory
from config import SECRET_KEY, ALGORITHM
from httpx import AsyncClient
async def get_chat_service(session: AsyncSession=Depends(db.session)):
    return ChatService(session, JWTDecode(SECRET_KEY, ALGORITHM), AsyncClient(),
                       RecipientsDirectory(session), ChatDirectory(session))
