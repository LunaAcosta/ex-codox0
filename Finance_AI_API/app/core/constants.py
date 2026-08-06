# ==========================================================
# API INFORMATION
# ==========================================================


class ApiInfo:
    NAME = "Finance AI API"
    VERSION = "1.0.0"

    TITLE = f"{NAME} v{VERSION}"

    DESCRIPTION = """
# 💰 Finance AI API

API REST Inteligente para el análisis financiero utilizando
FastAPI, Firebase Firestore y OpenAI.

---

## Tecnologías

- ⚡ FastAPI
- 🔥 Firebase Firestore
- 🤖 OpenAI
- 📄 Swagger UI

---

## Módulos

### General

- GET /

- GET /health

- GET /metadata

---

### Usuarios

- GET /users

- GET /users/{uid}

---

### Inteligencia Artificial

- POST /ai/summary/{uid}

- POST /ai/analyze/{uid}

- POST /ai/recommend/{uid}

- POST /ai/predict/{uid}

- POST /ai/classify/{uid}

- POST /ai/chat

- POST /ai/ocr
"""


# ==========================================================
# TAGS
# ==========================================================


class Tags:
    GENERAL = "General"

    HEALTH = "Health"

    USERS = "Users"

    AI = "Artificial Intelligence"


# ==========================================================
# SWAGGER TAGS
# ==========================================================

OPENAPI_TAGS = [
    {"name": Tags.GENERAL, "description": "Información general de la API."},
    {"name": Tags.HEALTH, "description": "Verificación del estado del servicio."},
    {
        "name": Tags.USERS,
        "description": "Consulta de usuarios registrados en Firebase.",
    },
    {
        "name": Tags.AI,
        "description": "Capacidades de Inteligencia Artificial basadas en OpenAI.",
    },
]


# ==========================================================
# MESSAGES
# ==========================================================


class Messages:
    API_RUNNING = "API funcionando correctamente."

    API_INFORMATION = "Información obtenida correctamente."

    USERS_FOUND = "Usuarios obtenidos correctamente."

    USER_FOUND = "Usuario obtenido correctamente."

    USER_NOT_FOUND = "Usuario no encontrado."

    SUMMARY_GENERATED = "Resumen financiero generado correctamente."

    ANALYSIS_GENERATED = "Análisis financiero generado correctamente."

    RECOMMENDATIONS_GENERATED = "Recomendaciones generadas correctamente."

    PREDICTION_GENERATED = "Predicción financiera generada correctamente."

    CLASSIFICATION_GENERATED = "Clasificación financiera generada correctamente."

    CHAT_GENERATED = "Respuesta generada correctamente."

    INTERNAL_ERROR = "Error interno del servidor."


# ==========================================================
# RESPONSE DESCRIPTIONS
# ==========================================================


class ResponseDescriptions:
    HEALTH = "Estado del servicio."

    METADATA = "Información general de la API."

    USERS = "Listado de usuarios."

    USER = "Información del usuario."

    SUMMARY = "Resumen financiero generado mediante IA."

    ANALYZE = "Análisis financiero generado mediante IA."

    RECOMMEND = "Recomendaciones financieras generadas mediante IA."

    PREDICT = "Predicción financiera generada mediante IA."

    CLASSIFY = "Clasificación financiera generada mediante IA."

    CHAT = "Respuesta generada por la IA."


# ==========================================================
# AI CAPABILITIES
# ==========================================================


class AICapabilities:
    SUMMARY = "summary"

    ANALYZE = "analyze"

    RECOMMEND = "recommend"

    PREDICT = "predict"

    CLASSIFY = "classify"

    CHAT = "chat"
