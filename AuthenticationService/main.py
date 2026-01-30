from fastapi import FastAPI
from Service.router import router

from Exceptions.Exceptions_handler import LoginVerifyFailed_hnd, SessionNotFound_hnd, UserNotFound_hnd, UserAlreadyExists_hnd, AccessTokenExpired_hnd
from Exceptions.Exceptions import LoginVerifyFailed, SessionNotFound, UserNotFound, UserAlreadyExists, AccessTokenExpired
app = FastAPI(root_path="/auth")


app.include_router(router)
app.add_exception_handler(LoginVerifyFailed, LoginVerifyFailed_hnd)
app.add_exception_handler(SessionNotFound, SessionNotFound_hnd)
app.add_exception_handler(UserNotFound, UserNotFound_hnd)
app.add_exception_handler(UserAlreadyExists, UserAlreadyExists_hnd)
app.add_exception_handler(AccessTokenExpired, AccessTokenExpired_hnd)
@app.get("/")
def start():
    return {"status": "successful!"}