from pydantic import BaseModel, Field


class Register(BaseModel):
    login: str = Field(min_length=4, pattern=r"^\S+$")
    username: str = Field(min_length=4, pattern=r"^\S+$")
    password: str = Field(min_length=6, pattern=r"^\S+$")

class Login(BaseModel):
    login: str = Field(min_length=4,pattern=r"^\S+$")
    password: str = Field(min_length=6, pattern=r"^\S+$")

class TokenModel(BaseModel):
    access_token: str
    refresh_token: str