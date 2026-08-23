# Controles de seguridad demostrables

**Release evaluado:** `v1.0.0-rc.1`  
**Fecha:** 2026-08-22

Este documento describe tres controles verificables en el código actual. Los resultados indicados corresponden a pruebas ejecutadas localmente; no representan evidencia de producción.

## Control 1 — Firebase Authentication y autorización por UID

### Riesgo mitigado

Acceso no autorizado a datos financieros pertenecientes a otro usuario.

### Implementación

- [Finance_AI_API/app/core/security.py](../../Finance_AI_API/app/core/security.py)
  - `get_current_uid()` exige un esquema Bearer.
  - Firebase Admin valida el ID token.
  - Los errores devuelven `401` sin incluir el token.
  - `require_same_user()` compara el UID solicitado con el UID autenticado.
- [Finance_AI_API/app/routers/ai.py](../../Finance_AI_API/app/routers/ai.py)
- [Finance_AI_API/app/routers/data.py](../../Finance_AI_API/app/routers/data.py)
- [Finance_AI_API/app/routers/users.py](../../Finance_AI_API/app/routers/users.py)

### Cómo funciona

```text
Authorization: Bearer <Firebase ID Token>
        ↓
get_current_uid()
        ↓
UID autenticado
        ↓
require_same_user(uid solicitado, UID autenticado)
        ↓
Acceso permitido o 403
```

### Prueba realizada

Archivo: [Finance_AI_API/tests/test_api_contracts.py](../../Finance_AI_API/tests/test_api_contracts.py)

Casos cubiertos:

- `test_protected_endpoint_rejects_missing_session`
- `test_protected_endpoint_rejects_invalid_bearer_token`
- `test_user_cannot_request_another_users_finances`
- `test_chat_is_scoped_to_the_authenticated_user`
- `test_payment_reminder_routes_use_the_authenticated_user`

### Resultado esperado y obtenido

| Caso | Esperado | Obtenido |
|---|---:|---:|
| Sin token | 401 | 401 |
| Token inválido | 401 | 401 |
| UID ajeno | 403 | 403 |
| UID autenticado | 200 cuando la operación es válida | 200 en prueba con dobles |

### Evidencia necesaria

- Salida de la suite de pruebas.
- Captura o registro de respuesta `401` sin token.
- Captura o registro de respuesta `403` usando otro UID ficticio.
- Prueba contra el entorno público con una cuenta de demostración.
- Reglas de seguridad de Firestore revisadas.

### Limitaciones

Las pruebas actuales usan dobles y overrides de dependencias. Todavía no existe evidencia automatizada contra Firebase y Firestore reales en producción.

## Control 2 — Validación de entradas y errores seguros

### Riesgo mitigado

Entradas malformadas, payloads excesivos, montos inválidos y exposición de información interna.

### Implementación

- [Finance_AI_API/app/schemas/ai.py](../../Finance_AI_API/app/schemas/ai.py)
  - Límite de 500 caracteres para preguntas.
  - Rechazo de textos vacíos.
  - Rechazo de campos extra.
  - Límites para la salida OCR.
- [Finance_AI_API/app/schemas/reminder.py](../../Finance_AI_API/app/schemas/reminder.py)
  - Límites de título, monto, categoría e identificadores.
  - Rechazo de campos adicionales.
- [Finance_AI_API/app/routers/ai.py](../../Finance_AI_API/app/routers/ai.py)
  - Tipos MIME permitidos.
  - Límite de 10 MB para OCR.
- [Finance_AI_API/app/routers/data.py](../../Finance_AI_API/app/routers/data.py)
  - Restricciones de longitud y patrón para UID.

### Cómo funciona

FastAPI valida los parámetros y cuerpos mediante Pydantic antes de ejecutar servicios financieros u operaciones de IA. Una entrada inválida se rechaza con `422` y no llega al proveedor OpenAI.

### Prueba realizada

Archivo: [Finance_AI_API/tests/test_api_contracts.py](../../Finance_AI_API/tests/test_api_contracts.py)

Casos cubiertos:

- `test_chat_rejects_blank_oversized_and_extra_input`
- `test_reminder_rejects_invalid_amount_and_extra_input`
- `test_ocr_accepts_an_image_and_returns_transaction_fields`
- `test_ocr_normalizes_only_valid_receipt_dates`

### Resultado esperado y obtenido

