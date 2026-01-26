
from database.creation import Chat


class ChatDirectory:
    def __init__(self,session):
        self.session = session
    async def create_chat(self, chat_id: str, is_group: bool):
        chat = Chat(id=chat_id, is_group=is_group)
        self.session.add(chat)
        return chat