import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.firebase import FirebaseClient

# Importar la aplicación no debe exigir credenciales reales en CI. Las rutas que
# acceden a Firebase se prueban con dobles explícitos más abajo.
with patch.object(FirebaseClient, "initialize"):
    from app.main import app

from app.core.security import get_current_uid
from app.services.ocr_service import OCRService
from app.services.ai_service import AICapability, AIService


TEST_UID = "test-user-uid-1234567890"
OTHER_UID = "other-user-uid-123456789"


class ApiContractTests(unittest.TestCase):
    def setUp(self) -> None:
        app.dependency_overrides[get_current_uid] = lambda: TEST_UID
        self.client = TestClient(app)

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def test_all_ai_capabilities_return_the_expected_contract(self) -> None:
        endpoints = {
            "summary": "summary",
            "analyze": "analysis",
            "recommend": "recommendations",
            "predict": "prediction",
            "classify": "classification",
        }

        with patch("app.routers.ai.ai_service.execute", return_value="Respuesta financiera breve"):
            for endpoint, data_key in endpoints.items():
                with self.subTest(endpoint=endpoint):
                    response = self.client.post(f"/ai/{endpoint}/{TEST_UID}")
                    self.assertEqual(response.status_code, 200)
                    payload = response.json()
                    self.assertTrue(payload["success"])
                    self.assertEqual(payload["data"]["uid"], TEST_UID)
                    self.assertEqual(payload["data"][data_key], "Respuesta financiera breve")

    def test_chat_is_scoped_to_the_authenticated_user(self) -> None:
        with patch("app.routers.ai.ai_service.chat", return_value="Mantén tu gasto dentro del presupuesto."):
            response = self.client.post(
                "/ai/chat",
                json={"uid": TEST_UID, "question": "¿Cómo voy este mes?"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["uid"], TEST_UID)

        forbidden = self.client.post(
            "/ai/chat",
            json={"uid": OTHER_UID, "question": "¿Cómo voy este mes?"},
        )
        self.assertEqual(forbidden.status_code, 403)

    def test_ocr_accepts_an_image_and_returns_transaction_fields(self) -> None:
        extracted = {
            "amount": 42.5,
            "date": "2026-08-01",
            "description": "Compra de supermercado",
            "category": "food",
            "rawText": "TOTAL 42.50",
        }
        with patch("app.routers.ai.ocr_service.extract", return_value=extracted):
            response = self.client.post(
                "/ai/ocr",
                files={"file": ("ticket.jpg", b"fake-image", "image/jpeg")},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["amount"], 42.5)

    def test_ocr_parser_ignores_model_text_after_the_first_json_object(self) -> None:
        output = """```json
        {"amount": 18.75, "description": "Café", "category": "dining"}
        ```
        {"amount": 999}
        Texto adicional del modelo.
        """

        parsed = OCRService._extract_json(output)

        self.assertEqual(parsed["amount"], 18.75)
        self.assertEqual(parsed["category"], "dining")

    def test_ocr_normalizes_only_valid_receipt_dates(self) -> None:
        self.assertEqual(OCRService._normalize_date("02/08/2026"), "2026-08-02")
        self.assertEqual(OCRService._normalize_date("2026-08-02"), "2026-08-02")
        self.assertIsNone(OCRService._normalize_date("31/02/2026"))
        self.assertIsNone(OCRService._normalize_date(None))

    def test_protected_endpoint_rejects_missing_session(self) -> None:
        app.dependency_overrides.clear()
        response = self.client.post(f"/ai/summary/{TEST_UID}")
        self.assertEqual(response.status_code, 401)

    def test_user_cannot_request_another_users_finances(self) -> None:
        response = self.client.post(f"/ai/summary/{OTHER_UID}")
        self.assertEqual(response.status_code, 403)

    def test_financial_data_is_served_through_the_authenticated_api(self) -> None:
        wallets = [{"id": "wallet-1", "name": "Principal", "amount": 125}]
        transactions = [{"id": "tx-1", "uid": TEST_UID, "walletId": "wallet-1", "type": "expense", "amount": 20, "date": "2026-08-01"}]
        with (
            patch("app.routers.data.finance_service.get_user", return_value={"uid": TEST_UID}),
            patch("app.routers.data.finance_service.get_wallets", return_value=wallets),
            patch("app.routers.data.finance_service.get_transactions", return_value=transactions),
            patch("app.routers.data.reminder_service.list", return_value=[]),
        ):
            response = self.client.get(f"/data/financial/{TEST_UID}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["wallets"][0]["amount"], 125)
        self.assertEqual(response.json()["data"]["transactions"][0]["walletId"], "wallet-1")
        self.assertEqual(response.json()["data"]["reminders"], [])

    def test_payment_reminder_routes_use_the_authenticated_user(self) -> None:
        reminder = {
            "id": "reminder-1",
            "uid": TEST_UID,
            "title": "Internet",
            "amount": 35,
            "walletId": "wallet-1",
            "dueDate": "2026-08-15T15:00:00Z",
            "category": "services",
            "autoCharge": False,
            "status": "pending",
            "createdAt": "2026-08-01T12:00:00Z",
        }
        payload = {
            "title": "Internet",
            "amount": 35,
            "walletId": "wallet-1",
            "dueDate": "2026-08-15T15:00:00Z",
            "category": "services",
            "autoCharge": False,
        }

        with patch("app.routers.data.reminder_service.create", return_value=reminder) as create:
            response = self.client.post(f"/data/reminders/{TEST_UID}", json=payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"]["status"], "pending")
        create.assert_called_once()

        with patch("app.routers.data.reminder_service.process", return_value={**reminder, "status": "completed"}):
            processed = self.client.post(f"/data/reminders/{TEST_UID}/reminder-1/process")
        self.assertEqual(processed.status_code, 200)
        self.assertEqual(processed.json()["data"]["status"], "completed")

        forbidden = self.client.post(f"/data/reminders/{OTHER_UID}", json=payload)
        self.assertEqual(forbidden.status_code, 403)

    def test_ai_reuses_cache_and_saves_new_recommendations(self) -> None:
        # Evita inicializar Firebase real al crear AIService en entornos CI.
        with patch("app.services.finance_service.FirebaseRepository"):
            service = AIService()
        profile = {
            "user": {"uid": TEST_UID, "name": "Test"},
            "summary": {"balance": 100, "income": 200, "expenses": 100, "saving": 100, "savingRate": 50},
            "wallets": [],
            "transactions": [],
            "statistics": {},
            "dailyTip": {},
            "recommendations": [],
        }
        fingerprint = service._fingerprint(profile)

        with (
            patch.object(service.finance, "build_finance_profile", return_value=profile),
            patch.object(service.finance.repository, "get_ai_cache", return_value={"fingerprint": fingerprint, "content": "Resultado guardado"}),
            patch.object(service.openai, "generate") as generate,
        ):
            self.assertEqual(service.execute(TEST_UID, AICapability.SUMMARY), "Resultado guardado")
            generate.assert_not_called()

        with (
            patch.object(service.finance, "build_finance_profile", return_value=profile),
            patch.object(service.finance.repository, "get_ai_cache", return_value=None),
            patch.object(service.finance.repository, "save_ai_cache") as save_cache,
            patch.object(service.finance.repository, "save_recommendation") as save_recommendation,
            patch.object(service.openai, "generate", return_value="Reduce un 10% tus gastos."),
        ):
            result = service.execute(TEST_UID, AICapability.RECOMMEND)

        self.assertEqual(result, "Reduce un 10% tus gastos.")
        save_cache.assert_called_once()
        save_recommendation.assert_called_once()


if __name__ == "__main__":
    unittest.main()