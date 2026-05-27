from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from Exceptions.Exceptions import RecipientAlreadyExists
from database.creation import ChatRecipients


class RecipientsDirectory:
    def __init__(self, session):
        self.session = session

    async def create_recipient(self, chat_id: str, user_id: int):
        recipient = ChatRecipients(chat_id=chat_id, user_id=user_id)
        self.session.add(recipient)
        try:
            await self.session.flush()
        except IntegrityError:
            raise RecipientAlreadyExists()

        return recipient
    async def is_chat_member(self, chat_id: str, user_id: int):
        stmt = (
            select(ChatRecipients)
            .where(ChatRecipients.chat_id == chat_id)
            .where(ChatRecipients.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None
