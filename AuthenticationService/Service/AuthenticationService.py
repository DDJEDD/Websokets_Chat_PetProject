import uuid
from datetime import datetime, timezone, timedelta
from Exceptions.Exceptions import (
    SessionNotFound, UserNotFound, LoginVerifyFailed,
    UserAlreadyExists, AccessTokenExpired
)
from Service.schemas import Register, TokenModel, Login
from Service.hashing import Hash
from Repository.UserRepository import UserRepository
from Repository.SessionRepository import SessionRepository
from petproject_shared.exceptions import TokenExpiredError
from petproject_shared.jwt_encode import JWTEncode
from petproject_shared.jwt_decode import JWTDecode
from config import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
class AuthenticationService:
    def __init__(self, session, Hash: Hash, JWTEncode: JWTEncode,
                 JWTDecode: JWTDecode, UserRepository: UserRepository, SessionRepository: SessionRepository):
        self.session = session
        self.Hash = Hash
        self.JWTEncode = JWTEncode
        self.JWTDecode = JWTDecode
        self.UserRepository = UserRepository
        self.SessionRepository = SessionRepository

    def get_current_user(self, access_token: str):
        try:
            payload = self.JWTDecode.decode_token(access_token, True)
        except TokenExpiredError:
            raise AccessTokenExpired()
        user_id = self.JWTDecode.get_user_id(payload)
        return user_id

    async def register(self, register: Register):
        async with self.session.begin():
            if await self.UserRepository.get_user(register.login):
                raise UserAlreadyExists()
            await self.UserRepository.create_user(register.login, register.username, self.Hash.hash_password(register.password),)
        return {"status": "successful"}

    async def login(self, login:Login, fingerprint:str):
        async with self.session.begin():
            user = await self.UserRepository.get_user(login.login)
            if not user or not self.Hash.verify_password(login.password,user.hashed_password):
                raise LoginVerifyFailed()

            session_id = str(uuid.uuid4())
            await self.SessionRepository.create_session(user.id, session_id, fingerprint,
                                                        datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
        access_token = self.JWTEncode.create_access_token(user.id, session_id, ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token = self.JWTEncode.create_refresh_token(session_id, REFRESH_TOKEN_EXPIRE_DAYS)


        return TokenModel(access_token=access_token, refresh_token=refresh_token)

    async def get_me(self, user_id: int) -> dict:

        user = await self.UserRepository.get_user_by_id(user_id)
        sessions = await self.SessionRepository.get_session_by_user_id(user_id)
        return {"user": user, "sessions": sessions}

    async def refresh_user_token(self, refresh_token: str):
        try:
            payload = self.JWTDecode.decode_token(refresh_token, True)
        except TokenExpiredError:
            raise AccessTokenExpired()


        async with self.session.begin():
            session_obj = await self.SessionRepository.get_session_by_session_id(self.JWTDecode.get_session_id(payload))
            if not session_obj:
                raise SessionNotFound()
            new_session_id = str(uuid.uuid4())

            new_session = await self.SessionRepository.create_session(
                session_obj.user_id,new_session_id,
                session_obj.fingerprint,datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

            await self.SessionRepository.delete_session(session_obj)
            session_obj = new_session

        refresh_token = self.JWTEncode.create_refresh_token(new_session_id, REFRESH_TOKEN_EXPIRE_DAYS)
        access_token = self.JWTEncode.create_access_token(session_obj.user_id, session_obj.session_id, ACCESS_TOKEN_EXPIRE_MINUTES)

        return TokenModel(access_token=access_token, refresh_token=refresh_token)

    async def logout(self, refresh_token: str):
        payload = self.JWTDecode.decode_token(refresh_token, False)
        session_id = self.JWTDecode.get_session_id(payload)
        async with self.session.begin():
            session_obj = await self.SessionRepository.get_session_by_session_id(session_id)
            if not session_obj:
                raise SessionNotFound()
            await self.SessionRepository.delete_session(session_obj)

    async def get_user_by_id(self, user_id: int):
        user = await self.UserRepository.get_user_by_id(user_id)
        if not user:
            raise UserNotFound()
        return {"login": user.login, "id": user.id}
    async def delete_session(self, session_id: str):
        async with self.session.begin():
            session_obj = await self.SessionRepository.get_session_by_session_id(session_id)
            if not session_obj:
                raise SessionNotFound()
            await self.SessionRepository.delete_session(session_obj)
    async def change_password(self, current_password: str, new_password: str, user_id: int):
        async with self.session.begin():
            user = await self.UserRepository.get_user_by_id(user_id)
            if not user:
                raise UserNotFound()
            if not self.Hash.verify_password(current_password, user.hashed_password):
                raise LoginVerifyFailed()
            user.hashed_password = self.Hash.hash_password(new_password)
            self.session.add(user)
            return {"status": "successful"}
    async def get_user_by_username(self, login: str):
        async with self.session.begin():
            user = await self.UserRepository.get_user_by_login(login)
            if not user:
                raise UserNotFound(f"User '{login}' not found")
            return {"login": user.login, "id": user.id}

