from datetime import datetime

from pydantic import BaseModel, Field


class PaymentReminderCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=80)
    amount: float = Field(..., gt=0)
    walletId: str = Field(..., min_length=1)
    dueDate: datetime
    category: str = Field(default="services", max_length=40)
    autoCharge: bool = False


class ReminderNotificationUpdate(BaseModel):
    notificationId: str = Field(..., min_length=1, max_length=200)
