from fastapi import APIRouter, Depends, File, HTTPException, Path, UploadFile, status, Request

from app.services.ai_service import AIService, AICapability
from app.schemas.ai import AIResponse, ErrorResponse, OCRResponse
from app.core.constants import (
    Tags,
    Messages,
    ResponseDescriptions,
)
from app.schemas.ai import ChatRequest, ChatResponse
from app.core.logger import logger
from app.core.security import get_current_uid, require_same_user
from app.core.config import settings
from app.services.ocr_service import OCRService

router = APIRouter(
    prefix="/ai",
    tags=[Tags.AI],
)

ai_service = AIService()
ocr_service = OCRService()

ALLOWED_OCR_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


# =====================================================
# OCR FINANCIERO
# =====================================================


@router.post(
    "/ocr",
    response_model=OCRResponse,
    status_code=status.HTTP_200_OK,
    summary="Analizar recibo o factura",
    description="Extrae monto, fecha, descripción y categoría de una imagen financiera.",
    responses={
        400: {"model": ErrorResponse, "description": "Archivo no válido."},
        413: {"model": ErrorResponse, "description": "Archivo demasiado grande."},
        500: {"model": ErrorResponse, "description": "Error interno del servidor."},
    },
)
async def extract_financial_document(
    file: UploadFile = File(...),
    current_uid: str = Depends(get_current_uid),
):
    del current_uid  # La autenticación es obligatoria aunque OCR no consulta Firestore.

    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_OCR_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selecciona una imagen JPG, PNG, WEBP o GIF.",
        )

    content = await file.read()
    max_size = settings.OCR_MAX_FILE_SIZE_MB * 1024 * 1024
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen está vacía.",
        )
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"La imagen supera el límite de {settings.OCR_MAX_FILE_SIZE_MB} MB.",
        )

    try:
        data = ocr_service.extract(content, content_type)
        return OCRResponse(data=data)
    except ValueError as ex:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(ex),
        ) from ex
    except Exception as ex:
        logger.exception("Error procesando OCR")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible analizar el documento.",
        ) from ex


# =====================================================
# AI SUMMARY
# =====================================================


@router.post(
    "/summary/{uid}",
    response_model=AIResponse,
    status_code=status.HTTP_200_OK,
    summary="Generar resumen financiero",
    description="""
Genera un resumen financiero utilizando Inteligencia Artificial
a partir de la información financiera almacenada en Firebase.
""",
    response_description=ResponseDescriptions.SUMMARY,
    responses={
        404: {"model": ErrorResponse, "description": "Usuario no encontrado."},
        500: {"model": ErrorResponse, "description": "Error interno del servidor."},
    },
)
async def generate_summary(
    uid: str = Path(
        ...,
        title="UID",
        description="UID del usuario registrado en Firebase.",
        examples=["6NLMplhbdTPAoQz2R66Tb3p8ay43"],
    ),
    current_uid: str = Depends(get_current_uid),
):

    require_same_user(uid, current_uid)

    try:
        summary = ai_service.execute(
            uid=uid,
            capability=AICapability.SUMMARY,
        )

        return AIResponse(
            success=True,
            message=Messages.SUMMARY_GENERATED,
            data={
                "uid": uid,
                "summary": summary,
            },
        )

    except ValueError as ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ex),
        )

    except Exception as ex:
        logger.exception("Error generando resumen para uid=%s", uid)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible generar el resumen financiero.",
        )


# =====================================================
# AI ANALYZE
# =====================================================


@router.post(
    "/analyze/{uid}",
    response_model=AIResponse,
    status_code=status.HTTP_200_OK,
    summary="Analizar perfil financiero",
    description="""
Realiza un análisis inteligente del perfil financiero del usuario.

La IA identifica fortalezas, debilidades, riesgos y oportunidades
utilizando la información almacenada en Firebase.
""",
    response_description=ResponseDescriptions.ANALYZE,
    responses={
        404: {"model": ErrorResponse, "description": "Usuario no encontrado."},
        500: {"model": ErrorResponse, "description": "Error interno del servidor."},
    },
)
async def analyze_finances(
    uid: str = Path(
        ...,
        title="UID",
        description="UID del usuario registrado en Firebase.",
        examples=["6NLMplhbdTPAoQz2R66Tb3p8ay43"],
    ),
    current_uid: str = Depends(get_current_uid),
):

    require_same_user(uid, current_uid)

    try:
        analysis = ai_service.execute(
            uid=uid,
            capability=AICapability.ANALYZE,
        )

        return AIResponse(
            success=True,
            message=Messages.ANALYSIS_GENERATED,
            data={
                "uid": uid,
                "analysis": analysis,
            },
        )

    except ValueError as ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ex),
        )

    except Exception as ex:
        logger.exception("Error generando análisis para uid=%s", uid)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible generar el análisis financiero.",
        )


# =====================================================
# AI RECOMMEND
# =====================================================


