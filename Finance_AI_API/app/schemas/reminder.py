from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PaymentReminderCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=2, max_length=80)
    amount: float = Field(..., gt=0, le=10_000_000)
    walletId: str = Field(..., min_length=1, max_length=128)
    dueDate: datetime
    category: str = Field(default="services", min_length=1, max_length=40)
    autoCharge: bool = False

    @field_validator("title", "walletId", "category")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("El campo no puede estar vacío.")
        return normalized


class ReminderNotificationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    notificationId: str = Field(..., min_length=1, max_length=200)

    @field_validator("notificationId")
    @classmethod
    def reject_blank_notification_id(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("El identificador no puede estar vacío.")
        return normalized
