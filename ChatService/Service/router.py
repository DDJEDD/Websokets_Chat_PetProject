from fastapi import APIRouter, Depends, Cookie, HTTPException

from .ChatService import ChatService

from .deps import get_chat_service
from Exceptions.Exceptions import AccessTokenError

router = APIRouter()

@router.post("/chatcrt")
async def chatcrt(recipient_id:int, chat_service: ChatService = Depends(get_chat_service),access_token: str | None = Cookie(None),):
    if not access_token:
        raise AccessTokenError()
    user_id = chat_service.get_current_user(access_token)
    return await chat_service.create_chat(user_id, recipient_id)

@router.get("/chats")
async def chats( value_from:int, value_to:int, chat_service: ChatService = Depends(get_chat_service), access_token: str | None = Cookie(None),):
    if not access_token:
        raise AccessTokenError()
    user_id = chat_service.get_current_user(access_token)
    return await chat_service.get_chats(user_id, value_from, value_to)
@router.delete("/delete_chat")
async def delete_chat(chat_id:str, chat_service: ChatService = Depends(get_chat_service)):
    return await chat_service.delete_chat(chat_id)