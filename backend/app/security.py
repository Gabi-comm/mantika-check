import base64
import hashlib
import hmac
import json
import os
import time


def hash_password(password: str, iterations: int) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return salt.hex() + "$" + digest.hex()


def verify_password(password: str, stored: str, iterations: int) -> bool:
    try:
        salt_hex, digest_hex = stored.split("$", 1)
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), iterations
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(digest.hex(), digest_hex)


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _unb64(text: str) -> bytes:
    pad = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + pad)


def make_token(user_id: str, role: str, secret: str, hours: int) -> str:
    header = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _b64(
        json.dumps(
            {"sub": user_id, "role": role, "exp": int(time.time()) + hours * 3600},
            separators=(",", ":"),
        ).encode()
    )
    signature = hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    return f"{header}.{payload}.{_b64(signature)}"


def read_token(token: str, secret: str) -> dict | None:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
        expected = hmac.new(
            secret.encode(), f"{header_b64}.{payload_b64}".encode(), hashlib.sha256
        ).digest()
        if not hmac.compare_digest(expected, _unb64(signature_b64)):
            return None
        payload = json.loads(_unb64(payload_b64))
        if int(payload["exp"]) < int(time.time()):
            return None
        return payload
    except (ValueError, KeyError, json.JSONDecodeError):
        return None
