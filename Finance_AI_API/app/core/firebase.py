from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore


class FirebaseClient:
    _db = None

    @classmethod
    def initialize(cls):

        # Si Firebase ya fue inicializado no volver a hacerlo
        if firebase_admin._apps:
            cls._db = firestore.client()
            return

        credential_path = (
            Path(__file__).resolve().parents[2] / "credentials" / "firebase-admin.json"
        )

        cred = credentials.Certificate(str(credential_path))

        firebase_admin.initialize_app(cred)

        cls._db = firestore.client()

    @classmethod
    def get_db(cls):

        if cls._db is None:
            cls.initialize()

        return cls._db
