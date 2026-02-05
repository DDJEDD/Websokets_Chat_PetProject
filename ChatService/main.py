from fastapi import FastAPI
from Service.router import router
from Exceptions.exception_handler import UserNotFound_hnd, RecipientAlreadyExists_hnd,AccessTokenError_hnd,SameUsers_hnd,ChatAlreadyExists_hnd
from Exceptions.Exceptions import UserNotFound, RecipientAlreadyExists, AccessTokenError, SameUsers, ChatAlreadyExists
app = FastAPI(root_path="/chat")

app.add_exception_handler(ChatAlreadyExists, ChatAlreadyExists_hnd)
app.add_exception_handler(UserNotFound, UserNotFound_hnd)
app.add_exception_handler(RecipientAlreadyExists, RecipientAlreadyExists_hnd)
app.add_exception_handler(AccessTokenError, AccessTokenError_hnd)
app.add_exception_handler(SameUsers, SameUsers_hnd)
app.include_router(router)
@app.get("/")
def start():
    return {"status": "successful!"}