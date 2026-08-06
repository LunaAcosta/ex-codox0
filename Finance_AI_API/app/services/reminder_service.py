from datetime import datetime, timezone

from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from app.repositories.firebase_repository import FirebaseRepository


class ReminderService:
    def __init__(self):
        self.repository = FirebaseRepository()
        self.db = self.repository.db

    def list(self, uid: str):
        reminders = []
        docs = (
            self.db.collection("paymentReminders")
            .where(filter=FieldFilter("uid", "==", uid))
            .stream()
        )
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            reminders.append(data)
        reminders.sort(key=lambda item: str(item.get("dueDate", "")))
        return reminders

    def create(self, uid: str, payload: dict):
        wallet = self.db.collection("wallets").document(payload["walletId"]).get()
        if not wallet.exists or wallet.to_dict().get("uid") != uid:
            raise ValueError("La billetera seleccionada no es válida.")

        record = {
            **payload,
            "uid": uid,
            "status": "pending",
            "createdAt": datetime.now(timezone.utc),
            "processedAt": None,
            "transactionId": None,
        }
        reference = self.db.collection("paymentReminders").document()
        reference.set(record)
        record["id"] = reference.id
        return record

    def set_notification_id(self, uid: str, reminder_id: str, notification_id: str):
        reference = self.db.collection("paymentReminders").document(reminder_id)
        snapshot = reference.get()
        if not snapshot.exists or snapshot.to_dict().get("uid") != uid:
            return False
        reference.update({"notificationId": notification_id})
        return True

    def cancel(self, uid: str, reminder_id: str):
        reference = self.db.collection("paymentReminders").document(reminder_id)
        snapshot = reference.get()
        if not snapshot.exists or snapshot.to_dict().get("uid") != uid:
            return False
        if snapshot.to_dict().get("status") != "pending":
            raise ValueError("Este pago ya fue procesado.")
        reference.update({"status": "cancelled", "cancelledAt": datetime.now(timezone.utc)})
        return True

    def process(self, uid: str, reminder_id: str):
        reminder_ref = self.db.collection("paymentReminders").document(reminder_id)
        transaction_ref = self.db.collection("transactions").document()
        db_transaction = self.db.transaction()

        @firestore.transactional
        def commit(transaction):
            reminder_snapshot = reminder_ref.get(transaction=transaction)
            if not reminder_snapshot.exists:
                raise ValueError("Recordatorio no encontrado.")
            reminder = reminder_snapshot.to_dict()
            if reminder.get("uid") != uid:
                raise PermissionError("No puedes procesar este recordatorio.")
            if reminder.get("status") != "pending":
                return {**reminder, "id": reminder_id}

            wallet_ref = self.db.collection("wallets").document(reminder["walletId"])
            wallet_snapshot = wallet_ref.get(transaction=transaction)
            if not wallet_snapshot.exists or wallet_snapshot.to_dict().get("uid") != uid:
                raise ValueError("La billetera ya no está disponible.")
            wallet = wallet_snapshot.to_dict()
            amount = float(reminder.get("amount", 0))
            current_balance = float(wallet.get("amount", 0) or 0)
            if current_balance < amount:
                raise ValueError("La billetera no tiene saldo suficiente para este pago.")

            now = datetime.now(timezone.utc)
            transaction.set(wallet_ref, {
                "amount": current_balance - amount,
                "totalExpenses": float(wallet.get("totalExpenses", 0) or 0) + amount,
            }, merge=True)
            transaction.set(transaction_ref, {
                "uid": uid,
                "walletId": reminder["walletId"],
                "type": "expense",
                "amount": amount,
                "category": reminder.get("category", "services"),
                "description": f"Pago programado: {reminder.get('title', 'Pago')}",
                "date": now,
                "created": now,
                "reminderId": reminder_id,
            })
            transaction.set(reminder_ref, {
                "status": "completed",
                "processedAt": now,
                "transactionId": transaction_ref.id,
            }, merge=True)
            return {**reminder, "id": reminder_id, "status": "completed", "processedAt": now, "transactionId": transaction_ref.id}

        return commit(db_transaction)

    def process_due_auto(self):
        now = datetime.now(timezone.utc)
        processed = 0
        for snapshot in self.db.collection("paymentReminders").stream():
            reminder = snapshot.to_dict()
            due_date = reminder.get("dueDate")
            if (
                reminder.get("status") == "pending"
                and reminder.get("autoCharge") is True
                and due_date is not None
                and due_date <= now
            ):
                try:
                    self.process(reminder["uid"], snapshot.id)
                    processed += 1
                except ValueError:
                    continue
        return processed
