from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.core.security import get_current_uid, require_same_user
from app.services.finance_service import FinanceService
from app.services.reminder_service import ReminderService
from app.schemas.reminder import PaymentReminderCreate, ReminderNotificationUpdate


router = APIRouter(prefix="/data", tags=["Data"])
finance_service = FinanceService()
reminder_service = ReminderService()


@router.get("/financial/{uid}")
async def get_financial_data(
    uid: str = Path(..., min_length=20),
    current_uid: str = Depends(get_current_uid),
):
    require_same_user(uid, current_uid)
    user = finance_service.get_user(uid)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    wallets = finance_service.get_wallets(uid)
    transactions = finance_service.get_transactions(uid)
    reminders = reminder_service.list(uid)
    transactions.sort(key=lambda item: str(item.get("date", "")), reverse=True)
    return {
        "success": True,
        "message": "Datos financieros actualizados.",
        "data": {
            "wallets": wallets,
            "transactions": transactions,
            "reminders": reminders,
        },
    }


@router.get("/recommendations/{uid}")
async def get_recommendations(
    uid: str = Path(..., min_length=20),
    current_uid: str = Depends(get_current_uid),
):
    require_same_user(uid, current_uid)
    recommendations = finance_service.get_recommendations(uid)
    return {
        "success": True,
        "message": "Historial de recomendaciones obtenido.",
        "count": len(recommendations),
        "data": recommendations[:50],
    }


@router.patch("/recommendations/{uid}/{recommendation_id}/read")
async def mark_recommendation_read(
    uid: str,
    recommendation_id: str,
    current_uid: str = Depends(get_current_uid),
):
    require_same_user(uid, current_uid)
    updated = finance_service.repository.mark_recommendation_read(uid, recommendation_id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recomendación no encontrada.")
    return {"success": True, "message": "Recomendación marcada como leída.", "data": None}


@router.get("/reminders/{uid}")
async def get_payment_reminders(uid: str = Path(..., min_length=20), current_uid: str = Depends(get_current_uid)):
    require_same_user(uid, current_uid)
    data = reminder_service.list(uid)
    return {"success": True, "message": "Pagos programados actualizados.", "count": len(data), "data": data}


@router.post("/reminders/{uid}", status_code=status.HTTP_201_CREATED)
async def create_payment_reminder(payload: PaymentReminderCreate, uid: str = Path(..., min_length=20), current_uid: str = Depends(get_current_uid)):
    require_same_user(uid, current_uid)
    try:
        data = reminder_service.create(uid, payload.model_dump())
        return {"success": True, "message": "Pago programado.", "data": data}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/reminders/{uid}/{reminder_id}/notification")
async def save_reminder_notification(payload: ReminderNotificationUpdate, uid: str, reminder_id: str, current_uid: str = Depends(get_current_uid)):
    require_same_user(uid, current_uid)
    if not reminder_service.set_notification_id(uid, reminder_id, payload.notificationId):
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado.")
    return {"success": True, "message": "Notificación vinculada.", "data": None}


@router.post("/reminders/{uid}/{reminder_id}/process")
async def process_payment_reminder(uid: str, reminder_id: str, current_uid: str = Depends(get_current_uid)):
    require_same_user(uid, current_uid)
    try:
        data = reminder_service.process(uid, reminder_id)
        return {"success": True, "message": "Pago registrado como gasto.", "data": data}
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/reminders/{uid}/{reminder_id}")
async def cancel_payment_reminder(uid: str, reminder_id: str, current_uid: str = Depends(get_current_uid)):
    require_same_user(uid, current_uid)
    try:
        if not reminder_service.cancel(uid, reminder_id):
            raise HTTPException(status_code=404, detail="Recordatorio no encontrado.")
        return {"success": True, "message": "Recordatorio cancelado.", "data": None}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
