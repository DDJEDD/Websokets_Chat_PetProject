from sqlalchemy import select, func
from database.creation import Chat, ChatRecipients
from sqlalchemy.orm import selectinload
from Exceptions.Exceptions import ChatNotFound




class ChatDirectory:
    def __init__(self,session):
        self.session = session
    async def create_chat(self, chat_id: str, is_group: bool):
        chat = Chat(id=chat_id, is_group=is_group)
        self.session.add(chat)
        return chat
    async def change_last_message(self, chat_id: str, last_message: str):
        stmt = select(Chat).where(Chat.id == chat_id)
        result = await self.session.execute(stmt)
        chat = result.scalar_one_or_none()
        if not chat:
            raise ChatNotFound()

        chat.last_message = last_message
        chat.last_message_at = func.now()
    async def get_last_message(self, chat_id: str):
        stmt = select(Chat).where(Chat.id == chat_id)
        result = await self.session.execute(stmt)
        chat = result.scalar_one_or_none()
        return {'last_message': chat.last_message, 'last_message_at': chat.last_message_at}

    async def get_chats(self, user_id:int, value_from:int, value_to:int):
        subq = (
            select(Chat.id)
            .join(Chat.recipients)
            .where(
                ChatRecipients.user_id == user_id,
                Chat.is_group == False
            )
            .order_by(Chat.last_message_at.desc())
            .limit(value_to - value_from)
            .offset(value_from)
        ).subquery()

        stmt = (
            select(Chat)
            .join(subq, Chat.id == subq.c.id)
            .options(selectinload(Chat.recipients))
        )

        result = await self.session.execute(stmt)
        chats = result.scalars().all()
        return chats

    async def delete_chat(self, chat_id: str):
        result = await self.session.execute(
            select(Chat)
            .where(Chat.id == chat_id)
            .options(selectinload(Chat.recipients))
        )
        chat = result.scalars().first()
        if not chat:
            raise ChatNotFound()

        await self.session.delete(chat)

    async def find_private_chat(self, user1: int, user2: int):
        stmt = (
            select(Chat.id)
            .join(ChatRecipients)
            .where(
                Chat.is_group == False,
                ChatRecipients.user_id.in_([user1, user2])
            )
            .group_by(Chat.id)
            .having(func.count(ChatRecipients.user_id) == 2)
        )

        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()