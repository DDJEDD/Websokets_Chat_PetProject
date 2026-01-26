from sqlalchemy import select
from database.creation import Users
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

    async def delete_user(self, obj: Users):
        await self.session.delete(obj)
    async def create_user(self, login: str, hashed_password: str):
        new_user = Users(
            login=login,
            hashed_password=hashed_password,
        )
        self.session.add(new_user)
        return new_user