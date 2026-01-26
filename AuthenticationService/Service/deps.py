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

async def get_auth_service(session: AsyncSession = Depends(db.session)):
    return AuthenticationService(session, Hash(), JWTEncode(SECRET_KEY, ALGORITHM),JWTDecode(SECRET_KEY, ALGORITHM),UserRepository(session),SessionRepository(session))

def get_current_user(access_token: str | None = Cookie(None),auth: AuthenticationService = Depends(get_auth_service),):
    if not access_token:
        raise HTTPException(status_code=401, detail="not authenticated")

    return auth.get_current_user(access_token)