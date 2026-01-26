from passlib.hash import bcrypt
class Hash:
    def hash_password(self, password):
        return bcrypt.hash(password)

    def verify_password(self, password,hash_password):
        return bcrypt.verify(password, hash_password)