from fastapi import APIRouter, Depends

from .ChatService import ChatService

from .deps import get_chat_service


router = APIRouter()

@router.post("/chatcrt")
async def chatcrt(access_token:str,recipient_id:int, chat_service: ChatService = Depends(get_chat_service)):
    user_id = chat_service.get_current_user(access_token)
    return await chat_service.create_chat(user_id, recipient_id)