from sqlalchemy import select
from database.creation import Users
from Exceptions.Exceptions import UserNotFound
class UserRepository:
    def __init__(self, session):
        self.session = session

    async def get_user(self, login: str):
        response = await self.session.execute(select(Users).where(Users.login == login))
        return response.scalars().first()

    async def get_user_by_id(self, user_id: int):
        stmt = select(Users).where(Users.id == user_id)
        res = await self.session.execute(stmt)
        return res.scalars().first()
    async def get_user_by_login(self, login: str):
        stmt = select(Users).where(Users.login == login)
        res = await self.session.execute(stmt)
        return res.scalars().first()
    async def delete_user(self, obj: Users):
        await self.session.delete(obj)
    async def create_user(self, login: str, username:str, hashed_password: str):
        new_user = Users(
            login=login,
            username=username,
            hashed_password=hashed_password,
        )
        self.session.add(new_user)
        return new_user
    async def change_username(self, user_id: int, new_username: str):
        stmt = select(Users).where(Users.id == user_id)
        res = await self.session.execute(stmt)
        user = res.scalars().first()
        user.username = new_username
        self.session.add(user)
        return user