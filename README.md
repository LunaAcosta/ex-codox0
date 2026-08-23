# Ex-Codox

Aplicación de finanzas personales para estudiantes y personas que desean organizar sus ingresos, gastos, billeteras y ahorro con asistencia de inteligencia artificial.

**Release candidato:** `v1.0.0-rc.1`
**Estado:** frontend y Finance AI API desplegados
**Commit:** pendiente de registrar en el manifiesto final

## Problema y propuesta de valor

Muchas personas registran sus gastos sin obtener una interpretación útil de sus hábitos financieros. Ex-Codox centraliza ingresos, gastos y billeteras, y agrega estadísticas, OCR, recomendaciones, predicción y un asistente financiero conversacional.

La aplicación está orientada principalmente a estudiantes con ingresos limitados y necesidades de planificación financiera.

## Funcionalidades

- Registro e inicio de sesión con Firebase Authentication.
- Gestión de billeteras.
- Registro de ingresos y gastos.
- Estadísticas financieras.
- Recomendaciones y alertas.
- Predicción de tendencias financieras.
- Asistente conversacional Codoxia.
- OCR de recibos y facturas.
- Recordatorios de pagos.

## Arquitectura

```text
Usuario
  ↓
Expo / React Native / Expo Router
  ↓ Firebase ID Token
Cliente HTTP Axios
  ↓ Authorization: Bearer <token>
Finance AI API pública
  ├── FastAPI
  ├── Firebase Admin
  ├── Firestore
  └── OpenAI
```

### Frontend

- Expo 56.
- React Native.
- Expo Router.
- TypeScript.
- Firebase Authentication y Firestore.
- Módulos en `src/core`, `src/features` y `src/shared`.
- Configuración en [app.json](app.json).

### API

- FastAPI y Uvicorn.
- Python 3.11.
- Docker y Render.
- Firebase Admin para tokens y Firestore.
- OpenAI para capacidades financieras y OCR.

Documentación:

- [Arquitectura actual](docs/arquitectura-actual.md)
- [Arquitectura objetivo](docs/arquitectura-objetivo.md)
- [Despliegue](docs/release/deployment.md)
- [Integración frontend/API](docs/release/frontend-api-integration.md)

## Flujo crítico

```text
1. El usuario inicia sesión con Firebase Authentication.
2. Firebase entrega un ID Token.
3. El frontend envía Authorization: Bearer.
4. FastAPI valida el token con Firebase Admin.
5. La API compara el UID solicitado con el UID autenticado.
6. La API consulta Firestore.
7. Las capacidades IA usan caché u OpenAI.
8. La respuesta controlada vuelve a la aplicación.
```

## Inteligencia artificial

Capacidades disponibles:

```text
summary, analyze, recommend, predict, classify, chat, ocr
```

El modelo general y el modelo OCR se configuran en el backend. El frontend no contiene la clave de OpenAI.

Controles implementados:

- Instrucciones del sistema separadas de la entrada del usuario.
- Contexto financiero limitado.
- Límite de tokens de salida.
- Timeout y reintentos limitados.
- Caché por usuario y capacidad.
- Validación de respuestas vacías.
- Restricción al dominio financiero.

## Seguridad

- Firebase ID Token obligatorio para endpoints privados.
- Autorización por UID mediante `require_same_user()`.
- Validación Pydantic de textos, cantidades, fechas, identificadores y archivos.
- Rechazo de campos no autorizados.
- Límite de tamaño para OCR.
- Errores públicos sin stack traces ni credenciales.
- Secretos fuera del repositorio y de la imagen Docker.
- Logs sin tokens, claves ni contenido financiero innecesario.

Documentación:

- [Matriz de riesgos](docs/security/security-risk-matrix.md)
- [Controles demostrables](docs/security/demonstrable-controls.md)
- [Pruebas adversariales](docs/security/adversarial-tests.md)

## Configuración sin secretos

### Frontend

Crear `.env.local` a partir de `.env.example`:

```text
EXPO_PUBLIC_API_URL=https://URL_PUBLICA_DE_FINANCE_AI_API
EXPO_PUBLIC_FIREBASE_API_KEY=VALOR_PUBLICO_FIREBASE
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=PROYECTO.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=ID_DEL_PROYECTO
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=BUCKET_PUBLICO
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=ID_PUBLICO
EXPO_PUBLIC_FIREBASE_APP_ID=ID_PUBLICO
```

Las variables `EXPO_PUBLIC_*` son configuración pública del Firebase Web SDK. Nunca deben contener credenciales administrativas.

