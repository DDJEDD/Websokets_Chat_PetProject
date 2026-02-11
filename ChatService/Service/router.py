from fastapi import APIRouter, Depends, Cookie, HTTPException

from .ChatService import ChatService
from .WebSockets import WebSockets
from .deps import get_chat_service
from Exceptions.Exceptions import AccessTokenError
from fastapi import WebSocketDisconnect
from fastapi.websockets import WebSocket
router = APIRouter()
ws_manager = WebSockets()
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
@router.get("/chats/messages/{chat_id}")
async def get_messages(chat_id:str, value_from:int, value_to:int, chat_service: ChatService = Depends(get_chat_service)):
    return await chat_service.get_messages(chat_id, value_from, value_to)


@router.websocket("/ws/chat/{chat_id}/{user_id}")
async def websocket_chat(chat_id: str, user_id: int, websocket: WebSocket,
                         chat_service: ChatService = Depends(get_chat_service)):
        # prints are temporary solution for debugging :D
        print(f"WS accepted — chat={chat_id}, user={user_id}")
        await ws_manager.connect(chat_id, user_id, websocket)
        print("connected, entering loop")

        try:
            while True:
                print(f"[{chat_id}] waiting for message from user {user_id} ...")
                data = await websocket.receive_text()
                print(f"[{chat_id}] received: '{data}' (len={len(data)})")

                try:
                    print(f"[{chat_id}] saving message ...")
                    await chat_service.add_message(chat_id, user_id, data)
                    print(f"[{chat_id}] message saved")
                except Exception as e:
                    print(f"[{chat_id}] ERROR in add_message: {type(e).__name__} {str(e)}")
                    import traceback
                    traceback.print_exc()


                print(f"[{chat_id}] broadcasting ...")
                await ws_manager.send_message(chat_id, data, exclude_user=user_id)
                print(f"[{chat_id}] broadcast done")

        except WebSocketDisconnect:
            print(f"WS disconnected normally — chat={chat_id}, user={user_id}")
            ws_manager.disconnect(user_id, chat_id, websocket)
        except Exception as e:
            print(f"Critical WS error: {type(e).__name__} {str(e)}")
            import traceback
            traceback.print_exc()
            ws_manager.disconnect(user_id, chat_id, websocket)