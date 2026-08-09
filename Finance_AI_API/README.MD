# Finance AI API

Backend en FastAPI para finanzas personales con Firebase (Auth + Firestore) y OpenAI.

## 1. Qué hace este servicio

- Valida Firebase ID tokens y restringe datos por usuario.
- Consulta usuarios, wallets, transacciones, recomendaciones y recordatorios en Firestore.
- Ejecuta capacidades de IA (summary, analyze, recommend, predict, classify, chat).
- Analiza recibos/facturas con OCR asistido por IA.

## 2. Estructura del proyecto

```text
app/
  core/                  Configuración, Firebase, seguridad y logging
  repositories/          Acceso a Firestore
  routers/               Endpoints HTTP
  schemas/               Modelos de request/response
  services/              Lógica de negocio, IA, OCR y recordatorios
  main.py                Entrypoint FastAPI (objeto app)
credentials/             Credencial local Firebase Admin (no versionar)
docs/                    Contrato y ejemplos de API
tests/                   Pruebas
```

## 3. Requisitos

- Python 3.11+
- Docker Desktop (para ejecución en contenedor)
- Proyecto Firebase con Authentication y Firestore
- API key de OpenAI
- Archivo de servicio Firebase Admin

## 4. Configuración inicial

1. Copia variables de entorno:

```powershell
Copy-Item .env.example .env
```

2. Completa en `.env` los valores reales, especialmente `OPENAI_API_KEY`.

3. Coloca la credencial Firebase Admin en:

```text
credentials/firebase-admin.json
```

Seguridad:

- No subir `.env` al repositorio.
- No subir `credentials/firebase-admin.json` al repositorio.
- No copiar secretos dentro de la imagen Docker.

## 5. Ejecución local (sin Docker)

1. Crear y activar entorno virtual:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Instalar dependencias:

```powershell
pip install -r requirements.txt
```

3. Levantar API:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

URLs útiles:

- API: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
- Health: http://127.0.0.1:8000/health/

## 6. Ejecución con contenedor (Docker Compose)

Archivos preparados:

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

Pasos:

1. Construir imagen:

```powershell
docker compose build
```

2. Levantar contenedor:

```powershell
docker compose up -d
```

3. Ver estado:

```powershell
docker compose ps
```

4. Revisar logs:

```powershell
docker logs finance-ai-api
```

5. Bajar servicios:

```powershell
docker compose down
```

Notas importantes:

- `docker-compose.yml` carga variables con `env_file: .env`.
- La credencial Firebase se monta como volumen de solo lectura:
  `./credentials/firebase-admin.json:/app/credentials/firebase-admin.json:ro`

## 7. Pruebas rápidas del servicio

1. Health:

```powershell
curl.exe -L http://localhost:8000/health/
```

2. Endpoint principal IA (protegido):

```powershell
curl.exe -X POST http://localhost:8000/ai/chat `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer TU_FIREBASE_ID_TOKEN" `
  -d "{\"uid\":\"UID_REAL_DEL_USUARIO\",\"question\":\"¿Cómo puedo ahorrar más dinero este mes?\"}"
```

Requisitos para endpoints protegidos:

- Header `Authorization: Bearer <ID_TOKEN_FIREBASE>`.
- El `uid` del body/ruta debe coincidir con el uid del token.

## 8. Rutas principales

| Área | Métodos y rutas |
|---|---|
| Sistema | `GET /`, `GET /health/`, `GET /metadata/` |
| Usuarios | `GET /users/`, `GET /users/{uid}` |
| Datos | `GET /data/financial/{uid}`, `GET /data/recommendations/{uid}` |
| Recomendaciones | `PATCH /data/recommendations/{uid}/{id}/read` |
| Recordatorios | `GET/POST /data/reminders/{uid}`, `PATCH .../notification`, `POST .../process`, `DELETE .../{id}` |
| IA | `POST /ai/summary/{uid}`, `/analyze/{uid}`, `/recommend/{uid}`, `/predict/{uid}`, `/classify/{uid}`, `/chat` |
| OCR | `POST /ai/ocr` |

Contrato completo y ejemplos:

- [docs/api.md](docs/api.md)
- [docs/CURL_EXAMPLES.md](docs/CURL_EXAMPLES.md)
- [docs/POSTMAN_TESTS.md](docs/POSTMAN_TESTS.md)

## 9. Despliegue mínimo recomendado (siguiente fase)

Para un servidor pequeño (VPS o PaaS con Docker):

1. Provisionar host Linux con Docker + Docker Compose.
2. Copiar proyecto (sin `.env` real y sin credencial en Git).
3. Cargar secretos en el servidor (`.env` y `firebase-admin.json`).
4. Ejecutar `docker compose up -d --build`.
5. Exponer servicio detrás de reverse proxy con TLS.
6. Monitorear logs y endpoint `/health/`.

## 10. Pruebas de calidad

```powershell
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m compileall -q app
```
