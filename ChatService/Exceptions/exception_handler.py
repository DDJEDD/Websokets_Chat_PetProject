from fastapi.responses import JSONResponse
from fastapi import Request

def exception_handler(status_code:int, detail:str):
    async def handler(request: Request, exc: Exception):
        return JSONResponse(status_code=status_code, content={"detail": detail})
    return handler
UserNotFound_hnd = exception_handler(404, "User not found")
RecipientAlreadyExists_hnd = exception_handler(400, "Recipient already exists")
AccessTokenError_hnd = exception_handler(401, "Access token error")
SameUsers_hnd = exception_handler(400, "Same users")
ChatAlreadyExists_hnd = exception_handler(400, "Chat already exists")


