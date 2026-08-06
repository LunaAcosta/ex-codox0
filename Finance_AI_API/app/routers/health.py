from datetime import datetime

from fastapi import APIRouter, status

from app.core.config import settings
from app.core.firebase import FirebaseClient

router = APIRouter(prefix="/health", tags=["Health"])


@router.get(
    "/",
    summary="Verificar estado de la API",
    description="""
Permite verificar el estado general de la API.

Este endpoint comprueba que la aplicación se encuentra en ejecución
y valida la conexión con Firebase.

Es recomendado utilizar este endpoint antes de consumir
los servicios inteligentes de la API.
""",
    response_description="Estado general de la API.",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "La API está funcionando correctamente."},
        500: {"description": "Error interno del servidor."},
    },
)
async def health():

    firebase_status = "Disconnected"

    try:
        db = FirebaseClient.get_db()

        list(db.collection("users").limit(1).stream())

        firebase_status = "Connected"

    except Exception:
        firebase_status = "Disconnected"

    return {
        "success": True,
        "message": "API funcionando correctamente.",
        "data": {
            "status": "running",
            "firebase": firebase_status,
            "openai": "Configured",
            "version": settings.APP_VERSION,
            "timestamp": datetime.now().isoformat(),
        },
    }
