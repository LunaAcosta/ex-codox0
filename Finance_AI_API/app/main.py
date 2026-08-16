import asyncio
import time
import uuid
from contextlib import suppress

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.firebase import FirebaseClient
from app.core.constants import ApiInfo, OPENAPI_TAGS
from app.core.config import settings
from app.core.logger import logger

from app.routers.health import router as health_router
from app.routers.metadata import router as metadata_router
from app.routers.users import router as users_router
from app.routers.ai import router as ai_router
from app.routers.data import router as data_router

from app.services.reminder_service import ReminderService


# ==========================================================
# Inicializar Firebase
# ==========================================================

FirebaseClient.initialize()


# ==========================================================
# Crear aplicación
# ==========================================================

app = FastAPI(
    title=ApiInfo.TITLE,
    version=ApiInfo.VERSION,
    description=ApiInfo.DESCRIPTION,
    openapi_tags=OPENAPI_TAGS,
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# OBSERVABILIDAD
# ==========================================================

@app.middleware("http")
async def observe(request: Request, call_next):
    """
    Middleware de observabilidad.

    Genera un request_id para cada solicitud, mide el tiempo
    total de procesamiento y registra el resultado.
    """

    request_id = str(uuid.uuid4())

    start = time.perf_counter()

    # Guardamos el request_id en el estado de la solicitud
    # para que otros componentes puedan utilizarlo.
    request.state.request_id = request_id

    try:
        response = await call_next(request)

        duration_ms = (time.perf_counter() - start) * 1000

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"

        logger.info(
            "Request completed",
            extra={
                "extra_fields": {
                    "event": "request_completed",
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration_ms, 2),
                }
            },
        )

        return response

    except Exception as exc:
        duration_ms = (time.perf_counter() - start) * 1000

        logger.exception(
            "Request failed",
            extra={
                "extra_fields": {
                    "event": "request_failed",
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": 500,
                    "duration_ms": round(duration_ms, 2),
                    "error_type": type(exc).__name__,
                }
            },
        )

        raise


# ==========================================================
# Routers
# ==========================================================

app.include_router(health_router)
app.include_router(metadata_router)
app.include_router(users_router)
app.include_router(ai_router)
app.include_router(data_router)


# ==========================================================
# PAYMENT REMINDER WORKER
# ==========================================================

async def _payment_reminder_worker():
    service = ReminderService()

    while True:
        await asyncio.to_thread(service.process_due_auto)
        await asyncio.sleep(60)


@app.on_event("startup")
async def start_payment_reminder_worker():
    app.state.payment_reminder_task = asyncio.create_task(
        _payment_reminder_worker()
    )


@app.on_event("shutdown")
async def stop_payment_reminder_worker():
    task = getattr(app.state, "payment_reminder_task", None)

    if task:
        task.cancel()

        with suppress(asyncio.CancelledError):
            await task


# ==========================================================
# Root
# ==========================================================

@app.get(
    "/",
    tags=["General"],
    summary="Información principal",
    description="Devuelve información general de la API.",
)
async def root():
    return {
        "success": True,
        "message": ApiInfo.NAME,
        "data": {
            "version": ApiInfo.VERSION,
            "status": "running",
            "documentation": "/docs",
        },
    }