### Backend

Crear el entorno desde [Finance_AI_API/.env.example](Finance_AI_API/.env.example). Las variables privadas se configuran únicamente en el entorno de ejecución:

```text
OPENAI_API_KEY
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY_ID
FIREBASE_CLIENT_ID
```

No subir `.env`, `.env.preview` ni `credentials/firebase-admin.json`.

## Ejecución local

### Frontend

```powershell
npm ci
npm start
```

### Backend

```powershell
Set-Location Finance_AI_API
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health local:

```text
http://127.0.0.1:8000/health
```

## API y despliegue público

- Plataforma API: Render.
- Runtime: Docker.
- Servicio: `finance-ai-api`.
- Health: `GET /health`.
- URL pública de API: pendiente de registrar.
- URL pública de frontend: pendiente de registrar.

La configuración está en [Finance_AI_API/render.yaml](Finance_AI_API/render.yaml). Las URLs reales deben registrarse en el manifiesto antes de la presentación final.

## Docker

```powershell
docker compose -f Finance_AI_API/docker-compose.yml config --quiet
docker compose -f Finance_AI_API/docker-compose.yml up -d --build
```

El Dockerfile no copia secretos. En desarrollo, Compose carga `.env` y monta Firebase Admin en modo lectura. En Render, los secretos se configuran como variables privadas.

## Pruebas

### Frontend

```powershell
npm run test
npm run typecheck
npm run lint
npm run ci
```

### Backend

```powershell
Set-Location Finance_AI_API
python -m unittest discover -s tests -v
python -m compileall -q app
python -m pip check
```

La suite backend cubre autenticación, autorización, validación, OCR, caché, errores de proveedor y contratos API. Los smoke tests están en [Finance_AI_API/tests/smoke/test_smoke_api.py](Finance_AI_API/tests/smoke/test_smoke_api.py).

## CI/CD

El workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) se ejecuta en push a `main` o `master`, pull requests y ejecución manual.

Incluye:

- `npm ci`, tests frontend, TypeScript y ESLint.
- Instalación de requirements Python.
- `pip check`, tests backend y compilación Python.

Documentación: [docs/release/ci-cd.md](docs/release/ci-cd.md).

## Observabilidad

La API registra eventos JSON con `request_id`, estado HTTP, duración, evento, capability IA, cache hit y métricas por etapa IA.

Las respuestas incluyen:

- `X-Request-ID`.
- `X-Process-Time-Ms`.

Documentación: [docs/release/observability.md](docs/release/observability.md).

## Rendimiento

El benchmark está en [Finance_AI_API/benchmark_baseline.py](Finance_AI_API/benchmark_baseline.py) y mide solicitudes, éxitos, fallos, tasa de error, p50, p95 y máximo.

Las métricas finales aún deben capturarse contra la API pública. No se presentan valores estimados.

Documentación: [docs/release/performance.md](docs/release/performance.md).

## Rollback

El procedimiento está documentado en [docs/release/rollback-plan.md](docs/release/rollback-plan.md) e incluye activadores, responsables, restauración de API y frontend, compatibilidad de datos, backup y verificaciones posteriores.

## Release manifest

El manifiesto está en [release-manifest.yml](release-manifest.yml). Contiene versión, componentes, modelos, pruebas, observabilidad, despliegue y limitaciones sin secretos.

## Limitaciones conocidas

- Las URLs públicas deben registrarse.
- Las métricas finales deben obtenerse contra producción.
- Los smoke tests públicos requieren cuenta de demostración y token temporal.
- `npm audit` reporta vulnerabilidades transitivas pendientes.
- `pip-audit` todavía no se ha ejecutado.
- No hay rate limiting por usuario.
- No hay control de concurrencia específico para OpenAI.
- La clave OpenAI expuesta localmente debe revocarse y rotarse.
- No se ha ejecutado un rollback real en producción.

## Evidencia final

Antes de crear el tag `v1.0.0-rc.1`, conservar:

- Commit final.
- Resultado de CI.
- Pruebas backend y frontend.
- Smoke tests públicos.
- Respuesta `/health`.
- Métricas del benchmark.
- Evidencia de autenticación y UID.
- Evidencia de errores controlados.
- Confirmación de rotación de secretos.
- URL pública de frontend y API.

## Equipo

- Emely Alexandra Guevara Jimenez
- Natalia Alexandra Trigueros Blanco
- Kevin Alexander Luna Acosta
