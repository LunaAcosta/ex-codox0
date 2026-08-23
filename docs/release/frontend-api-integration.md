# Integración Frontend → Finance AI API

**Release:** `v1.0.0-rc.1`  
**Estado:** integración implementada y documentada  
**Fecha:** 2026-08-22

## Arquitectura

```text
Expo / React Native
  ↓
AuthProvider + Firebase Authentication
  ↓ Firebase ID Token
httpClient (Axios)
  ↓ Authorization: Bearer <token>
apiClient (errores y métodos HTTP)
  ↓
Repositorios de features
  ↓
Finance AI API pública
```

El frontend no importa módulos internos de Python ni accede directamente a servicios internos del backend. La comunicación se realiza mediante endpoints HTTP de la API.

## Componentes involucrados

### Configuración de API

Archivo: [src/core/config/api.ts](../../src/core/config/api.ts)

- Lee `EXPO_PUBLIC_API_URL`.
- Elimina el slash final de la URL.
- Usa `http://127.0.0.1:8000` únicamente como fallback local.
- Define timeout frontend de `90.000 ms`.

Para el build público, `EXPO_PUBLIC_API_URL` debe apuntar a la URL desplegada de Render. El repositorio no contiene la URL pública real.

### Cliente HTTP

Archivo: [src/core/network/httpClient.ts](../../src/core/network/httpClient.ts)

- Usa Axios.
- Define `Accept: application/json`.
- Define `Content-Type: application/json`.
- Obtiene `auth.currentUser`.
- Solicita `getIdToken()`.
- Envía `Authorization: Bearer <Firebase ID Token>`.

### Cliente de API

Archivo: [src/core/network/apiClient.ts](../../src/core/network/apiClient.ts)

- Centraliza `GET`, `POST`, `PATCH`, `DELETE` y `multipart/form-data`.
- Convierte errores Axios a `ApiError`.
- Conserva el código HTTP.
- Devuelve mensajes controlados para fallos de conexión.
- Mantiene un reintento breve para cargas multipart sin respuesta HTTP.

### Repositorios

- Finanzas y operaciones generales: [src/features/financeApi/infrastructure/FinanceApiRepository.ts](../../src/features/financeApi/infrastructure/FinanceApiRepository.ts)
- Chat Codoxia: [src/features/codoxia/infrastructure/api/ApiChatRepository.ts](../../src/features/codoxia/infrastructure/api/ApiChatRepository.ts)
- OCR: [src/features/ocr/infrastructure/api/ApiOCRRepository.ts](../../src/features/ocr/infrastructure/api/ApiOCRRepository.ts)

## Endpoints consumidos

| Funcionalidad | Método | Endpoint |
|---|---|---|
| Información raíz | GET | `/` |
| Health | GET | `/health` |
| Metadata | GET | `/metadata/` |
| Usuario autenticado | GET | `/users/` |
| Usuario por UID | GET | `/users/{uid}` |
| Datos financieros | GET | `/data/financial/{uid}` |
| Recomendaciones | GET | `/data/recommendations/{uid}` |
| Marcar recomendación | PATCH | `/data/recommendations/{uid}/{id}/read` |
| Recordatorios | GET/POST/PATCH/DELETE | `/data/reminders/...` |
| Capacidades IA | POST | `/ai/{capability}/{uid}` |
| Chat financiero | POST | `/ai/chat` |
| OCR | POST multipart | `/ai/ocr` |

Las capacidades IA consumidas son:

```text
summary
analyze
recommend
predict
classify
```

## Flujo de autenticación

```text
1. El usuario inicia sesión con Firebase Authentication.
2. AuthProvider mantiene el estado de sesión.
3. Axios consulta auth.currentUser antes de cada solicitud.
4. Firebase entrega un ID Token.
5. Axios añade Authorization: Bearer <token>.
6. FastAPI valida el token con Firebase Admin.
7. FastAPI compara el UID autenticado con el UID solicitado.
8. La operación continúa solo si la autorización es válida.
```

## Flujo de errores

| Situación | Comportamiento frontend |
|---|---|
| Sin respuesta de red | `ApiError` de conexión |
| Error HTTP con `detail` | Conserva el mensaje controlado de la API |
| Error HTTP con `message` | Usa el mensaje de la API |
| Error desconocido | Mensaje genérico |
| Respuesta IA vacía | Error controlado en `FinanceApiRepository` |
| Sesión ausente | La API responde `401` |
| UID no autorizado | La API responde `403` |

## OCR

El repositorio OCR:

- Construye un `FormData`.
- Usa `Blob` en web.
- Usa URI, nombre y MIME en plataformas nativas.
- Envía la imagen a `/ai/ocr`.
- No contiene la clave OpenAI.

## Configuración de despliegue

Variable requerida para el frontend:

```text
EXPO_PUBLIC_API_URL=https://URL_PUBLICA_DE_FINANCE_AI_API
```

La URL exacta debe registrarse en [docs/release/deployment.md](deployment.md) cuando se prepare la evidencia final.

## Seguridad de la integración

- El frontend no contiene `OPENAI_API_KEY`.
- El token Firebase se envía en el header, no en la URL.
- Los UID se codifican con `encodeURIComponent` en los repositorios.
- Los errores de conexión no muestran secretos.
- Las imágenes OCR se envían a la API y no directamente a OpenAI.
- Las respuestas IA se comprueban antes de entregarlas a la capa de feature.

## Observaciones y limitaciones

- El timeout del frontend es de 90 segundos.
- El backend limita la llamada a OpenAI a 30 segundos.
- Existe un reintento para cargas multipart sin respuesta HTTP.
- Todavía no existe rate limiting frontend específico.
- La URL pública real no está registrada en el repositorio.
- La integración debe probarse desde otra red y otro dispositivo.

## Evidencia requerida

- Captura de la configuración pública sin secretos.
- Solicitud HTTP con `Authorization` redactado.
- Respuesta de `/health` con código `200`.
- Flujo de login seguido de consulta financiera.
- Respuesta `401` sin token.
- Respuesta `403` con UID ajeno.
- Prueba de OCR sin mostrar imágenes sensibles.
- URL pública final del frontend y API.

## Criterio de aceptación

La integración se considera verificada cuando el frontend desplegado:

- utiliza la URL pública de la API;
- adjunta el Firebase ID Token;
- obtiene datos del usuario autenticado;
- consume al menos una capacidad IA;
- procesa un error `401` y un `403` sin bloquear la aplicación;
- no expone claves privadas;
- funciona fuera del equipo de desarrollo.
