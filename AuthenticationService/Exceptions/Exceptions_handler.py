from fastapi.responses import JSONResponse
from fastapi import Request

def exception_handler(status_code:int, detail:str):
    async def handler(request: Request, exc: Exception):
        return JSONResponse(status_code=status_code, content={"detail": detail})
    return handler
SessionNotFound_hnd = exception_handler(404, "Session not found")

UserNotFound_hnd = exception_handler(404, "User not found")

LoginVerifyFailed_hnd = exception_handler(401, "Login verify failed")

UserAlreadyExists_hnd = exception_handler(400, "User already exists")

AccessTokenExpired_hnd = exception_handler(401, "Access token expired")




