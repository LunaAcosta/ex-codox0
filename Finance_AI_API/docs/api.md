# Contrato HTTP de Finance AI API

Referencia de la API utilizada por Finance App. La especificación ejecutable está disponible en `/openapi.json`, Swagger UI en `/docs` y ReDoc en `/redoc`.

## Convenciones

Base URL local:

```text
http://127.0.0.1:8000
```

Las respuestas exitosas usan normalmente:

```json
{
  "success": true,
  "message": "Operación completada.",
  "data": {}
}
```

Las listas pueden incluir `count`. Los errores usan el formato estándar de FastAPI:

```json
{
  "detail": "Descripción del error."
}
```

Las fechas se intercambian en ISO 8601. Los importes son números positivos y no cadenas con símbolos monetarios.

## Autenticación

Todas las rutas de usuarios, datos e IA requieren un Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

El backend verifica la firma con Firebase Admin. Si la ruta o el body contienen un `uid`, debe coincidir con el `uid` del token.

| Estado | Motivo habitual |
|---:|---|
| 401 | Encabezado ausente, formato incorrecto, token vencido o inválido |
| 403 | Intento de consultar o modificar los datos de otro usuario |

## Resumen de endpoints

| Método | Ruta | Auth | Descripción |
|---:|---|:---:|---|
| GET | `/` | No | Estado y enlaces básicos |
| GET | `/health/` | No | Salud de API, Firebase y OpenAI |
| GET | `/metadata/` | No | Metadatos del servicio |
| GET | `/users/` | Sí | Usuarios visibles para el servicio autenticado |
| GET | `/users/{uid}` | Sí | Perfil del usuario actual |
| POST | `/ai/ocr` | Sí | Extraer datos de un recibo |
| POST | `/ai/summary/{uid}` | Sí | Resumen financiero |
| POST | `/ai/analyze/{uid}` | Sí | Análisis del perfil |
| POST | `/ai/recommend/{uid}` | Sí | Recomendaciones y persistencia en historial |
| POST | `/ai/predict/{uid}` | Sí | Predicción financiera |
| POST | `/ai/classify/{uid}` | Sí | Clasificación del perfil |
| POST | `/ai/chat` | Sí | Responder una pregunta financiera |
| GET | `/data/financial/{uid}` | Sí | Billeteras, movimientos y recordatorios |
| GET | `/data/recommendations/{uid}` | Sí | Hasta 50 recomendaciones recientes |
| PATCH | `/data/recommendations/{uid}/{recommendation_id}/read` | Sí | Marcar como leída |
| GET | `/data/reminders/{uid}` | Sí | Listar recordatorios |
| POST | `/data/reminders/{uid}` | Sí | Crear recordatorio |
| PATCH | `/data/reminders/{uid}/{reminder_id}/notification` | Sí | Vincular notificación local |
| POST | `/data/reminders/{uid}/{reminder_id}/process` | Sí | Convertir recordatorio en gasto |
| DELETE | `/data/reminders/{uid}/{reminder_id}` | Sí | Cancelar recordatorio |

## Sistema

### `GET /`

Devuelve versión, estado y ubicación de documentación.

### `GET /health/`

```json
{
  "success": true,
  "message": "Servicio disponible.",
  "data": {
    "status": "healthy",
    "firebase": "connected",
    "openai": "configured",
    "version": "1.0.0",
    "timestamp": "2026-08-02T18:00:00Z"
  }
}
```

### `GET /metadata/`

Expone nombre, versión, descripción, framework, base de datos, proveedor de IA y modelo configurado. No incluye secretos.

## Usuarios

### `GET /users/`

Devuelve una colección y `count`.

### `GET /users/{uid}`

El `uid` debe pertenecer al token autenticado. Responde `404` si no existe el documento del usuario.

## Datos financieros

### `GET /data/financial/{uid}`

```json
{
  "success": true,
  "message": "Datos financieros actualizados.",
  "data": {
    "wallets": [],
    "transactions": [],
    "reminders": []
  }
}
```

Los movimientos se ordenan por `date` de forma descendente. Esta ruta no llama a OpenAI.

### `GET /data/recommendations/{uid}`

```json
{
  "success": true,
  "message": "Historial de recomendaciones obtenido.",
  "count": 1,
  "data": [
    {
      "id": "recommendation-id",
      "type": "recommendation",
      "recommendation": "Reserva una parte del saldo para tus próximos pagos.",
      "date": "2026-08-02T18:00:00Z",
      "read": false,
      "source": "ai",
      "createdAt": "2026-08-02T18:00:00Z"
    }
  ]
}
```

El resultado está limitado a 50 elementos.

### `PATCH /data/recommendations/{uid}/{recommendation_id}/read`

No requiere body.

```json
{
  "success": true,
  "message": "Recomendación marcada como leída.",
  "data": null
}
```

## OCR

### `POST /ai/ocr`

Recibe `multipart/form-data` con un campo obligatorio `file`.

```bash
curl -X POST "http://127.0.0.1:8000/ai/ocr" \
  -H "Authorization: Bearer FIREBASE_ID_TOKEN" \
  -F "file=@recibo.jpg"
```

