# Finance AI API

Backend de Finance App construido con FastAPI. Valida usuarios con Firebase Authentication, centraliza el acceso a Firestore y expone OCR, análisis financiero con IA, recomendaciones persistentes y recordatorios de pago.

## Responsabilidades

- Validar Firebase ID tokens y aislar los datos por usuario.
- Consultar billeteras, movimientos, recomendaciones y recordatorios en Firestore.
- Generar respuestas financieras breves y enfocadas con OpenAI.
- Extraer monto, fecha del recibo, descripción y categoría desde imágenes.
- Reutilizar resultados de IA cuando los datos financieros no han cambiado.
- Convertir recordatorios vencidos con cargo automático en gastos.

## Estructura

```text
app/
  core/                 Configuración, Firebase, seguridad y logging
  repositories/         Acceso a Firestore
  routers/              Rutas HTTP
  schemas/              Modelos de entrada y salida
  services/             Reglas financieras, IA, OCR y recordatorios
  main.py               Aplicación FastAPI
credentials/            Credenciales locales de Firebase Admin (ignoradas por Git)
docs/                    Contrato y ejemplos de la API
tests/                   Pruebas automatizadas
```

## Requisitos

- Python 3.11 o superior.
- Un proyecto Firebase con Authentication y Firestore.
- Una clave de OpenAI.
- El archivo de cuenta de servicio Firebase Admin.

## Instalación

```powershell
cd C:\Users\CM\Documents\FinanceApp\Finance_AI_API
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Guarda la cuenta de servicio en:

```text
credentials/firebase-admin.json
```

No publiques ese archivo ni el `.env`.

## Configuración

Variables principales:

```dotenv
APP_NAME=Finance AI API
APP_VERSION=1.0.0
ENVIRONMENT=development
HOST=127.0.0.1
PORT=8000
CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081

OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-5.5
OPENAI_MAX_OUTPUT_TOKENS=220
OPENAI_OCR_MODEL=gpt-4.1-mini
OCR_MAX_FILE_SIZE_MB=10
```

El modelo y el límite de salida son configurables. Mantener un límite corto reduce costo y evita respuestas extensas. La implementación actual de Firebase Admin carga `credentials/firebase-admin.json`.

## Ejecución

Para uso local en la misma computadora:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Para permitir conexiones desde un teléfono en la red local:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Recursos disponibles:

- API: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Salud: `http://127.0.0.1:8000/health/`

## Autenticación y privacidad

Las rutas `/ai`, `/data` y `/users` requieren:

```http
Authorization: Bearer FIREBASE_ID_TOKEN
```

Cuando una ruta contiene `{uid}`, ese valor debe coincidir con el usuario del token. La API responde `401` si falta o no es válido y `403` si se intenta acceder a otro usuario. `/`, `/health/` y `/metadata/` son públicas.

## Rutas principales

| Área | Métodos y rutas |
|---|---|
| Sistema | `GET /`, `GET /health/`, `GET /metadata/` |
| Usuarios | `GET /users/`, `GET /users/{uid}` |
| Datos | `GET /data/financial/{uid}`, `GET /data/recommendations/{uid}` |
| Recomendaciones | `PATCH /data/recommendations/{uid}/{id}/read` |
| Recordatorios | `GET/POST /data/reminders/{uid}`, `PATCH .../notification`, `POST .../process`, `DELETE .../{id}` |
| IA | `POST /ai/summary/{uid}`, `/analyze/{uid}`, `/recommend/{uid}`, `/predict/{uid}`, `/classify/{uid}`, `/chat` |
| OCR | `POST /ai/ocr` |

El contrato completo, payloads y respuestas están en [docs/api.md](docs/api.md).

## Persistencia y consumo de IA

Las consultas financieras normales se resuelven desde Firestore y no consumen tokens. Los resultados reutilizables de IA se asocian a una huella de los datos financieros; al cambiar la información, la siguiente solicitud genera un resultado actualizado. Las recomendaciones generadas se guardan en el historial del usuario.

Los recordatorios con `autoCharge=true` pueden ser procesados por el servicio al vencer. El procesamiento crea el gasto, descuenta la billetera y marca el recordatorio como completado de forma coherente.

## Pruebas

```powershell
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m compileall -q app
```

Para revisar el contrato interactivo, inicia el servidor y utiliza Swagger. También existen ejemplos complementarios en `docs/CURL_EXAMPLES.md` y `docs/POSTMAN_TESTS.md`.
