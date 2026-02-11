# FastAPI WebSockets Chat Pet Project

![Status](https://img.shields.io/badge/status-pre--alpha-orange)
![Python](https://img.shields.io/badge/python-3.12+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688)

Microservice-based backend project built with **FastAPI** for real-time chat communication.

> ⚠️ **PRE-ALPHA** — active development, breaking changes are expected.

---

## 🚀 Features

### ✅ Current Features
- User registration and login
- JWT authentication via cookies
- Account activation logic
- Account session control
- Isolated authentication service
- Async-first architecture (non-blocking I/O)
- - **Real-time chat (WebSockets)**
  - Authenticated WebSocket connections
  - Real-time message broadcasting
- Microservice-oriented architecture

### 🚧 Planned Features

  - Public chat rooms
  - Own emoji menu


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

### 1. Configure environment variables

Create `.env` file for **Auth Service**:

```env
SECRET_KEY=secret-key
ALGORITHM=algorithm
POSTGRES_USER=yourdbuser
POSTGRES_PASSWORD=yourdbpassword
POSTGRES_DB=yourdbname
DB_PORT=5432
DB_HOST=auth_db
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
```

Create `.env` file for **Chat Service**:

```env
POSTGRES_USER=yourdbuser
POSTGRES_PASSWORD=yourdbpassword
POSTGRES_DB=yourdbname
DB_PORT=5432
DB_HOST=chat_db
SECRET_KEY=secret-key
ALGORITHM=HS256
```

### 2. Start with Docker Compose

```bash
docker-compose up --build
```

---

## 🧪 Testing

Testing will be added in future.

---

## 📝 Project Structure

```
.
├── auth-service/       # Authentication microservice
├── chat-service/       # Chat microservice (planned)
├── docker-compose.yml
└── README.md
```

---

**Created by DJED**
