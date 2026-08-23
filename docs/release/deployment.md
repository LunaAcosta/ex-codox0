# Arquitectura de despliegue — Ex-Codox

**Release:** `v1.0.0-rc.1`  
**Estado:** frontend y API declarados como desplegados  
**Fecha de documentación:** 2026-08-22

## Componentes desplegados

```text
Usuario
  ↓ HTTPS
Frontend Ex-Codox (Expo / React Native / Expo Router)
  ↓ EXPO_PUBLIC_API_URL + Authorization: Bearer
Finance AI API pública (FastAPI sobre Docker)
  ├── Firebase Authentication / Firebase Admin
  ├── Firestore
  └── OpenAI
```

## Frontend

- Framework: Expo, React Native y Expo Router.
- Lenguaje: TypeScript.
- Versión candidata: `1.0.0-rc.1`.
- Salida web configurada: `static` en [app.json](../../app.json).
- Cliente de red: [src/core/network/httpClient.ts](../../src/core/network/httpClient.ts).
- URL configurada mediante `EXPO_PUBLIC_API_URL`.
- El cliente obtiene el Firebase ID Token y lo envía como Bearer.

### Registro de acceso público

El repositorio no contiene una URL pública del frontend. Registrar antes de la evaluación:

```text
Frontend URL: PENDIENTE DE REGISTRAR
Método de distribución: PENDIENTE DE CONFIRMAR
Build o artefacto: PENDIENTE DE REGISTRAR
```

## API

- Framework: FastAPI.
- Runtime: Python 3.11 en imagen `python:3.11-slim-bookworm`.
- Servidor: Uvicorn.
- Contenedor: [Finance_AI_API/Dockerfile](../../Finance_AI_API/Dockerfile).
- Configuración PaaS: [Finance_AI_API/render.yaml](../../Finance_AI_API/render.yaml).
- Servicio configurado en Render: `finance-ai-api`.
- Puerto interno: `8000`, definido por `PORT`.
- Healthcheck: `GET /health`.
- Versión: `1.0.0-rc.1`.

### Registro de acceso público

```text
API URL: PENDIENTE DE REGISTRAR
Health URL: PENDIENTE DE REGISTRAR
Fecha de última verificación: PENDIENTE DE REGISTRAR
```

No se debe usar `localhost` como evidencia de disponibilidad pública.

## Servicios externos

| Servicio | Uso | Configuración |
|---|---|---|
| Firebase Authentication | Inicio de sesión y emisión de ID tokens | Variables públicas del frontend y Firebase Admin en API |
| Firestore | Usuarios, billeteras, transacciones y recomendaciones | Credenciales privadas únicamente en API |
| OpenAI | Resumen, análisis, recomendaciones, predicción, clasificación, chat y OCR | `OPENAI_API_KEY` privada en el entorno de API |
| Render | Hosting de la API Docker | Variables privadas mediante `sync: false` |
| Expo/EAS | Build y distribución del frontend | Configuración en `app.json` y `eas.json` |

## Configuración y secretos

La API utiliza variables de entorno para:

- versión y ambiente;
- URL permitidas por CORS;
- modelo y límites OpenAI;
- credenciales Firebase Admin.

Los secretos no deben incluirse en:

- Git;
- Dockerfile;
- imagen Docker;
- README;
- capturas de pantalla;
- logs;
- manifiestos públicos.

La credencial local `firebase-admin.json` se monta en Compose solo para desarrollo y en modo lectura. Render debe utilizar variables privadas o un mecanismo secreto equivalente.

## Flujo crítico desplegado

```text
1. El usuario inicia sesión con Firebase Authentication.
2. Expo obtiene un Firebase ID Token.
3. El cliente llama la URL pública de Finance AI API.
4. El header contiene Authorization: Bearer <token>.
5. FastAPI valida el token mediante Firebase Admin.
6. La API comprueba que el UID solicitado coincide con el token.
7. La API consulta Firestore.
8. Las capacidades IA llaman OpenAI cuando no existe una respuesta en caché.
9. La API devuelve la respuesta a Expo.
```

## Dependencias de operación

- Proyecto Firebase activo.
- Firebase Authentication habilitado.
- Firestore disponible.
- Clave OpenAI vigente y con cuota.
- Servicio Render activo.
- Variables de entorno correctamente configuradas.
- CORS configurado con la URL real del frontend.
- ID token vigente durante las pruebas autenticadas.

## Costos y supuestos

- Render está configurado con el plan `free` en [Finance_AI_API/render.yaml](../../Finance_AI_API/render.yaml).
- El costo de OpenAI depende del modelo, tokens, OCR y frecuencia de uso.
- Firebase depende del consumo de Authentication, Firestore y almacenamiento.
- Expo/EAS puede tener límites o costos según el tipo de build y distribución.
- Los costos reales no fueron medidos en esta fase y deben confirmarse en los paneles de cada proveedor.

## Limitaciones conocidas

- El plan gratuito de Render puede suspender servicios inactivos.
- La API depende de Firebase y OpenAI.
- No existe todavía evidencia documentada de prueba desde otra red o dispositivo.
- La URL de CORS en `render.yaml` contiene un placeholder del frontend.
- El frontend tiene fallback local a `http://127.0.0.1:8000`; el build público debe proporcionar `EXPO_PUBLIC_API_URL` real.
- Las dependencias npm mantienen vulnerabilidades pendientes de una actualización coordinada.
- El build Docker local no se verificó porque Docker Desktop no tenía el daemon activo.

## Evidencia que debe conservarse

- URL pública del frontend.
- URL pública de la API.
- Respuesta de `GET /health` con código `200`.
- Captura de la aplicación funcionando desde ventana privada.
- Prueba desde una red distinta al equipo de desarrollo.
- Prueba desde otro dispositivo.
- Logs de Render sin secretos.
- Versión `1.0.0-rc.1` visible en frontend, API y documentación.
- Confirmación de que `CORS_ORIGINS` usa la URL real.

## Criterio de aceptación

El despliegue se considera verificable cuando:

- frontend y API tienen URLs públicas reales;
- la app consume la API pública, no localhost;
- `/health` responde `200` desde una red externa;
- login y un flujo financiero de lectura funcionan;
- la API rechaza una solicitud sin token;
- la API rechaza un UID ajeno;
- no se exponen secretos;
- la versión presentada coincide con `1.0.0-rc.1`.
