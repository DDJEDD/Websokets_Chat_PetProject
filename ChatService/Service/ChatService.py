import uuid
from petproject_shared.jwt_decode import JWTDecode
from petproject_shared.exceptions import TokenExpiredError

from Directory.RecipientsDirectory import RecipientsDirectory
from Directory.ChatDirectory import ChatDirectory
from Directory.MessageDirectory import MessageDirectory
from .requests import AsyncRequest
from Exceptions.Exceptions import SameUsers, UserNotFound, AccessTokenError, ChatAlreadyExists
from .WebSockets import WebSockets

class ChatService:
    def __init__(self, session, JWTDecode:JWTDecode, client: AsyncRequest,
                 RecipDir: RecipientsDirectory, ChatDir: ChatDirectory, MessageDir: MessageDirectory, WebSockets: WebSockets):
        self.session = session
        self.JWTDecode = JWTDecode
        self.client = client
        self.RecipDir = RecipDir
        self.ChatDir = ChatDir
        self.MessageDir = MessageDir
        self.WebSockets = WebSockets
    def get_current_user(self, access_token: str):
        try:
            payload = self.JWTDecode.decode_token(access_token, True)
        except TokenExpiredError:
            raise AccessTokenError()
        user_id = self.JWTDecode.get_user_id(payload)
        return user_id

    async def create_chat(self, user_id:int, recipient_id:int, is_group:bool = False):
        if user_id == recipient_id:
            raise SameUsers()
        user = await self.client.get_user(user_id)
        recipient = await self.client.get_user(recipient_id)
        async with self.session.begin():
            if await self.ChatDir.find_private_chat(user_id, recipient_id):
                raise ChatAlreadyExists()
            chat_id = str(uuid.uuid4())

            await self.ChatDir.create_chat(chat_id, is_group)
            await self.RecipDir.create_recipient(chat_id, user_id,  user['user']['login'])
            await self.RecipDir.create_recipient(chat_id, recipient_id, recipient['user']['login'])

        return {"status": "successful"}
    async def get_chats(self, user_id:int, value_from:int, value_to:int):
        await self.client.get_user(user_id)
        chats = await self.ChatDir.get_chats(user_id, value_from, value_to)
        response = []
        for chat in chats:
            response.append({
                "id": chat.id,
                "is_group": chat.is_group,
                "last_message_at": chat.last_message_at,
                "recipients": [
                    {
                        "id": recipient.user_id,
                        "username": recipient.username
                    }
                    for recipient in chat.recipients if recipient.user_id != user_id
                ]
            })
        return response
    async def delete_chat(self, chat_id:str):
        async with self.session.begin():
            await self.ChatDir.delete_chat(chat_id)
            return {"status": "successful"}
    async def add_message(self, chat_id:str, user_id:int, text:str):
        async with self.session.begin():
            await self.MessageDir.create_message(chat_id, user_id, text)
        return {"status": "successful"}
    async def get_messages(self, chat_id:str, value_from:int, value_to:int):
        async with self.session.begin():
            return await self.MessageDir.get_messages(chat_id, value_from, value_to)





