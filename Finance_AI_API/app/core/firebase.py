from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

from app.core.config import settings


class FirebaseClient:
    _db = None

    @classmethod
    def initialize(cls):
        if firebase_admin._apps:
            cls._db = firestore.client()
            return

        if (
            settings.FIREBASE_PROJECT_ID
            and settings.FIREBASE_PRIVATE_KEY
            and settings.FIREBASE_CLIENT_EMAIL
        ):
            private_key = settings.FIREBASE_PRIVATE_KEY.strip().replace("\\n", "\n")

            if not private_key.startswith("-----BEGIN") or "PRIVATE KEY-----" not in private_key:
                raise ValueError(
                    "FIREBASE_PRIVATE_KEY no tiene el formato PEM válido de Firebase. "
                    "Debe incluir el bloque '-----BEGIN PRIVATE KEY-----' con saltos de línea reales o escapados."
                )

            firebase_cred = {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                "private_key": private_key,
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "client_id": settings.FIREBASE_CLIENT_ID,
                "token_uri": "https://oauth2.googleapis.com/token",  # nosec B105
            }
            cred = credentials.Certificate(firebase_cred)
        else:
            credential_path = (
                Path(__file__).resolve().parents[2] / "credentials" / "firebase-admin.json"
            )
            if not credential_path.exists():
                raise FileNotFoundError(
                    "No se encontró Firebase credentials. Define FIREBASE_PROJECT_ID, "
                    "FIREBASE_PRIVATE_KEY y FIREBASE_CLIENT_EMAIL o monta credentials/firebase-admin.json"
                )
            cred = credentials.Certificate(str(credential_path))

        firebase_admin.initialize_app(cred)
        cls._db = firestore.client()

    @classmethod
    def get_db(cls):

        if cls._db is None:
            cls.initialize()

        return cls._db