Tipos permitidos: `image/jpeg`, `image/png`, `image/webp` e `image/gif`. El límite predeterminado es 10 MB y puede cambiar con `OCR_MAX_FILE_SIZE_MB`.

```json
{
  "success": true,
  "message": "Documento analizado correctamente.",
  "data": {
    "amount": 85.5,
    "date": "2026-08-01",
    "description": "Supermercado Ejemplo",
    "category": "food",
    "rawText": "Texto visible normalizado"
  }
}
```

La extracción prioriza la fecha de compra o emisión del recibo, no la fecha actual, la fecha de digitalización ni una fecha de vencimiento. Puede responder `400`, `413`, `422` o `500`.

## Operaciones de IA por usuario

Estas rutas no reciben body:

- `POST /ai/summary/{uid}` → `data.summary`
- `POST /ai/analyze/{uid}` → `data.analysis`
- `POST /ai/recommend/{uid}` → `data.recommendations`
- `POST /ai/predict/{uid}` → `data.prediction`
- `POST /ai/classify/{uid}` → `data.classification`

Ejemplo:

```bash
curl -X POST "http://127.0.0.1:8000/ai/summary/FIREBASE_UID" \
  -H "Authorization: Bearer FIREBASE_ID_TOKEN"
```

```json
{
  "success": true,
  "message": "Resumen financiero generado.",
  "data": {
    "uid": "FIREBASE_UID",
    "summary": "Tu saldo es estable, pero los gastos variables aumentaron este periodo."
  }
}
```

Las respuestas se limitan al contexto financiero del usuario autenticado. El servicio mantiene textos breves y puede reutilizar un resultado mientras la huella de los datos de Firestore no cambie. `recommend` persiste el resultado en el historial.

### `POST /ai/chat`

```json
{
  "uid": "FIREBASE_UID",
  "question": "¿Qué gasto debería vigilar este mes?"
}
```

```json
{
  "success": true,
  "message": "Respuesta generada correctamente.",
  "data": {
    "uid": "FIREBASE_UID",
    "question": "¿Qué gasto debería vigilar este mes?",
    "answer": "Vigila tus gastos variables y compáralos con el periodo anterior."
  }
}
```

## Recordatorios

### `GET /data/reminders/{uid}`

Devuelve los recordatorios del usuario y `count`.

### `POST /data/reminders/{uid}`

```json
{
  "title": "Internet",
  "amount": 45.99,
  "walletId": "wallet-1",
  "dueDate": "2026-08-15T15:00:00Z",
  "category": "services",
  "autoCharge": false
}
```

Reglas principales:

- `title`: entre 2 y 80 caracteres.
- `amount`: mayor que cero.
- `walletId`: billetera perteneciente al usuario.
- `dueDate`: fecha ISO 8601.
- `category`: `services` si se omite.
- `autoCharge`: `false` si se omite.

Responde `201` con un registro `pending`.

### `PATCH /data/reminders/{uid}/{reminder_id}/notification`

```json
{
  "notificationId": "expo-local-notification-id"
}
```

Vincula el identificador de una notificación programada por el dispositivo. Esta ruta no envía una notificación push.

### `POST /data/reminders/{uid}/{reminder_id}/process`

No requiere body. Valida que el recordatorio siga pendiente y que la billetera pueda procesarlo. Crea una transacción de gasto, actualiza el saldo y guarda `transactionId` y `processedAt` en el recordatorio. Responde `400` para un estado inválido y `403` cuando la regla financiera impide el cargo.

### `DELETE /data/reminders/{uid}/{reminder_id}`

Cancela un recordatorio pendiente y conserva el registro con `status: "cancelled"`. Responde `404` si no existe y `400` si ya no puede cancelarse.

## Procesamiento automático

El worker de recordatorios revisa periódicamente los pagos pendientes. Cuando `autoCharge` es verdadero y `dueDate` ha vencido, utiliza la misma lógica de procesamiento manual. Una operación completada no debe volver a crear otro gasto.

## Códigos de estado

| Código | Uso |
|---:|---|
| 200 | Consulta o modificación correcta |
| 201 | Recordatorio creado |
| 400 | Archivo, payload o transición inválida |
| 401 | Autenticación inválida |
| 403 | UID ajeno o regla financiera no permitida |
| 404 | Usuario, recomendación o recordatorio inexistente |
| 413 | Imagen superior al límite OCR |
| 422 | Validación de esquema o extracción OCR no confiable |
| 500 | Error interno o dependencia no disponible |

## Ejemplo de cliente autenticado

```typescript
const response = await fetch(`${baseUrl}/data/financial/${uid}`, {
  headers: {
    Authorization: `Bearer ${firebaseIdToken}`,
  },
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.detail ?? "Finance AI API no pudo procesar la solicitud.");
}

const result = await response.json();
```

## Compatibilidad

Los cambios incompatibles deben introducir una versión de ruta o un periodo de transición. Antes de modificar un payload, actualiza los esquemas Pydantic, `/openapi.json`, este documento y los tipos de `ex-codox0`.
