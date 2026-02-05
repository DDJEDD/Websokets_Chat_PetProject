from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base
class Chat(Base):
    __tablename__ = "chat"
    id = Column(String, primary_key=True, index=True)
    is_group = Column(Boolean, nullable=False, default=False)
    last_message = Column(String, nullable=True)
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    recipients = relationship("ChatRecipients", back_populates="chat",  cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="chat")


class ChatRecipients(Base):
    __tablename__ = "chat_recipients"
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(String, ForeignKey("chat.id"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    username = Column(String, nullable=False)
    __table_args__ = (UniqueConstraint("chat_id", "user_id", name="unique_recipients"),)

    chat = relationship("Chat", back_populates="recipients")


class Message(Base):
    __tablename__ = "message"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chat_id = Column(String, ForeignKey("chat.id"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)

    chat = relationship("Chat", back_populates="messages")
