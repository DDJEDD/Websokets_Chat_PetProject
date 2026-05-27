
from Service.ChatService import ChatService
from database.database import db

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends


from Directory.ChatDirectory import ChatDirectory
from Directory.RecipientsDirectory import RecipientsDirectory

from httpx import AsyncClient
from .requests import AsyncRequest
import redis.asyncio as redis
from Directory.MessageDirectory import MessageDirectory
from petproject_shared.redis import RedisService
http_client = AsyncClient()
redis_service = redis.Redis(host="redis", port=6379, db=0)
async def get_chat_service(session: AsyncSession=Depends(db.session)):
    return ChatService(session,  AsyncRequest(http_client),
                       RecipientsDirectory(session), ChatDirectory(session), MessageDirectory(session), RedisService(redis_service))