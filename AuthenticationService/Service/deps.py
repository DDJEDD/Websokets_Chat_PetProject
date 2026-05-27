from fastapi import Depends, HTTPException, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from database.database import db
from .AuthenticationService import AuthenticationService
from Service.hashing import Hash
from petproject_shared.jwt_encode import JWTEncode
from petproject_shared.jwt_decode import JWTDecode
from Repository.UserRepository import UserRepository
from Repository.SessionRepository import SessionRepository
from config import SECRET_KEY, ALGORITHM
from petproject_shared.redis import RedisService
import redis.asyncio as redis
redis_service = redis.Redis(host="redis", port=6379, db=0)
async def get_auth_service(session: AsyncSession = Depends(db.session)):
    return AuthenticationService(session, Hash(), JWTEncode(SECRET_KEY, ALGORITHM),JWTDecode(SECRET_KEY, ALGORITHM),UserRepository(session),SessionRepository(session),
                                 RedisService(redis_service))

def get_current_user(access_token: str | None = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="not authenticated")

    return JWTDecode(SECRET_KEY, ALGORITHM).get_current_user(access_token)