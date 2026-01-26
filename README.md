# FastAPI WebSockets Chat Pet Project (PRE-ALPHA)

This is a microservice-based backend project built with **FastAPI**.  
It provides modern authentication mechanisms and is planned to support real-time communication via WebSockets.

> <sub>⚠️ Project status: PRE-ALPHA — active development, breaking changes are expected.</sub>

---

## 🚀 Planned Features

- Authentication service
  - JWT-based authentication
  - Tokens stored in secure HTTP-only cookies
  - Multi-account support per user
- 💬 Real-time chat (WebSockets)
  - Public chat rooms
  - Authenticated WebSocket connections
  - Real-time message broadcasting
- Microservice-oriented architecture
- Clean and scalable project structure

---

## ✅ Current Features

- User registration and login
- JWT authentication via cookies
- Account activation logic
- Isolated authentication service
- Async-first architecture (non-blocking I/O)

---

## 🧱 Tech Stack

- **Python 3.12+**
- **FastAPI**
- **Async SQLAlchemy**
- **JWT**
- **WebSockets**
- **Docker & docker-compose**

---

## 🚀 Running Locally

First, configure the `.env` files for each service:

```bash
# Auth Service

SECRET_KEY=secret-key
ALGORITHM=algorithm
POSTGRES_USER=yourdbuser
POSTGRES_PASSWORD=yourdbpassword
POSTGRES_DB=yourdbname
DB_PORT=5432
DB_HOST=auth_db
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# Chat Service

POSTGRES_USER=yourdbuser
POSTGRES_PASSWORD=yourdbpassword
POSTGRES_DB=yourdbname
DB_PORT=5432
DB_HOST=chat_db
SECRET_KEY=secret-key
ALGORITHM=HS256
```
And then, you`ll be able to start docker compose:
```bash
docker-compose up --build
```

---

##  🧪 Testing
  - testing will be added in future.




## created by DJED
