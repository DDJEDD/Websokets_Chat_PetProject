import uuid

from petproject_shared.redis import RedisService
from Directory.RecipientsDirectory import RecipientsDirectory
from Directory.ChatDirectory import ChatDirectory
from Directory.MessageDirectory import MessageDirectory
from .requests import AsyncRequest
from Exceptions.Exceptions import SameUsers, UserNotFound, AccessTokenError, ChatAlreadyExists, UserNotFoundInChat, ChatNotFound


class ChatService:
    def __init__(self, session,  client: AsyncRequest,
                 RecipDir: RecipientsDirectory, ChatDir: ChatDirectory, MessageDir: MessageDirectory, RedisService: RedisService):
        self.session = session

        self.client = client
        self.RecipDir = RecipDir
        self.ChatDir = ChatDir
        self.MessageDir = MessageDir
        self.redis = RedisService

    #TODO: Провести рефактиринг - разделить ответственность на другие классы


    async def create_chat_by_username(self, current_user_id: int, recipient_username: str, is_group: bool = False):
        recipient_id = await self.redis.get_id_by_login(recipient_username)

        if not recipient_id:
            recipient = await self.client.get_user_by_username(recipient_username)
            recipient_id = recipient['id']

            await self.redis.set_user(recipient_id, recipient['username'], recipient['login'])

        recipient_id = int(recipient_id)

        if current_user_id == recipient_id:
            raise SameUsers()

        async with self.session.begin():
            if await self.ChatDir.find_private_chat(current_user_id, recipient_id):
                raise ChatAlreadyExists()

            chat_id = str(uuid.uuid4())
            await self.ChatDir.create_chat(chat_id, is_group)
            await self.RecipDir.create_recipient(chat_id, current_user_id)
            await self.RecipDir.create_recipient(chat_id, recipient_id)

        return {"status": "successful", "chat_id": chat_id}

    async def get_chats(self, user_id: int, value_from: int, value_to: int):
        chats = await self.ChatDir.get_chats(
            user_id,
            value_from,
            value_to
        )

        response = []

        for chat in chats:
            recipients_data = []

            for recipient in chat.recipients:
                if recipient.user_id == user_id:
                    continue

                user_data = await self.resolve_user(recipient.user_id)

                recipients_data.append({
                    "id": recipient.user_id,
                    "username": user_data["username"],
                    "login": user_data["login"]
                })

            response.append({
                "id": chat.id,
                "is_group": chat.is_group,
                "last_message_at": chat.last_message_at,
                "recipients": recipients_data
            })

        return response

    async def delete_chat(self, chat_id:str):
        async with self.session.begin():
            await self.ChatDir.delete_chat(chat_id)
        return {"status": "successful"}
    async def add_message(self, chat_id:str, user_id:int, text:str):
        print("ADDING MESSAGE", chat_id, user_id, text)
        async with self.session.begin():
            if not await self.ChatDir.exists(chat_id):
                raise ChatNotFound()
            if not await self.RecipDir.is_chat_member(chat_id, user_id):
                raise UserNotFoundInChat()
            await self.MessageDir.create_message(chat_id, user_id, text)
            await self.ChatDir.change_last_message(chat_id, text)
        return {"status": "successful"}

    async def get_messages(self, chat_id: str, value_from: int, value_to: int):
        if not await self.ChatDir.exists(chat_id):
            raise ChatNotFound()

        messages = await self.MessageDir.get_messages(
            chat_id,
            value_from,
            value_to
        )

        response = []
        local_cache = {}

        for msg in messages:
            uid = msg.user_id

            if uid not in local_cache:
                local_cache[uid] = await self.resolve_user(uid)

            user_data = local_cache[uid]

            response.append({
                "id": msg.id if hasattr(msg, 'id') else None,
                "text": msg.text,
                "created_at": msg.created_at,
                "user_id": uid,
                "username": user_data["username"],
                "login": user_data["login"]
            })

        return response

    async def resolve_user(self, user_id: int):
        user_info = await self.redis.get_user(user_id)

        if user_info and user_info.get("username"):
            return {
                "username": user_info.get("username"),
                "login": user_info.get("login")
            }

        try:
            auth_data = await self.client.get_user(user_id)

            await self.redis.set_user(
                user_id,
                auth_data["username"],
                auth_data["login"]
            )

            return {
                "username": auth_data["username"],
                "login": auth_data["login"]
            }

        except Exception:
            return {
                "username": "Unknown",
                "login": "unknown"
            }
    async def get_last_message(self, chat_id:str):
        return await self.ChatDir.get_last_message(chat_id)




