#!/usr/bin/env python3
"""Dependency-free shared-password session service for the Math Explorer preview."""
from __future__ import annotations
import hashlib, hmac, http.cookies, json, os, secrets, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs

COOKIE_NAME = "math_preview_session"
DEFAULT_TTL = 12 * 60 * 60
PBKDF2_ITERATIONS = 310_000

def make_password_hash(password: str, salt: bytes | None = None, iterations: int = PBKDF2_ITERATIONS) -> str:
    if not isinstance(password, str) or not password:
        raise ValueError("password must not be empty")
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return "pbkdf2_sha256$" + str(iterations) + "$" + salt.hex() + "$" + digest.hex()

def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, rounds_text, salt_hex, digest_hex = encoded.split("$", 3)
        rounds = int(rounds_text)
        if algorithm != "pbkdf2_sha256" or not 100_000 <= rounds <= 2_000_000:
            return False
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), rounds)
        return hmac.compare_digest(actual, bytes.fromhex(digest_hex))
    except (AttributeError, TypeError, ValueError):
        return False

def issue_session(secret: bytes, issued_at: int | None = None) -> str:
    timestamp = int(time.time() if issued_at is None else issued_at)
    message = f"math-preview-session:v1:{timestamp}".encode("ascii")
    signature = hmac.new(secret, message, hashlib.sha256).hexdigest()
    return str(timestamp) + "." + signature

def verify_session(token: str, secret: bytes, now: int | None = None, ttl: int = DEFAULT_TTL) -> bool:
    try:
        timestamp_text, signature = token.split(".", 1)
        if not timestamp_text.isdigit() or len(signature) != 64:
            return False
        timestamp = int(timestamp_text)
        current = int(time.time() if now is None else now)
        if timestamp <= 0 or timestamp > current + 30 or current - timestamp > ttl:
            return False
        message = f"math-preview-session:v1:{timestamp}".encode("ascii")
        expected = hmac.new(secret, message, hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature, expected)
    except (AttributeError, TypeError, ValueError):
        return False

def make_handler(password_hash: str, session_secret: bytes, expected_origin: str, session_ttl: int):
    class Handler(BaseHTTPRequestHandler):
        server_version = "MathPreviewAuth/1.0"
        sys_version = ""
        def log_message(self, _format: str, *args) -> None:
            return
        def send_empty(self, status: int) -> None:
            self.send_response(status); self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", "0"); self.end_headers()
        def send_json(self, status: int, payload: dict, cookie: str | None = None) -> None:
            body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
            self.send_response(status); self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store"); self.send_header("X-Content-Type-Options", "nosniff")
            if cookie is not None: self.send_header("Set-Cookie", cookie)
            self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)
        def get_cookie(self) -> str:
            jar = http.cookies.SimpleCookie()
            try:
                jar.load(self.headers.get("Cookie", "")); morsel = jar.get(COOKIE_NAME)
                return morsel.value if morsel else ""
            except http.cookies.CookieError:
                return ""
        def do_GET(self) -> None:
            if self.path == "/verify":
                self.send_empty(204 if verify_session(self.get_cookie(), session_secret, ttl=session_ttl) else 401); return
            if self.path == "/logout":
                self.send_response(303); self.send_header("Location", "/login")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Set-Cookie", f"{COOKIE_NAME}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax")
                self.send_header("Content-Length", "0"); self.end_headers(); return
            self.send_empty(404)
        def do_POST(self) -> None:
            if self.path != "/login": self.send_empty(404); return
            if self.headers.get("Origin") != expected_origin:
                self.send_json(403, {"ok": False, "error": "请求来源无效，请刷新页面后重试。"}); return
            try: length = int(self.headers.get("Content-Length", "0"))
            except ValueError: length = 0
            if length <= 0 or length > 4096:
                self.send_json(400, {"ok": False, "error": "登录请求格式无效。"}); return
            if self.headers.get_content_type() != "application/x-www-form-urlencoded":
                self.send_json(415, {"ok": False, "error": "登录请求格式无效。"}); return
            try:
                fields = parse_qs(self.rfile.read(length).decode("utf-8"), strict_parsing=True, max_num_fields=4)
                username = fields.get("username", [""])[0]; password = fields.get("password", [""])[0]
            except (UnicodeDecodeError, ValueError):
                self.send_json(400, {"ok": False, "error": "登录请求格式无效。"}); return
            if username != "preview" or not verify_password(password, password_hash):
                self.send_json(401, {"ok": False, "error": "账号或密码不正确。"}); return
            token = issue_session(session_secret)
            cookie = f"{COOKIE_NAME}={token}; Path=/; Max-Age={session_ttl}; Secure; HttpOnly; SameSite=Lax"
            self.send_json(200, {"ok": True}, cookie)
    return Handler

def main() -> None:
    password_hash = os.environ.get("MATH_PREVIEW_PASSWORD_HASH", "")
    secret_hex = os.environ.get("MATH_PREVIEW_SESSION_SECRET", "")
    origin = os.environ.get("MATH_PREVIEW_ORIGIN", "")
    ttl = int(os.environ.get("MATH_PREVIEW_SESSION_TTL", str(DEFAULT_TTL)))
    if not password_hash or not secret_hex or not origin.startswith("https://"):
        raise SystemExit("Missing or invalid Math Preview authentication environment.")
    secret = bytes.fromhex(secret_hex)
    if len(secret) < 32 or not 300 <= ttl <= 7 * 24 * 60 * 60:
        raise SystemExit("Invalid session secret or session lifetime.")
    server = ThreadingHTTPServer(("127.0.0.1", 8765), make_handler(password_hash, secret, origin, ttl))
    server.daemon_threads = True
    server.serve_forever()

if __name__ == "__main__":
    main()
