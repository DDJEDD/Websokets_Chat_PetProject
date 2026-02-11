from fastapi import APIRouter, Depends, Cookie, HTTPException, Body

from .ChatService import ChatService
from .WebSockets import WebSockets
from .deps import get_chat_service
from Exceptions.Exceptions import AccessTokenError
from fastapi import WebSocketDisconnect
from fastapi.websockets import WebSocket
from .schemas import CreateChatRequest
router = APIRouter()
ws_manager = WebSockets()
@router.post("/chatcrt")
async def chatcrt(body: CreateChatRequest , chat_service: ChatService = Depends(get_chat_service),access_token: str | None = Cookie(None),):
    print(body)
    if not access_token:
        raise AccessTokenError()
    user_id = chat_service.get_current_user(access_token)

    return await chat_service.create_chat_by_username(user_id, body.recipient_name)

@router.get("/chats")
async def chats( value_from:int, value_to:int, chat_service: ChatService = Depends(get_chat_service), access_token: str | None = Cookie(None),):
    if not access_token:
        raise AccessTokenError()
    user_id = chat_service.get_current_user(access_token)
    return await chat_service.get_chats(user_id, value_from, value_to)
@router.delete("/delete_chat")
async def delete_chat(chat_id:str, chat_service: ChatService = Depends(get_chat_service)):
    return await chat_service.delete_chat(chat_id)
@router.get("/chats/messages/{chat_id}")
async def get_messages(chat_id:str, value_from:int, value_to:int, chat_service: ChatService = Depends(get_chat_service)):
    return await chat_service.get_messages(chat_id, value_from, value_to)
@router.get("/chats/lastmessage/{chat_id}")
async def get_last_message(chat_id:str, chat_service: ChatService = Depends(get_chat_service)):
    return await chat_service.get_last_message(chat_id)

@router.websocket("/ws/chat/{chat_id}")
async def websocket_chat(
        chat_id: str,
        websocket: WebSocket,
        chat_service: ChatService = Depends(get_chat_service),
        access_token: str | None = Cookie(None)
):
    if not access_token:
        await websocket.close(code=1008)
        return
    try:
        user_id = chat_service.get_current_user(access_token)
    except AccessTokenError:
        await websocket.close(code=1008)
        return
    await ws_manager.connect(chat_id, user_id, websocket)
    print(f"WS connected — chat={chat_id}, user={user_id}")

    try:
        while True:
            data = await websocket.receive_text()

            try:
                await chat_service.add_message(chat_id, user_id, data)

            except Exception as e:
                print(f"[{chat_id}] ERROR in add_message: {type(e).__name__} {str(e)}")
            await ws_manager.send_message(chat_id, data, exclude_user=user_id)
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, chat_id, websocket)
    except Exception as e:
        import traceback
        traceback.print_exc()
        ws_manager.disconnect(user_id, chat_id, websocket)
