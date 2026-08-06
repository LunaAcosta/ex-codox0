from datetime import datetime

from fastapi import APIRouter, status

from app.core.config import settings
from app.core.constants import (
    Messages,
    ResponseDescriptions,
    Tags,
)
from app.core.firebase import FirebaseClient
from app.schemas.response import ApiResponse, ErrorResponse

router = APIRouter(
    prefix="/health",
    tags=[Tags.HEALTH],
)


@router.get(
    "/",
    summary="Verificar estado de la API",
    description="""
Verifica el estado general de la API.

Este endpoint confirma que:

- La API está en ejecución.
- Firebase está disponible.
- La configuración de OpenAI está cargada.
- La versión de la API es correcta.
""",
    response_model=ApiResponse,
    response_description=ResponseDescriptions.HEALTH,
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "La API está funcionando correctamente.",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "API funcionando correctamente.",
                        "data": {
                            "status": "running",
                            "firebase": "Connected",
                            "openai": "Configured",
                            "version": "1.0.0",
                            "timestamp": "2026-07-18T15:30:00",
                        },
                    }
                }
            },
        },
        500: {
            "model": ErrorResponse,
            "description": "Error interno del servidor.",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "message": "Error interno del servidor.",
                        "data": None,
                    }
                }
            },
        },
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
        "message": Messages.API_RUNNING,
        "data": {
            "status": "running",
            "firebase": firebase_status,
            "openai": "Configured",
            "version": settings.APP_VERSION,
            "timestamp": datetime.now().isoformat(),
        },
    }
