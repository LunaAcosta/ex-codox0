# Matriz de riesgos de seguridad — Ex-Codox

**Release evaluado:** `v1.0.0-rc.1`  
**Fecha:** 2026-08-22  
**Alcance:** frontend Expo/React Native, Finance AI API, Firebase, OpenAI, Docker y CI/CD.

## Criterios

- **Probabilidad:** Baja, Media o Alta.
- **Impacto:** Bajo, Medio o Alto.
- **Prioridad:** resultado cualitativo de probabilidad e impacto, considerando la sensibilidad de los datos financieros.
- **Estado:** Implementado, Parcial o Pendiente.

## Matriz

| ID | Activo | Amenaza | Consecuencia | Probabilidad | Impacto | Prioridad | Control | Estado | Evidencia | Limitación residual |
|---|---|---|---|---|---|---|---|---|---|---|
| R-01 | Datos financieros en Firestore y API | Un usuario usa un token válido para solicitar el UID de otra persona | Exposición de saldos, transacciones, billeteras o recomendaciones | Media | Alto | **Crítica** | Firebase ID token validado en backend y comparación `require_same_user()` antes de consultar por UID | Implementado | `Finance_AI_API/app/core/security.py`, routers protegidos y pruebas 401/403 en `Finance_AI_API/tests/test_api_contracts.py` | Falta una prueba contra Firebase/Firestore desplegado y revisión de reglas de Firestore |
| R-02 | Instrucciones y contexto enviados a OpenAI | Prompt injection mediante la pregunta del usuario o datos financieros manipulados | La IA puede ignorar reglas, revelar contexto o responder fuera del dominio | Alta | Alto | **Crítica** | Instrucciones separadas de `user_input`; contexto y pregunta se marcan como no confiables; límites de longitud | Parcial | `Finance_AI_API/app/services/openai_service.py`, `ai_service.py` y prueba de separación de entrada adversarial | No existe un clasificador independiente ni validación semántica completa de todas las salidas |
| R-03 | Cuota y disponibilidad de OpenAI | Solicitudes repetidas, prompts grandes o proveedor lento/no disponible | Costos inesperados, latencia alta o indisponibilidad de funciones IA | Alta | Alto | **Crítica** | Caché, `max_output_tokens`, timeout de 30 s, máximo de un reintento y límite de contexto | Parcial | `Finance_AI_API/app/core/config.py`, `openai_client.py`, `ai_service.py` | Falta límite de concurrencia por usuario, rate limiting y pruebas reales de cuota/timeout |
| R-04 | Claves OpenAI y credenciales Firebase | Exposición accidental en archivos, logs, imágenes Docker o terminal | Uso fraudulento de servicios, costos y acceso administrativo | Media | Alto | Alta | `.env` ignorado, credenciales JSON ignoradas, variables privadas en Render y Docker sin valores hardcodeados | Parcial | `.gitignore`, `Finance_AI_API/render.yaml`, `Finance_AI_API/docker-compose.yml`; no hay archivos sensibles rastreados | Una clave OpenAI local fue expuesta al ejecutar `docker compose config`; debe revocarse y rotarse |
| R-05 | Firebase y OpenAI como dependencias externas | Caída, error de cuota o degradación de Firebase/OpenAI | Fallos en login, datos financieros, OCR y funciones IA | Media | Alto | Alta | Healthcheck, mensajes públicos controlados, timeout OpenAI y caché de IA | Parcial | `Finance_AI_API/app/routers/health.py`, `openai_service.py` y pruebas de caché | No hay fallback completo para IA ni alertas operativas; Firebase health solo informa estado |
| R-06 | Dependencias frontend y toolchain | Vulnerabilidad en dependencia directa o transitiva | Denegación de servicio, ejecución de comportamiento no esperado o riesgo de cadena de suministro | Alta | Alto | Alta | `package-lock.json`, `npm ci`, auditoría npm y CI | Pendiente | `npm audit` reportó 23 vulnerabilidades: 1 crítica, 9 altas y 13 moderadas | `npm audit fix --force` puede romper Expo; falta una actualización coordinada y revisión de impacto |
| R-07 | Imágenes de recibos y salida OCR | Archivo malformado, demasiado grande o respuesta OCR manipulada | Consumo excesivo, datos incorrectos o creación de una transacción errónea | Media | Medio | Media | Tipos MIME permitidos, límite de 10 MB, validación de JSON, categorías y fecha normalizada | Parcial | `Finance_AI_API/app/routers/ai.py`, `ocr_service.py` y pruebas OCR | No se valida el contenido binario real ni se ejecutan pruebas de carga multipart |

## Tres riesgos de mayor prioridad

### 1. R-01 — Acceso indebido a datos de otro usuario

Es el riesgo de mayor sensibilidad porque afecta directamente datos financieros personales. La autorización por UID está implementada en los routers y probada localmente, pero aún se necesita evidencia contra el entorno desplegado y una revisión de reglas de Firestore.

### 2. R-02 — Prompt injection

El sistema separa ahora las instrucciones del sistema de la entrada del usuario y limita el dominio financiero. El control es parcial porque una separación de mensajes no garantiza por sí sola que el modelo ignore todas las instrucciones maliciosas o que la salida sea siempre segura.

### 3. R-03 — Consumo excesivo o indisponibilidad de OpenAI

Existen límites de tokens, contexto, timeout, reintentos y caché. Aún falta rate limiting, control de concurrencia y pruebas reproducibles de cuota agotada y timeout.

## Controles transversales existentes

- Autenticación mediante Firebase ID Token.
- Autorización por UID autenticado.
- Validación Pydantic de entradas.
- Límite de archivos OCR.
- Errores públicos sin stack traces.
- Timeout y reintentos limitados para OpenAI.
- Caché de capacidades de IA.
- Logs con `request_id` sin registrar tokens ni claves.
- Lockfile frontend y requisitos Python fijados.
- CI para frontend y backend.

## Riesgos aceptados temporalmente

Para el candidato `v1.0.0-rc.1` se mantienen temporalmente estos riesgos, que impiden declarar el release final como completamente seguro:

1. Dependencias npm vulnerables.
2. Clave OpenAI local que debe ser revocada y reemplazada.
3. Falta de rate limiting y control de concurrencia IA.
4. Falta de evidencia de autorización contra producción.
5. Falta de auditoría PyPI con `pip-audit`.

## Evidencia que debe conservarse

- Resultado de las pruebas de autenticación y autorización.
- Resultado de `npm audit` y decisión sobre actualizaciones.
- Resultado de `npm ci`, `npm run ci` y pruebas backend.
- Configuración de Render sin valores secretos.
- Evidencia de rotación de la clave OpenAI, sin incluir la clave.
- Prueba de `/health` en el entorno desplegado.
- Revisión de reglas de seguridad de Firestore.
