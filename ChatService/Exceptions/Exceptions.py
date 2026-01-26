

class ChatError(Exception):
    pass

class RecipientAlreadyExists(ChatError):
    pass
class UserNotFound(ChatError):
    pass
class SameUsers(ChatError):
    pass
class AccessTokenError(ChatError):
    pass