from datetime import datetime

from sqlalchemy import select

from database.creation import Sessions

class SessionRepository:
    def __init__(self, session):
        self.session = session

    async def get_session_by_user_id(self, user_id: int):
        stmt = select(Sessions).where(Sessions.user_id == user_id)
        res = await self.session.execute(stmt)
        return res.scalars().all()
    async def get_session_by_session_id(self, session_id: str):
        stmt = select(Sessions).where(Sessions.session_id == session_id)
        res = await self.session.execute(stmt)
        return res.scalars().first()

    async def create_session(self, user_id: int, session_id: str, fingerprint: str, expires_at: datetime):
        new_session = Sessions(
            user_id=user_id,
            session_id=session_id,
            fingerprint=fingerprint,
            expires_at=expires_at,
        )
        self.session.add(new_session)
        return new_session
    async def delete_session(self, obj: Sessions):
        await self.session.delete(obj)
