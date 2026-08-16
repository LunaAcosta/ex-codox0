from google.cloud.firestore_v1.base_query import FieldFilter
from datetime import datetime, timezone

from app.core.firebase import FirebaseClient


class FirebaseRepository:
    def __init__(self):
        self.db = FirebaseClient.get_db()

    # ============================================
    # USERS
    # ============================================

    def get_users(self):

        users = []

        docs = self.db.collection("users").stream()

        for doc in docs:
            data = doc.to_dict()
            data["uid"] = doc.id
            users.append(data)

        return users

    def get_user(self, uid: str):

        doc = self.db.collection("users").document(uid).get()

        if not doc.exists:
            return None

        data = doc.to_dict()
        data["uid"] = doc.id

        return data

    # ============================================
    # WALLETS
    # ============================================

    def get_wallets(self, uid: str):

        docs = (
            self.db.collection("wallets")
            .where(filter=FieldFilter("uid", "==", uid))
            .stream()
        )

        wallets = []

        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            wallets.append(data)

        return wallets

    # ============================================
    # TRANSACTIONS
    # ============================================

    def get_transactions(self, uid: str):

        docs = (
            self.db.collection("transactions")
            .where(filter=FieldFilter("uid", "==", uid))
            .stream()
        )

        transactions = []

        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            transactions.append(data)

        return transactions

    # ============================================
    # DAILY TIP
    # ============================================

    def get_daily_tip(self, uid: str):
        snapshot = self.db.collection("dailyTips").document(uid).get()
        return snapshot.to_dict() if snapshot.exists else {}

    # ============================================
    # RECOMMENDATIONS
    # ============================================

    def get_recommendations(self, uid: str, limit: int = 5):
        docs = (
            self.db.collection("recommendationHistory")
            .document(uid)
            .collection("items")
            .order_by("createdAt", direction="DESCENDING")
            .limit(limit)
            .stream()
        )

        recommendations = []

        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            recommendations.append(data)

        return recommendations
        
    def save_recommendation(self, uid: str, text: str, source: str = "ai"):
        record = {
            "type": "recommendation",
            "text": text,
            "recommendation": text,
            "source": source,
            "date": datetime.now(timezone.utc).date().isoformat(),
            "read": False,
            "createdAt": datetime.now(timezone.utc),
        }
        reference = (
            self.db.collection("recommendationHistory")
            .document(uid)
            .collection("items")
            .document()
        )
        reference.set(record)
        record["id"] = reference.id
        return record

    def mark_recommendation_read(self, uid: str, recommendation_id: str):
        reference = (
            self.db.collection("recommendationHistory")
            .document(uid)
            .collection("items")
            .document(recommendation_id)
        )
        snapshot = reference.get()
        if not snapshot.exists:
            return False
        reference.update({"read": True})
        return True

    # ============================================
    # AI CACHE
    # ============================================

    def get_ai_cache(self, uid: str, capability: str):
        snapshot = (
            self.db.collection("aiCache")
            .document(uid)
            .collection("capabilities")
            .document(capability)
            .get()
        )
        return snapshot.to_dict() if snapshot.exists else None

    def save_ai_cache(self, uid: str, capability: str, fingerprint: str, content: str):
        (
            self.db.collection("aiCache")
            .document(uid)
            .collection("capabilities")
            .document(capability)
            .set(
                {
                    "fingerprint": fingerprint,
                    "content": content,
                    "updatedAt": datetime.now(timezone.utc),
                }
            )
        )
