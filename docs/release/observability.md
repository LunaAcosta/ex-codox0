# Observabilidad — Ex-Codox

**Release:** `v1.0.0-rc.1`  
**Estado:** instrumentación implementada y documentada  
**Fecha:** 2026-08-22

## Objetivo

Permitir rastrear solicitudes, medir latencia y diagnosticar fallos sin registrar tokens, claves ni el contenido financiero completo de los usuarios.

## Implementación

### Middleware HTTP

Archivo: [Finance_AI_API/app/main.py](../../Finance_AI_API/app/main.py)

El middleware `observe` se ejecuta para cada solicitud y:

1. Genera un UUID como `request_id`.
2. Lo guarda en `request.state.request_id`.
3. Mide el tiempo total con `time.perf_counter()`.
4. Añade `X-Request-ID` a la respuesta.
5. Añade `X-Process-Time-Ms` a la respuesta.
6. Registra solicitudes completadas y fallidas.

### Formato de logs

Archivo: [Finance_AI_API/app/core/logger.py](../../Finance_AI_API/app/core/logger.py)

Los eventos se serializan como JSON en stdout. Cada evento incluye, según corresponda:

```json
{
  "timestamp": "2026-08-22T18:00:00",
  "level": "INFO",
  "logger": "finance-ai",
  "message": "Request completed",
  "event": "request_completed",
  "request_id": "uuid",
  "method": "GET",
  "path": "/health",
  "status_code": 200,
  "duration_ms": 1.25
}
```

## Eventos HTTP

| Evento | Situación | Campos observados |
|---|---|---|
| `request_completed` | Solicitud procesada | `request_id`, método, ruta, estado y duración |
| `request_failed` | Excepción no controlada | `request_id`, método, ruta, estado 500, duración y tipo de error |

## Eventos IA

Archivo: [Finance_AI_API/app/services/ai_service.py](../../Finance_AI_API/app/services/ai_service.py)

Las capacidades IA registran:

- `event`;
- `request_id`;
- `capability`;
- `cache_hit`;
- `profile_ms`;
- `fingerprint_ms`;
- `cache_ms`;
- `context_ms`;
- `prompt_ms`;
- `ai_ms`;
- `save_cache_ms`;
- `save_recommendation_ms`;
- `total_ms`.

Ejemplo seguro de un cache hit:

```json
{
  "event": "ai_cache_hit",
  "request_id": "uuid",
  "capability": "predict",
  "cache_hit": true,
  "profile_ms": 0.0,
  "fingerprint_ms": 0.0,
  "cache_ms": 0.0,
  "context_ms": 0,
  "ai_ms": 0,
  "total_ms": 0.0
}
```

## Privacidad de logs

No deben registrarse:

- Firebase ID Tokens.
- API keys.
- Claves privadas.
- Contraseñas.
- Datos financieros completos innecesarios.
- Preguntas completas del usuario cuando contengan información sensible.
- Respuestas completas de OpenAI si no son necesarias para diagnóstico.

Los logs actuales registran el UID únicamente en algunos mensajes de error del router. Esta práctica debe mantenerse limitada y revisarse antes de centralizar logs públicos.

## Correlación frontend y API

El frontend recibe `ApiError` y conserva el código HTTP, mientras la API devuelve `X-Request-ID`. Para una demostración o incidente, se debe conservar:

```text
Fecha y hora
Endpoint
Código HTTP
X-Request-ID
Duración
Mensaje seguro
```

No se debe conservar el token Bearer.

## Health y versión

`GET /health` expone de forma segura:

- `status`;
- `application`;
- `environment`;
- `firebase`;
- `openai`;
- `version`;
- `timestamp`.

Esta respuesta sirve para verificar la versión desplegada, pero no reemplaza el `request_id` de los logs.

## Estado de requisitos

| Señal | Estado | Evidencia |
|---|---|---|
| `request_id` | Implementado | Middleware HTTP y header `X-Request-ID` |
| `status` | Implementado | `status_code` en logs y `/health` |
| `duration` | Implementado | `duration_ms` y `X-Process-Time-Ms` |
| `event` | Implementado | Eventos HTTP e IA |
| `capability` | Implementado para IA | Logs de `AIService` |
| `version` | Parcial | Disponible en `/health`, no agregado a cada log |
| `environment` | Parcial | Disponible en `/health`, no agregado a cada log |
| `cache_hit` | Implementado para IA | Logs `ai_cache_hit` y `ai_request_completed` |

## Evidencia que debe guardarse

- Respuesta de `/health` de la API desplegada.
- Header `X-Request-ID` de una solicitud de prueba.
- Evento JSON de una solicitud completada.
- Evento `ai_cache_hit` sin información sensible.
- Evento de error controlado con su `request_id`.
- Métricas de duración del benchmark del release.
- Confirmación de que no aparecen tokens ni claves en logs.

## Limitaciones

- No existe todavía un backend centralizado de métricas o trazas distribuidas.
- `version` y `environment` no se incluyen en todos los eventos de log.
- No hay alertas automáticas configuradas en el repositorio.
- No se ha validado la retención de logs en Render.
- El benchmark de rendimiento todavía requiere ejecutarse contra el despliegue final.
