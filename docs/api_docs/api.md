# Integración de `ex-codox0` con Finance AI API

Esta guía describe cómo la aplicación móvil consume `Finance_AI_API`. El contrato fuente del backend está en `Finance_AI_API/docs/api.md` y en Swagger (`/docs`).

## Configuración de la URL

La base URL se obtiene de `EXPO_PUBLIC_API_URL` y no debe terminar en `/`.

```dotenv
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

| Entorno de la aplicación | Base URL recomendada |
|---|---|
| Web o simulador iOS | `http://127.0.0.1:8000` |
| Emulador Android | `http://10.0.2.2:8000` |
| Dispositivo físico | `http://<IP-LAN-de-la-PC>:8000` |

Para un dispositivo físico, ejecuta el backend con `--host 0.0.0.0`, usa la misma red Wi-Fi y comprueba desde el teléfono que `http://<IP>:8000/health/` responde.

## Autenticación

El cliente HTTP obtiene el Firebase ID token de la sesión activa e incluye:

```http
Authorization: Bearer <firebase-id-token>
```

Las solicitudes públicas también pueden pasar por el mismo cliente, pero `/`, `/health/` y `/metadata/` no exigen sesión. Nunca se envía una clave de OpenAI desde la aplicación.

## Formato de respuesta

La respuesta habitual usa este sobre:

```json
{
  "success": true,
  "message": "Datos financieros actualizados.",
  "data": {}
}
```

Las colecciones pueden incluir `count`. Los errores de FastAPI usan:

```json
{
  "detail": "Descripción del error."
}
```

El cliente transforma fallos HTTP y de red en `ApiError`. Si no existe respuesta, el mensaje incluye la base URL para facilitar el diagnóstico.

## Rutas consumidas

| Función | Método | Ruta | Uso en la aplicación |
|---|---:|---|---|
| Información del servicio | GET | `/` | Diagnóstico básico |
| Estado de dependencias | GET | `/health/` | Comprobar conexión |
| Metadatos | GET | `/metadata/` | Información del backend |
| Usuarios autenticados | GET | `/users/` | Administración/diagnóstico |
| Usuario actual | GET | `/users/{uid}` | Perfil |
| Datos financieros | GET | `/data/financial/{uid}` | Billeteras, movimientos y recordatorios |
| Historial de recomendaciones | GET | `/data/recommendations/{uid}` | Centro Codox |
| Marcar recomendación leída | PATCH | `/data/recommendations/{uid}/{id}/read` | Historial |
| Crear recordatorio | POST | `/data/reminders/{uid}` | Pagos futuros |
| Vincular notificación | PATCH | `/data/reminders/{uid}/{id}/notification` | Notificación local |
| Procesar recordatorio | POST | `/data/reminders/{uid}/{id}/process` | Convertir a gasto |
| Cancelar recordatorio | DELETE | `/data/reminders/{uid}/{id}` | Cancelación |
| OCR | POST | `/ai/ocr` | Completar movimiento desde recibo |
| Capacidades IA | POST | `/ai/{capability}/{uid}` | Resumen, análisis, recomendación, predicción o clasificación |
| Chat financiero | POST | `/ai/chat` | Pregunta contextual |

`capability` puede ser `summary`, `analyze`, `recommend`, `predict` o `classify`.

## Datos financieros

```http
GET /data/financial/{uid}
```

```json
{
  "success": true,
  "message": "Datos financieros actualizados.",
  "data": {
    "wallets": [
      { "id": "wallet-1", "name": "Principal", "amount": 1250 }
    ],
    "transactions": [
      {
        "id": "tx-1",
        "type": "expense",
        "amount": 85.5,
        "category": "food",
        "date": "2026-08-02T14:30:00Z",
        "description": "Supermercado",
        "walletId": "wallet-1"
      }
    ],
    "reminders": []
  }
}
```

El backend entrega los movimientos con las fechas más recientes primero. El cliente puede volver a ordenar defensivamente antes de mostrarlos.

## OCR de recibos

La solicitud es `multipart/form-data` y el campo se llama `file`:

```http
POST /ai/ocr
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Formatos admitidos: JPG, PNG, WEBP y GIF. El tamaño máximo se configura en el backend.

```json
{
  "success": true,
  "message": "Documento analizado correctamente.",
  "data": {
    "amount": 85.5,
    "date": "2026-08-01",
    "description": "Supermercado Ejemplo",
    "category": "food",
    "rawText": "..."
  }
}
```

La fecha debe provenir del comprobante. Si un campo no es confiable, el formulario conserva el control manual del usuario. Completar con recibo es opcional.

## Capacidades de IA

Las cinco capacidades no requieren body:

```http
POST /ai/recommend/{uid}
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "message": "Recomendaciones generadas correctamente.",
  "data": {
    "uid": "firebase-uid",
    "recommendations": "Reduce los gastos variables esta semana y conserva un margen para pagos próximos."
  }
}
```

Cada capacidad devuelve una propiedad diferente: `summary`, `analysis`, `recommendations`, `prediction` o `classification`. Al generar una recomendación, el backend también la persiste para que aparezca en el historial.

El chat sí recibe body:

```json
{
  "uid": "firebase-uid",
  "question": "¿Qué gasto debería vigilar este mes?"
}
```

## Recordatorios de pago

Crear un recordatorio:

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

La respuesta `201` contiene el recordatorio con `status: "pending"`. Después de programar la notificación local, la aplicación vincula su identificador:

```json
{
  "notificationId": "expo-local-notification-id"
}
```

Procesar el recordatorio crea un gasto, actualiza el saldo de la billetera y cambia el estado a `completed`. Cancelarlo cambia el estado a `cancelled`; no elimina el historial de forma destructiva.

## Caché y actualización

- Las pantallas leen datos reutilizables desde `/data/financial/{uid}`.
- Las alertas deterministas se calculan con esos datos y no consumen tokens.
- Las funciones de IA se ejecutan solo por acción explícita del usuario o cuando el flujo lo necesita.
- Después de crear/procesar un recordatorio o generar una recomendación, se invalida o refresca la información relacionada.
- El backend reutiliza resultados de IA mientras la huella financiera no cambie.

## Estados de error relevantes

| Estado | Significado | Acción del cliente |
|---:|---|---|
| 400 | Payload o archivo inválido | Mostrar corrección concreta |
| 401 | Token ausente, vencido o inválido | Renovar sesión o iniciar sesión |
| 403 | El `uid` no corresponde al token o el saldo no permite procesar | Detener la operación y explicar |
| 404 | Usuario o recurso no encontrado | Refrescar estado local |
| 413 | Imagen OCR demasiado grande | Solicitar otra imagen |
| 422 | Datos no validables o OCR sin extracción confiable | Permitir completar manualmente |
| 500 | Error interno o dependencia no disponible | Mostrar reintento sin perder el formulario |

## Diagnóstico rápido

1. Abre `/health/` con la misma dirección configurada en el dispositivo.
2. Confirma que FastAPI escucha en `0.0.0.0:8000` para teléfonos físicos.
3. Comprueba que la sesión Firebase está activa.
4. Revisa que el `uid` de la ruta coincide con el usuario autenticado.
5. Reinicia Metro al cambiar `.env`; usa `npx expo start --clear` si conserva una URL anterior.
