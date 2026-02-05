
from sqlalchemy.exc import IntegrityError
from Exceptions.Exceptions import RecipientAlreadyExists
from database.creation import ChatRecipients


class RecipientsDirectory:
    def __init__(self, session):
        self.session = session

    async def create_recipient(self, chat_id: str, user_id: int, username:str):
        recipient = ChatRecipients(chat_id=chat_id, user_id=user_id, username=username)
        self.session.add(recipient)
        try:
            await self.session.flush()
        except IntegrityError:
            raise RecipientAlreadyExists()

        return recipient
