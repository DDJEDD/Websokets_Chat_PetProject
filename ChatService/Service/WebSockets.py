from collections import defaultdict
from fastapi import WebSocket

class WebSockets:
    def __init__(self):
        self.active_connections: dict[str, defaultdict[int ,set[WebSocket]]] = defaultdict(lambda: defaultdict(set))

    async def connect(self, chat_id: str, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[chat_id][user_id].add(websocket)

    def disconnect(self, user_id: int, chat_id: str, websocket: WebSocket):
        conns = self.active_connections.get(chat_id)
        if not conns:
            return

        user_conns = conns.get(user_id)
        if not user_conns:
            return

        user_conns.discard(websocket)

        if not user_conns:
            conns.pop(user_id)

    async def send_message(self, chat_id: str, message: str, exclude_user: int | None = None):
        conns = self.active_connections.get(chat_id)
        if not conns:
            return

        dead = []
        for user_id, sockets in conns.items():
            if exclude_user is not None and user_id == exclude_user:
                continue
            for ws in list(sockets):
                try:
                    await ws.send_text(message)
                except:
                    dead.append((user_id, ws))

        for user_id, ws in dead:
            self.disconnect(user_id, chat_id, ws)
