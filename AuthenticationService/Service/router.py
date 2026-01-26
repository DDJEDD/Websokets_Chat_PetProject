from fastapi import APIRouter, Request, Depends, Response, Cookie, HTTPException
from Service.deps import get_auth_service, get_current_user
from Service.AuthenticationService import AuthenticationService
from Service.schemas import Register, Login
from petproject_shared.exceptions import TokenExpiredError
from config import REFRESH_TOKEN_EXPIRE_DAYS
from Exceptions.Exceptions import SessionNotFound

router = APIRouter()

@router.post("/register")
async def register(register: Register,
                   auth: AuthenticationService = Depends(get_auth_service)):

    return await auth.register(register)

@router.post("/login")
async def login(login: Login,request: Request, response: Response,  refresh_token: str | None = Cookie(None),
                   auth: AuthenticationService = Depends(get_auth_service)):
    if refresh_token:
        try:
            await auth.logout(refresh_token)
        except (SessionNotFound, TokenExpiredError):
            pass
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")

    fingerprint = request.headers.get('User-Agent')
    res = await auth.login(login,fingerprint)

    response.set_cookie(key="access_token",
                        value=res.access_token, httponly=True, samesite="none",secure=True, path="/",)
    response.set_cookie(key="refresh_token",
                        value=res.refresh_token, httponly=True, samesite="none",secure=True, path="/", max_age=60*60*24*REFRESH_TOKEN_EXPIRE_DAYS)
    return {"access_token": res.access_token, "refresh_token": res.refresh_token}


@router.get("/me")
async def get_me(auth: AuthenticationService = Depends(get_auth_service), user_id: int = Depends(get_current_user)):
    return await auth.get_me(user_id)




@router.post("/refresh")
async def refresh(response: Response,refresh_token: str | None = Cookie(None),
                  auth: AuthenticationService = Depends(get_auth_service)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="not logged in")
    res = await auth.refresh_user_token(refresh_token)
    response.set_cookie(key="access_token",
                        value=res.access_token, httponly=True, samesite="none",secure=True, path="/",)
    response.set_cookie(key="refresh_token",
                        value=res.refresh_token, httponly=True, samesite="none",secure=True, path="/", max_age=60*60*24*REFRESH_TOKEN_EXPIRE_DAYS)
    return {"status": "successful"}

@router.post("/logout")
async def logout(response: Response, refresh_token: str | None = Cookie(None),
                 auth: AuthenticationService = Depends(get_auth_service)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="not logged in")

    await auth.logout(refresh_token)
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return {"status": "successful"}
@router.get("/internal/user/{user_id}")
async def get_user(user_id: int, auth: AuthenticationService = Depends(get_auth_service)):
    res = await auth.get_user_by_id(user_id)
    return {"user": res}