from sqlalchemy import select

from database.creation import Message, ChatRecipients


class MessageDirectory:
    def __init__(self, session):
        self.session = session

    async def create_message(self, chat_id: str, user_id: int, text: str):
        message = Message(text=text, chat_id=chat_id, user_id=user_id)
        self.session.add(message)
        return message

    async def get_messages(self, chat_id: str, value_from: int, value_to: int):
        stmt = (
            select(Message, ChatRecipients.username)
            .join(ChatRecipients, (Message.chat_id == ChatRecipients.chat_id) & (Message.user_id == ChatRecipients.user_id))
            .where(Message.chat_id == chat_id)
            .order_by(Message.created_at.desc())
            .limit(value_to - value_from)
            .offset(value_from)
        )

        result = await self.session.execute(stmt)
        rows = result.all()

        response = []
        for message, username in rows:
            response.append({
                "id": message.id,
                "text": message.text,
                "created_at": message.created_at,
                "username": username,
                "user_id": message.user_id
            })

        return response