from fastapi import APIRouter, status

from app.core.config import settings
from app.core.constants import (
    Messages,
    ResponseDescriptions,
    Tags,
)

from app.schemas.response import (
    ApiResponse,
    ErrorResponse,
)

router = APIRouter(
    prefix="/metadata",
    tags=[Tags.GENERAL],
)


@router.get(
    "/",
    summary="Información de la API",
    description="""
Obtiene la información general de la API.

Este endpoint permite consultar:

- Nombre de la API
- Versión
- Framework
- Base de datos
- Modelo de IA utilizado
""",
    response_model=ApiResponse,
    response_description=ResponseDescriptions.METADATA,
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "Información obtenida correctamente.",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Información de la API obtenida correctamente.",
                        "data": {
                            "name": "Finance AI API",
                            "version": "1.0.0",
                            "description": "API REST Inteligente para Gestión Financiera.",
                            "framework": "FastAPI",
                            "database": "Firebase Firestore",
                            "ai": "OpenAI",
                            "model": "gpt-5.5",
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
async def metadata():

    return {
        "success": True,
        "message": Messages.API_INFORMATION,
        "data": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "description": "API REST Inteligente para Gestión Financiera.",
            "framework": "FastAPI",
            "database": "Firebase Firestore",
            "ai": "OpenAI",
            "model": settings.OPENAI_MODEL,
        },
    }
