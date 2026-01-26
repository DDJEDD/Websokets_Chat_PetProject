import uuid
from petproject_shared.jwt_decode import JWTDecode
from petproject_shared.exceptions import TokenExpiredError
from httpx import AsyncClient
from Directory.RecipientsDirectory import RecipientsDirectory
from Directory.ChatDirectory import ChatDirectory

from Exceptions.Exceptions import SameUsers, UserNotFound, AccessTokenError


class ChatService:
    def __init__(self, session, JWTDecode:JWTDecode, client: AsyncClient,
                 RecipDir: RecipientsDirectory, ChatDir: ChatDirectory):
        self.session = session
        self.JWTDecode = JWTDecode
        self.client = client
        self.RecipDir = RecipDir
        self.ChatDir = ChatDir

    def get_current_user(self, access_token: str):
        try:
            payload = self.JWTDecode.decode_token(access_token, True)
        except TokenExpiredError:
            raise AccessTokenError()
        user_id = self.JWTDecode.get_user_id(payload)
        return user_id

    async def create_chat(self, user_id:int, recipient_id:int):
        request = await self.client.get(f"http://auth_service:8001/internal/user/{user_id}")

        if request.status_code != 200:
            raise UserNotFound()
        if user_id == recipient_id:
            raise SameUsers()
        async with self.session.begin():
            chat_id = str(uuid.uuid4())

            await self.ChatDir.create_chat(chat_id, False) # Temporary solution
            await self.RecipDir.create_recipient(chat_id, user_id)
            await self.RecipDir.create_recipient(chat_id, recipient_id)

        return {"status": "successful"}