@router.post(
    "/recommend/{uid}",
    response_model=AIResponse,
    status_code=status.HTTP_200_OK,
    summary="Generar recomendaciones financieras",
    description="""
Genera recomendaciones financieras personalizadas utilizando
Inteligencia Artificial.
""",
    response_description=ResponseDescriptions.RECOMMEND,
    responses={
        404: {"model": ErrorResponse, "description": "Usuario no encontrado."},
        500: {"model": ErrorResponse, "description": "Error interno del servidor."},
    },
)
async def recommend_finances(
    uid: str = Path(
        ...,
        title="UID",
        description="UID del usuario registrado en Firebase.",
        examples=["6NLMplhbdTPAoQz2R66Tb3p8ay43"],
    ),
    current_uid: str = Depends(get_current_uid),
):

    require_same_user(uid, current_uid)

    try:
        recommendations = ai_service.execute(
            uid=uid,
            capability=AICapability.RECOMMEND,
        )

        return AIResponse(
            success=True,
            message=Messages.RECOMMENDATIONS_GENERATED,
            data={
                "uid": uid,
                "recommendations": recommendations,
            },
        )

    except ValueError as ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ex),
        )

    except Exception as ex:
        logger.exception("Error generando recomendaciones para uid=%s", uid)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible generar las recomendaciones financieras.",
        )


# =====================================================
# AI PREDICT
# =====================================================

@router.post(
    "/predict/{uid}",
    response_model=AIResponse,
    status_code=status.HTTP_200_OK,
    summary="Predecir comportamiento financiero",
    description="""
    Genera una predicción del comportamiento financiero futuro del usuario
    utilizando Inteligencia Artificial.
    """,
    response_description=ResponseDescriptions.PREDICT,
    responses={
        404: {
            "model": ErrorResponse,
            "description": "Usuario no encontrado.",
        },
        500: {
            "model": ErrorResponse,
            "description": "Error interno del servidor.",
        },
    },
)
async def predict_finances(
    request: Request,
    uid: str = Path(
        ...,
        title="UID",
        description="UID del usuario registrado en Firebase.",
        examples=["6NLMplhbdTPAoQz2R66Tb3p8ay43"],
    ),
    current_uid: str = Depends(get_current_uid),
):
    require_same_user(uid, current_uid)

    try:
        prediction = ai_service.execute(
            uid=uid,
            capability=AICapability.PREDICT,
            request_id=request.state.request_id,
        )

        return AIResponse(
            success=True,
            message=Messages.PREDICTION_GENERATED,
            data={
                "uid": uid,
                "prediction": prediction,
            },
        )

    except ValueError as ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ex),
        )

    except Exception:
        logger.exception(
            "Error generando predicción",
            extra={
                "extra_fields": {
                    "event": "ai_prediction_failed",
                    "request_id": request.state.request_id,
                }
            },
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible generar la predicción financiera.",
        )

# =====================================================
# AI CLASSIFY
# =====================================================


@router.post(
    "/classify/{uid}",
    response_model=AIResponse,
    status_code=status.HTTP_200_OK,
    summary="Clasificar perfil financiero",
    description="""
Clasifica automáticamente el perfil financiero del usuario
utilizando Inteligencia Artificial.
""",
    response_description=ResponseDescriptions.CLASSIFY,
    responses={
        404: {"model": ErrorResponse, "description": "Usuario no encontrado."},
        500: {"model": ErrorResponse, "description": "Error interno del servidor."},
    },
)
async def classify_finances(
    uid: str = Path(
        ...,
        title="UID",
        description="UID del usuario registrado en Firebase.",
        examples=["6NLMplhbdTPAoQz2R66Tb3p8ay43"],
    ),
    current_uid: str = Depends(get_current_uid),
):

    require_same_user(uid, current_uid)

    try:
        classification = ai_service.execute(
            uid=uid,
            capability=AICapability.CLASSIFY,
        )

        return AIResponse(
            success=True,
            message=Messages.CLASSIFICATION_GENERATED,
            data={
                "uid": uid,
                "classification": classification,
            },
        )

    except ValueError as ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ex),
        )

    except Exception as ex:
        logger.exception("Error clasificando el perfil para uid=%s", uid)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible clasificar el perfil financiero.",
        )


# =====================================================
# AI CHAT
# =====================================================


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat financiero con IA",
    description="""
Permite realizar preguntas sobre la situación financiera del usuario.

La Inteligencia Artificial utilizará el perfil financiero almacenado
en Firebase para responder de forma personalizada.
""",
    response_description=ResponseDescriptions.CHAT,
    responses={
        404: {"model": ErrorResponse, "description": "Usuario no encontrado."},
        500: {"model": ErrorResponse, "description": "Error interno del servidor."},
    },
)
async def financial_chat(
    request: ChatRequest,
    current_uid: str = Depends(get_current_uid),
):

    require_same_user(request.uid, current_uid)

    try:
        answer = ai_service.chat(
            uid=request.uid,
            question=request.question,
        )

        return ChatResponse(
            data={
                "uid": request.uid,
                "question": request.question,
                "answer": answer,
            }
        )

    except ValueError as ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ex),
        )

    except Exception as ex:
        logger.exception("Error en chat financiero para uid=%s", request.uid)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible responder la consulta financiera.",
        )
