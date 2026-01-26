from pydantic import BaseModel


class Register(BaseModel):
    login:str
    password:str

class Login(BaseModel):
    login:str
    password:str

class TokenModel(BaseModel):
    access_token: str
    refresh_token: str