| Caso | Esperado | Obtenido |
|---|---:|---:|
| Pregunta vacía | 422 | 422 |
| Pregunta mayor a 500 caracteres | 422 | 422 |
| Campo no permitido | 422 | 422 |
| Monto cero | 422 | 422 |
| Archivo OCR no válido | 400 | Validado en router |

Los routers también devuelven mensajes genéricos para errores internos, sin stack traces ni credenciales.

### Evidencia necesaria

- Salida de la suite backend.
- Payload inválido utilizado.
- Código HTTP y cuerpo de respuesta sin secretos.
- Registro que confirme que OpenAI no fue llamado para entradas rechazadas.

### Limitaciones

No existe todavía un límite global de tamaño HTTP para todas las solicitudes ni una validación profunda del contenido binario de las imágenes.

## Control 3 — Límites de IA, caché y proveedor

### Riesgo mitigado

Consumo excesivo de OpenAI, prompts demasiado grandes, respuestas gigantes, reintentos infinitos y fallos de proveedor expuestos al usuario.

### Implementación

- [Finance_AI_API/app/core/config.py](../../Finance_AI_API/app/core/config.py)
  - `OPENAI_MAX_OUTPUT_TOKENS` limitado entre 1 y 1000.
  - Timeout máximo configurable de 120 segundos, con valor por defecto de 30.
  - Máximo de 2 reintentos configurables, con valor por defecto de 1.
  - Contexto máximo de 50.000 caracteres, con valor por defecto de 12.000.
- [Finance_AI_API/app/core/openai_client.py](../../Finance_AI_API/app/core/openai_client.py)
  - Aplica timeout y reintentos al cliente OpenAI.
- [Finance_AI_API/app/services/openai_service.py](../../Finance_AI_API/app/services/openai_service.py)
  - Normaliza fallos del proveedor a `AIProviderError`.
  - Rechaza respuestas vacías.
- [Finance_AI_API/app/services/ai_service.py](../../Finance_AI_API/app/services/ai_service.py)
  - Limita el contexto enviado.
  - Consulta caché antes de llamar a OpenAI.
- [Finance_AI_API/app/services/ai_service.py](../../Finance_AI_API/app/services/ai_service.py)
  - Registra `cache_hit`, tiempos por etapa y tiempo total sin registrar tokens ni contenido financiero completo.

### Cómo funciona

```text
Solicitud IA
   ↓
Caché por UID, capacidad y fingerprint
   ├── Hit  → respuesta sin OpenAI
   └── Miss → contexto limitado → OpenAI con timeout y reintentos acotados
```

### Prueba realizada

Archivo: [Finance_AI_API/tests/test_api_contracts.py](../../Finance_AI_API/tests/test_api_contracts.py)

Caso cubierto:

- `test_ai_reuses_cache_and_saves_new_recommendations`

También se validó la separación de entrada adversarial mediante:

- `test_ai_keeps_adversarial_user_input_out_of_system_instructions`

### Resultado esperado y obtenido

| Caso | Esperado | Obtenido |
|---|---|---|
| Caché válida | No llamar a OpenAI | Cumplido |
| Caché ausente | Llamar a OpenAI y guardar resultado | Cumplido con mock |
| Pregunta adversarial | No formar parte de `instructions` | Cumplido |
| Respuesta vacía | Error interno controlado | Implementado; prueba específica pendiente |
| Timeout/cuota agotada | Error seguro del proveedor | Manejo implementado; prueba específica pendiente |

### Evidencia necesaria

- Salida de pruebas de caché.
- Log estructurado con `event=ai_cache_hit` sin datos sensibles.
- Prueba con proveedor simulado no disponible.
- Prueba con respuesta vacía.
- Prueba de timeout y cuota agotada.
- Configuración efectiva de timeout y tokens sin mostrar la clave.

### Limitaciones

Todavía no hay rate limiting ni control de concurrencia por usuario. Tampoco se han ejecutado pruebas reales contra cuota agotada, timeout de red o indisponibilidad de OpenAI.

## Comando de verificación local

Desde `Finance_AI_API`:

```powershell
python -m unittest discover -s tests -v
python -m compileall -q app
```

Resultado de referencia ejecutado durante esta fase: la suite backend pasó con `16` pruebas y la compilación no reportó errores.

## Estado general

| Control | Estado |
|---|---|
| Firebase Authentication + UID | Implementado localmente, evidencia de producción pendiente |
| Validación + errores seguros | Implementado localmente |
| Límites IA + caché + proveedor | Parcial: controles implementados, pruebas de fallos del proveedor pendientes |
