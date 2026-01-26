
class AuthError(Exception):
    pass
class LoginVerifyFailed(AuthError):
    pass
class SessionNotFound(AuthError):
    pass
class UserNotFound(AuthError):
    pass
class UserAlreadyExists(AuthError):
    pass
class AccessTokenExpired(AuthError):
    pass