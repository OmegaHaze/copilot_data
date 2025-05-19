"""Stub file for passlib package"""

class hash:
    """Stub for passlib.hash namespace"""
    
    class bcrypt:
        """Stub for passlib.hash.bcrypt"""
        @staticmethod
        def hash(password: str) -> str: ...
        
        @staticmethod
        def verify(password: str, hash_value: str) -> bool: ...
