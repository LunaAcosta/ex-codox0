import os
import unittest

import requests


BASE_URL = os.getenv("SMOKE_BASE_URL", "").rstrip("/")
SMOKE_UID = os.getenv("SMOKE_UID", "")
SMOKE_OTHER_UID = os.getenv("SMOKE_OTHER_UID", "other-user-uid-123456789")
SMOKE_TOKEN = os.getenv("SMOKE_FIREBASE_ID_TOKEN", "")

SMOKE_CONFIGURED = bool(BASE_URL and SMOKE_UID and SMOKE_TOKEN)


@unittest.skipUnless(
    SMOKE_CONFIGURED,
    "Define SMOKE_BASE_URL, SMOKE_UID y SMOKE_FIREBASE_ID_TOKEN para ejecutar smoke tests.",
)
class SmokeApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.auth_headers = {
            "Authorization": f"Bearer {SMOKE_TOKEN}",
            "Accept": "application/json",
        }

    def test_health_returns_running(self) -> None:
        response = requests.get(f"{BASE_URL}/health", timeout=15)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["status"], "running")

    def test_authenticated_read_only_endpoint_returns_success(self) -> None:
        response = requests.get(
            f"{BASE_URL}/users/",
            headers=self.auth_headers,
            timeout=15,
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])

    def test_missing_token_returns_401(self) -> None:
        response = requests.get(f"{BASE_URL}/users/", timeout=15)

        self.assertEqual(response.status_code, 401)
        self.assertNotIn(SMOKE_TOKEN, response.text)

    def test_other_uid_returns_403_without_modifying_data(self) -> None:
        response = requests.get(
            f"{BASE_URL}/data/financial/{SMOKE_OTHER_UID}",
            headers=self.auth_headers,
            timeout=15,
        )

        self.assertEqual(response.status_code, 403)

    def test_invalid_input_returns_controlled_4xx(self) -> None:
        response = requests.post(
            f"{BASE_URL}/ai/chat",
            headers={**self.auth_headers, "Content-Type": "application/json"},
            json={"uid": SMOKE_UID, "question": ""},
            timeout=15,
        )

        self.assertGreaterEqual(response.status_code, 400)
        self.assertLess(response.status_code, 500)
        self.assertNotIn(SMOKE_TOKEN, response.text)


if __name__ == "__main__":
    unittest.main()
