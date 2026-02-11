from pydantic import BaseModel
class CreateChatRequest(BaseModel):
    recipient_name: str