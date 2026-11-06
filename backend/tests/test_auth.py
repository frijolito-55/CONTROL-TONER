import os
import unittest
from unittest.mock import patch

import auth


class AdminAuthenticationTests(unittest.TestCase):
    def test_authenticates_configured_admin(self):
        with patch.dict(os.environ, {
            "TONER_ADMIN_USER": "admin",
            "TONER_ADMIN_PASSWORD": "long-test-password",
        }):
            self.assertTrue(auth.authenticate_admin("admin", "long-test-password"))
            self.assertFalse(auth.authenticate_admin("admin", "incorrect"))
            self.assertFalse(auth.authenticate_admin("other", "long-test-password"))

    def test_authentication_fails_when_credentials_are_not_configured(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(auth.authenticate_admin("admin", "password"))

    def test_session_expires_and_can_be_revoked(self):
        token = auth.create_session("admin")
        self.assertEqual(auth.get_session_username(token), "admin")
        self.assertIsNone(auth.get_session_username(token, now=float("inf")))

        token = auth.create_session("admin")
        auth.revoke_session(token)
        self.assertIsNone(auth.get_session_username(token))


if __name__ == "__main__":
    unittest.main()