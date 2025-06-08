from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from django.conf import settings
import base64
import os


class MessageEncryption:
    """Handle end-to-end encryption for messages"""
    
    @staticmethod
    def generate_key():
        """Generate a new encryption key"""
        return Fernet.generate_key()
    
    @staticmethod
    def derive_key_from_password(password: str, salt: bytes = None) -> tuple:
        """Derive encryption key from password"""
        if salt is None:
            salt = os.urandom(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key, salt
    
    @staticmethod
    def encrypt_message(message: str, key: bytes) -> str:
        """Encrypt a message using the provided key"""
        f = Fernet(key)
        encrypted_message = f.encrypt(message.encode())
        return base64.urlsafe_b64encode(encrypted_message).decode()
    
    @staticmethod
    def decrypt_message(encrypted_message: str, key: bytes) -> str:
        """Decrypt a message using the provided key"""
        f = Fernet(key)
        encrypted_data = base64.urlsafe_b64decode(encrypted_message.encode())
        decrypted_message = f.decrypt(encrypted_data)
        return decrypted_message.decode()


class FileEncryption:
    """Handle file encryption for attachments"""
    
    @staticmethod
    def encrypt_file(file_content: bytes, key: bytes) -> bytes:
        """Encrypt file content"""
        f = Fernet(key)
        return f.encrypt(file_content)
    
    @staticmethod
    def decrypt_file(encrypted_content: bytes, key: bytes) -> bytes:
        """Decrypt file content"""
        f = Fernet(key)
        return f.decrypt(encrypted_content)


def get_or_create_user_encryption_key(user_id: int) -> str:
    """Get or create encryption key for user"""
    from .models import User
    # For demo purposes, we'll use a simple key derivation
    # In production, this should be more sophisticated
    key_material = f"{settings.SECRET_KEY}_{user_id}".encode()
    return base64.urlsafe_b64encode(key_material[:32]).decode()