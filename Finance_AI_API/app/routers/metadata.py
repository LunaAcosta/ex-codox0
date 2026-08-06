from fastapi import APIRouter, status

from app.core.config import settings

router = APIRouter(prefix="/metadata", tags=["General"])


@router.get(
    "/",
    summary="Información de la API",
    description="""
Devuelve la información general de la API,
incluyendo la versión, tecnologías utilizadas
y el modelo de Inteligencia Artificial configurado.
""",
    response_description="Información de la API.",
    status_code=status.HTTP_200_OK,
    responses={200: {"description": "Información obtenida correctamente."}},
)
async def metadata():

    return {
        "success": True,
        "message": "Información de la API obtenida correctamente.",
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
