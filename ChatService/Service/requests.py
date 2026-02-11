from httpx import AsyncClient
from Exceptions.Exceptions import UserNotFound

class AsyncRequest:
    def __init__(self,client: AsyncClient):
        self.client = client
    async def get_user(self, user_id:int):
        request = await self.client.get(f"http://auth_service:8001/internal/user/{user_id}")

        if request.status_code == 404:
            raise UserNotFound()
        data = request.json()

        return data

    async def get_user_by_username(self, username: str):
        request = await self.client.get(f"http://auth_service:8001/internal/user/by-username/{username}")
        if request.status_code == 404:
            raise UserNotFound(f"User '{username}' not found")
        data = request.json()
        return data
