#!/usr/bin/env python3
import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "deploy" / "vps" / "preview-auth.py"
SPEC = importlib.util.spec_from_file_location("preview_auth", SOURCE)
AUTH = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(AUTH)

class PreviewAuthTests(unittest.TestCase):
    def test_password_hash_accepts_only_matching_password(self):
        encoded = AUTH.make_password_hash("a-long-shared-preview-password", salt=b"0123456789abcdef")
        self.assertTrue(AUTH.verify_password("a-long-shared-preview-password", encoded))
        self.assertFalse(AUTH.verify_password("wrong-password", encoded))

    def test_malformed_password_hash_fails_closed(self):
        self.assertFalse(AUTH.verify_password("anything", "not-a-valid-hash"))
        self.assertFalse(AUTH.verify_password("anything", "pbkdf2_sha256$1$00$00"))

    def test_signed_session_is_valid_until_expiry(self):
        secret = b"s" * 32
        token = AUTH.issue_session(secret, issued_at=1_000_000)
        self.assertTrue(AUTH.verify_session(token, secret, now=1_000_001, ttl=3600))
        self.assertFalse(AUTH.verify_session(token, secret, now=1_003_601, ttl=3600))

    def test_tampered_or_wrong_secret_session_is_rejected(self):
        secret = b"s" * 32
        token = AUTH.issue_session(secret, issued_at=1_000_000)
        self.assertFalse(AUTH.verify_session(token + "x", secret, now=1_000_001))
        self.assertFalse(AUTH.verify_session(token, b"t" * 32, now=1_000_001))

    def test_future_session_is_rejected(self):
        secret = b"s" * 32
        token = AUTH.issue_session(secret, issued_at=1_000_100)
        self.assertFalse(AUTH.verify_session(token, secret, now=1_000_000))

if __name__ == "__main__":
    unittest.main()
