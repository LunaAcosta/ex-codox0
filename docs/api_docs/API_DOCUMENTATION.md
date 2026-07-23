# 💰 Finance AI API

# Documentación Técnica

---

# Información General

| Campo | Valor |
|--------|--------|
| Proyecto | Finance AI API |
| Versión | 1.0.0 |
| Framework | FastAPI |
| Lenguaje | Python 3.13 |
| Arquitectura | REST API |
| Base de datos | Firebase Firestore |
| Inteligencia Artificial | OpenAI GPT |
| Documentación | Swagger UI |
| Autor | BlackARM |
| Estado | Versión Final |

---

# Descripción del Proyecto

Finance AI API es una API REST desarrollada utilizando FastAPI cuyo propósito es proporcionar capacidades inteligentes para el análisis financiero de usuarios almacenados en Firebase Firestore mediante el uso de modelos de Inteligencia Artificial de OpenAI.

La API fue diseñada siguiendo una arquitectura por capas que separa la lógica de negocio, el acceso a datos, la construcción del contexto financiero y la comunicación con el modelo de IA.

El sistema permite consultar información financiera de un usuario y generar respuestas inteligentes completamente personalizadas utilizando el historial financiero almacenado en Firebase.

---

# Objetivos del Proyecto

## Objetivo General

Desarrollar una API REST que permita integrar Firebase Firestore con modelos de Inteligencia Artificial para analizar información financiera de usuarios mediante diferentes capacidades inteligentes.

---

## Objetivos Específicos

- Implementar una arquitectura REST utilizando FastAPI.
- Integrar Firebase Firestore como base de datos.
- Integrar OpenAI para generar respuestas inteligentes.
- Construir un contexto financiero dinámico.
- Implementar múltiples capacidades de Inteligencia Artificial.
- Documentar completamente la API mediante Swagger.

---

# Tecnologías Utilizadas

| Tecnología | Uso |
|------------|-----|
| Python 3.13 | Lenguaje principal |
| FastAPI | Framework Backend |
| Firebase Firestore | Base de Datos NoSQL |
| Firebase Admin SDK | Acceso a Firestore |
| OpenAI API | Inteligencia Artificial |
| Swagger UI | Documentación |
| Uvicorn | Servidor ASGI |
| Pydantic | Validación de datos |

---

# Arquitectura del Proyecto

La API sigue una arquitectura por capas.

```
Cliente

      │

      ▼

FastAPI

      │

      ▼

Routers

      │

      ▼

Services

      │

      ▼

Repository

      │

      ▼

Firebase Firestore

      │

      ▼

OpenAI API
```

---

# Arquitectura de Carpetas

```
Finance_AI_API/

│

├── app/

│   ├── core/

│   ├── prompts/

│   ├── repositories/

│   ├── routers/

│   ├── schemas/

│   ├── services/

│   ├── utils/

│   └── main.py

│

├── docs/

│

├── tests/

│

├── requirements.txt

│

└── README.md
```

---

# Arquitectura de Servicios

El sistema está dividido en varios servicios especializados.

## FirebaseRepository

Responsable de consultar la información almacenada en Firebase Firestore.

Funciones principales:

- Obtener usuarios.
- Obtener billeteras.
- Obtener transacciones.
- Obtener recomendaciones.
- Obtener consejos diarios.

---

## FinanceService

Responsable de construir el perfil financiero del usuario.

Entre sus responsabilidades se encuentran:

- Calcular balance.
- Calcular ingresos.
- Calcular gastos.
- Calcular ahorro.
- Calcular porcentaje de ahorro.
- Construir el resumen financiero.

---

## StatisticsService

Calcula estadísticas financieras utilizando las transacciones del usuario.

Entre ellas:

- Mayor ingreso.
- Mayor gasto.
- Categoría favorita.

---

## ContextBuilder

Construye el contexto que será enviado al modelo de Inteligencia Artificial.

Este contexto incluye:

- Información del usuario.
- Resumen financiero.
- Billeteras.
- Estadísticas.
- Consejo del día.
- Historial de recomendaciones.

---

## OpenAIService

Responsable de comunicarse con la API de OpenAI.

Funciones principales:

- Leer prompts.
- Construir solicitudes.
- Enviar contexto.
- Procesar respuestas.

---

## AIService

Es el orquestador de toda la lógica de Inteligencia Artificial.

Su responsabilidad consiste en:

1. Obtener el perfil financiero.
2. Construir el contexto.
3. Seleccionar la capacidad inteligente.
4. Enviar la solicitud a OpenAI.
5. Retornar la respuesta al Router.

---

# Flujo General de la Aplicación

```
Cliente

↓

Router

↓

AIService

↓

FinanceService

↓

FirebaseRepository

↓

Firebase Firestore

↓

ContextBuilder

↓

OpenAIService

↓

OpenAI GPT

↓

Respuesta

↓

Cliente
```

---

# Capacidades Inteligentes

La API implementa seis capacidades principales de Inteligencia Artificial.

| Capacidad | Endpoint |
|-----------|----------|
| Summary | POST /ai/summary/{uid} |
| Analyze | POST /ai/analyze/{uid} |
| Recommend | POST /ai/recommend/{uid} |
| Predict | POST /ai/predict/{uid} |
| Classify | POST /ai/classify/{uid} |
| Chat | POST /ai/chat |

Cada una utiliza un prompt especializado y el contexto financiero generado dinámicamente a partir de Firebase.

---

# Variables de Entorno

La aplicación requiere las siguientes variables de entorno.

```env
OPENAI_API_KEY=
```

---

# Inicio de la Aplicación

Para iniciar el servidor se utiliza:

```bash
uvicorn app.main:app --reload
```

La documentación Swagger estará disponible en:

```
http://localhost:8000/docs
```

La documentación ReDoc estará disponible en:

```
http://localhost:8000/redoc
```

---

# Organización de los Endpoints

Los endpoints de la API se encuentran divididos en tres categorías principales.

1. Endpoints Generales.
2. Endpoints de Usuarios.
3. Endpoints de Inteligencia Artificial.

En la siguiente sección se documentará cada uno de ellos de manera individual, incluyendo:

- Método HTTP.
- Ruta.
- Descripción.
- Parámetros.
- Ejemplo de Request.
- Ejemplo de Response.
- Posibles errores.
- Validaciones.
---

# Documentación de Endpoints

Esta sección describe cada uno de los endpoints disponibles en Finance AI API.

Para cada endpoint se documenta:

- Método HTTP
- Ruta
- Descripción
- Parámetros
- Request
- Response
- Posibles errores
- Validaciones

---

# Endpoint 1

## Información General de la API

### Método HTTP

GET

### Ruta

```http
/
```

---

## Descripción

Permite verificar que la API está funcionando correctamente.

Este endpoint proporciona información básica sobre el servicio, incluyendo la versión instalada, el estado de ejecución y la ruta hacia la documentación Swagger.

No requiere autenticación.

---

## Parámetros

No posee parámetros.

---

## Request

```http
GET /
```

---

## Respuesta Exitosa

Código HTTP

```text
200 OK
```

```json
{
    "success": true,
    "message": "Finance AI API",
    "data": {
        "version": "1.0.0",
        "status": "running",
        "documentation": "/docs"
    }
}
```

---

## Posibles Errores

No aplica.

---

## Validaciones

No requiere parámetros.

---

# Endpoint 2

## Estado de la API

### Método HTTP

GET

### Ruta

```http
/health
```

---

## Descripción

Verifica el estado de funcionamiento de la API.

Además comprueba que los servicios principales fueron inicializados correctamente.

Entre ellos:

- Firebase Firestore
- OpenAI
- FastAPI

---

## Parámetros

No requiere parámetros.

---

## Request

```http
GET /health
```

---

## Respuesta Exitosa

Código HTTP

```text
200 OK
```

```json
{
    "success": true,
    "message": "API funcionando correctamente.",
    "data": {
        "status": "running",
        "firebase": "Connected",
        "openai": "Configured",
        "version": "1.0.0"
    }
}
```

---

## Posibles Errores

Código HTTP

```text
500 Internal Server Error
```

```json
{
    "detail": "Error interno del servidor."
}
```

---

## Validaciones

No requiere parámetros.

---

# Endpoint 3

## Metadata

### Método HTTP

GET

### Ruta

```http
/metadata
```

---

## Descripción

Retorna información descriptiva de la API.

Incluye:

- Nombre del proyecto.
- Framework utilizado.
- Base de datos.
- Modelo de Inteligencia Artificial.
- Versión.

---

## Parámetros

No requiere parámetros.

---

## Request

```http
GET /metadata
```

---

## Respuesta Exitosa

Código HTTP

```text
200 OK
```

```json
{
    "success": true,
    "message": "Información obtenida correctamente.",
    "data": {
        "name": "Finance AI API",
        "version": "1.0.0",
        "framework": "FastAPI",
        "database": "Firebase Firestore",
        "ai": "OpenAI GPT"
    }
}
```

---

## Posibles Errores

Código HTTP

```text
500 Internal Server Error
```

---

## Validaciones

No requiere parámetros.

---

# Endpoint 4

## Obtener Usuarios

### Método HTTP

GET

### Ruta

```http
/users
```

---

## Descripción

Obtiene el listado completo de usuarios registrados en Firebase Firestore.

Este endpoint es utilizado principalmente para consultar los usuarios disponibles antes de ejecutar cualquiera de las capacidades inteligentes.

---

## Parámetros

No requiere parámetros.

---

## Request

```http
GET /users
```

---

## Respuesta Exitosa

Código HTTP

```text
200 OK
```

```json
{
    "success": true,
    "message": "Usuarios obtenidos correctamente.",
    "count": 5,
    "data": [
        {
            "uid": "6NLMplhbdTPAoQz2R66Tb3p8ay43",
            "name": "Ing Cesar",
            "email": "cesar@gmail.com"
        }
    ]
}
```

---

## Posibles Errores

Código HTTP

```text
500 Internal Server Error
```

```json
{
    "detail": "Error interno del servidor."
}
```

---

## Validaciones

No requiere parámetros.

---

# Endpoint 5

## Obtener Usuario por UID

### Método HTTP

GET

### Ruta

```http
/users/{uid}
```

---

## Descripción

Obtiene toda la información disponible de un usuario específico almacenado en Firebase Firestore.

Este endpoint es utilizado por los servicios de Inteligencia Artificial para verificar que el usuario existe antes de generar cualquier respuesta.

---

## Parámetros

| Campo | Tipo | Obligatorio | Descripción |
|--------|------|-------------|-------------|
| uid | String | Sí | Identificador único del usuario en Firebase |

---

## Request

```http
GET /users/6NLMplhbdTPAoQz2R66Tb3p8ay43
```

---

## Respuesta Exitosa

Código HTTP

```text
200 OK
```

```json
{
    "success": true,
    "message": "Usuario obtenido correctamente.",
    "data": {
        "uid": "6NLMplhbdTPAoQz2R66Tb3p8ay43",
        "name": "Ing Cesar",
        "email": "cesar@gmail.com"
    }
}
```

---

## Usuario No Encontrado

Código HTTP

```text
404 Not Found
```

```json
{
    "detail": "Usuario no encontrado."
}
```

---

## Validaciones

- El UID es obligatorio.
- Debe existir en Firebase Firestore.
- Debe corresponder a un usuario válido.

---

# Resumen de Endpoints Documentados

| Método | Endpoint | Estado |
|---------|----------|--------|
| GET | / | ✔ |
| GET | /health | ✔ |
| GET | /metadata | ✔ |
| GET | /users | ✔ |
| GET | /users/{uid} | ✔ |

La siguiente sección documentará las capacidades de Inteligencia Artificial implementadas en la API.

---

# Inteligencia Artificial

Los siguientes endpoints implementan las capacidades inteligentes de Finance AI API.

Todos ellos utilizan la misma arquitectura interna.

```
Cliente

↓

Router AI

↓

AIService

↓

FinanceService

↓

FirebaseRepository

↓

Firebase Firestore

↓

ContextBuilder

↓

OpenAIService

↓

OpenAI GPT

↓

Respuesta Inteligente
```

Cada endpoint construye automáticamente un contexto financiero utilizando la información del usuario almacenada en Firebase Firestore antes de consultar el modelo de Inteligencia Artificial.

---

# Endpoint 6

# Resumen Financiero Inteligente

## Método HTTP

POST

---

## Ruta

```http
/ai/summary/{uid}
```

---

## Descripción

Genera un resumen financiero inteligente utilizando toda la información financiera disponible del usuario.

La IA analiza:

- Información personal.
- Balance general.
- Ingresos.
- Gastos.
- Ahorro.
- Porcentaje de ahorro.
- Estadísticas.
- Billeteras.
- Historial de recomendaciones.
- Consejo del día.

Posteriormente genera un resumen profesional en español.

---

## Parámetros

| Campo | Tipo | Obligatorio | Descripción |
|--------|------|-------------|-------------|
| uid | String | Sí | UID del usuario registrado en Firebase |

---

## Request

```http
POST /ai/summary/6NLMplhbdTPAoQz2R66Tb3p8ay43
```

---

## Respuesta Exitosa

Código HTTP

```text
200 OK
```

```json
{
    "success": true,
    "message": "Resumen financiero generado correctamente.",
    "data": {
        "uid": "6NLMplhbdTPAoQz2R66Tb3p8ay43",
        "summary": "El usuario presenta un balance positivo de $1,018.41, con ingresos acumulados de $1,500.00 y gastos por $481.59. Actualmente mantiene un nivel de ahorro saludable..."
    }
}
```

---

## Usuario No Encontrado

Código HTTP

```text
404 Not Found
```

```json
{
    "detail": "Usuario no encontrado."
}
```

---

## Error Interno

Código HTTP

```text
500 Internal Server Error
```

```json
{
    "detail": "Error interno del servidor."
}
```

---

## Validaciones

- El UID debe existir.
- El usuario debe poseer información financiera.
- Firebase debe estar disponible.
- OpenAI debe responder correctamente.

---

# Endpoint 7

# Análisis Financiero Inteligente

## Método HTTP

POST

---

## Ruta

```http
/ai/analyze/{uid}
```

---

## Descripción

Realiza un análisis financiero completo del usuario.

La Inteligencia Artificial identifica:

- Fortalezas financieras.
- Debilidades.
- Riesgos.
- Oportunidades.
- Estado financiero actual.

La respuesta es completamente personalizada utilizando la información obtenida desde Firebase.

---

## Parámetros

| Campo | Tipo | Obligatorio |
|--------|------|-------------|
| uid | String | Sí |

---

## Request

```http
POST /ai/analyze/6NLMplhbdTPAoQz2R66Tb3p8ay43
```

---

## Respuesta Exitosa

```json
{
    "success": true,
    "message": "Análisis generado correctamente.",
    "data": {
        "uid": "6NLMplhbdTPAoQz2R66Tb3p8ay43",
        "analysis": "El usuario mantiene un comportamiento financiero estable. Su nivel de ahorro es positivo, aunque existen oportunidades para reducir gastos recurrentes..."
    }
}
```

---

## Respuestas de Error

### Usuario inexistente

```text
404
```

```json
{
    "detail": "Usuario no encontrado."
}
```

---

### Error interno

```text
500
```

```json
{
    "detail": "Error interno del servidor."
}
```

---

## Validaciones

- UID obligatorio.
- Usuario registrado.
- Contexto financiero disponible.

---

# Endpoint 8

# Recomendaciones Inteligentes

## Método HTTP

POST

---

## Ruta

```http
/ai/recommend/{uid}
```

---

## Descripción

Genera recomendaciones financieras inteligentes y personalizadas utilizando la información financiera del usuario.

Las recomendaciones consideran:

- Balance.
- Gastos.
- Ingresos.
- Historial financiero.
- Estadísticas.
- Consejo diario.
- Comportamiento económico.

El resultado consiste en recomendaciones prácticas para mejorar la salud financiera del usuario.

---

## Parámetros

| Campo | Tipo | Obligatorio |
|--------|------|-------------|
| uid | String | Sí |

---

## Request

```http
POST /ai/recommend/6NLMplhbdTPAoQz2R66Tb3p8ay43
```

---

## Respuesta Exitosa

```json
{
    "success": true,
    "message": "Recomendaciones generadas correctamente.",
    "data": {
        "uid": "6NLMplhbdTPAoQz2R66Tb3p8ay43",
        "recommendations": "1. Mantener el nivel actual de ahorro.\n2. Reducir gastos innecesarios.\n3. Crear un fondo de emergencia equivalente a tres meses de gastos."
    }
}
```

---

## Error 404

```json
{
    "detail": "Usuario no encontrado."
}
```

---

## Error 500

```json
{
    "detail": "Error interno del servidor."
}
```

---

## Validaciones

- UID obligatorio.
- Usuario existente.
- Información financiera disponible.
- OpenAI configurado correctamente.

---

# Resumen de Endpoints IA Documentados

| Método | Endpoint | Estado |
|---------|----------|--------|
| POST | /ai/summary/{uid} | ✔ |
| POST | /ai/analyze/{uid} | ✔ |
| POST | /ai/recommend/{uid} | ✔ |

En la siguiente sección se documentarán las tres capacidades restantes:

- Predict
- Classify
- Chat

---

# Endpoint 9

# Predicción Financiera Inteligente

## Método HTTP

POST

---

## Ruta

```http
/ai/predict/{uid}
```

---

## Descripción

Este endpoint utiliza Inteligencia Artificial para generar una proyección del comportamiento financiero futuro del usuario utilizando el historial financiero almacenado en Firebase.

La predicción considera:

- Balance actual.
- Ingresos.
- Gastos.
- Nivel de ahorro.
- Tendencia financiera.
- Estadísticas del usuario.

El objetivo es proporcionar una estimación de la situación financiera futura junto con recomendaciones preventivas.

---

## Parámetros

| Campo | Tipo | Obligatorio | Descripción |
|--------|------|-------------|-------------|
| uid | String | Sí | Identificador del usuario |

---

## Request

```http
POST /ai/predict/6NLMplhbdTPAoQz2R66Tb3p8ay43
```

---

## Respuesta Exitosa

```json
{
    "success": true,
    "message": "Predicción generada correctamente.",
    "data": {
        "uid": "6NLMplhbdTPAoQz2R66Tb3p8ay43",
        "prediction": "Si el comportamiento financiero actual continúa, el usuario mantendrá un balance positivo durante los próximos meses..."
    }
}
```

---

## Errores

### Usuario inexistente

```json
{
    "detail": "Usuario no encontrado."
}
```

---

### Error interno

```json
{
    "detail": "Error interno del servidor."
}
```

---

## Validaciones

- UID obligatorio.
- Usuario existente.
- Información financiera disponible.
- Configuración correcta de OpenAI.

---

# Endpoint 10

# Clasificación Financiera Inteligente

## Método HTTP

POST

---

## Ruta

```http
/ai/classify/{uid}
```

---

## Descripción

Clasifica automáticamente el perfil financiero del usuario utilizando Inteligencia Artificial.

El modelo puede clasificar perfiles como:

- Conservador.
- Equilibrado.
- Ahorrador.
- Gastador.
- Alto Riesgo.

La clasificación depende del contexto financiero generado dinámicamente.

---

## Parámetros

| Campo | Tipo | Obligatorio |
|--------|------|-------------|
| uid | String | Sí |

---

## Request

```http
POST /ai/classify/6NLMplhbdTPAoQz2R66Tb3p8ay43
```

---

## Respuesta Exitosa

```json
{
    "success": true,
    "message": "Clasificación generada correctamente.",
    "data": {
        "uid": "6NLMplhbdTPAoQz2R66Tb3p8ay43",
        "classification": "Perfil Ahorrador. El usuario mantiene un balance positivo y un porcentaje de ahorro superior al promedio."
    }
}
```

---

## Validaciones

- UID obligatorio.
- Usuario registrado.
- Información financiera disponible.

---

# Endpoint 11

# Chat Financiero Inteligente

## Método HTTP

POST

---

## Ruta

```http
/ai/chat
```

---

## Descripción

Permite al usuario realizar consultas libres sobre su situación financiera.

A diferencia de los demás endpoints, este recibe una pregunta en el cuerpo de la solicitud.

La IA utiliza el contexto financiero construido desde Firebase para responder de manera personalizada.

---

## Body

```json
{
    "uid":"6NLMplhbdTPAoQz2R66Tb3p8ay43",
    "question":"¿Cómo puedo ahorrar más dinero?"
}
```

---

## Parámetros

| Campo | Tipo | Obligatorio | Descripción |
|--------|------|-------------|-------------|
| uid | String | Sí | Usuario registrado |
| question | String | Sí | Pregunta realizada por el usuario |

---

## Respuesta Exitosa

```json
{
    "success": true,
    "message": "Consulta procesada correctamente.",
    "data": {
        "uid":"6NLMplhbdTPAoQz2R66Tb3p8ay43",
        "question":"¿Cómo puedo ahorrar más dinero?",
        "answer":"De acuerdo con tu historial financiero, podrías incrementar tu ahorro reduciendo gastos variables y manteniendo el nivel actual de ingresos..."
    }
}
```

---

## Validaciones

- UID obligatorio.
- Pregunta obligatoria.
- Usuario registrado.
- Contexto financiero disponible.
- OpenAI disponible.

---

# Flujo de Procesamiento de Inteligencia Artificial

Cada endpoint de IA sigue el mismo flujo de ejecución.

```
Solicitud HTTP

↓

Router AI

↓

Validación del UID

↓

FinanceService

↓

FirebaseRepository

↓

Firebase Firestore

↓

Construcción del Perfil Financiero

↓

ContextBuilder

↓

Carga del Prompt

↓

OpenAIService

↓

OpenAI GPT

↓

Respuesta Inteligente

↓

Cliente
```

---

# Manejo Global de Errores

La API implementa respuestas estandarizadas para facilitar la integración con aplicaciones cliente.

| Código HTTP | Descripción |
|--------------|-------------|
| 200 | Solicitud procesada correctamente. |
| 400 | Solicitud inválida. |
| 404 | Usuario no encontrado. |
| 422 | Error de validación de parámetros. |
| 500 | Error interno del servidor. |

---

# Seguridad

La API implementa las siguientes buenas prácticas:

- Separación por capas.
- Validación mediante Pydantic.
- Variables sensibles mediante `.env`.
- Integración segura con Firebase Admin SDK.
- Comunicación con OpenAI mediante API Key.
- Manejo controlado de excepciones.

---

# Herramientas Utilizadas

Durante el desarrollo y las pruebas del proyecto se utilizaron:

- FastAPI
- Firebase Firestore
- Firebase Admin SDK
- OpenAI API
- Swagger UI
- ReDoc
- Postman
- cURL
- Uvicorn

---

# Resultados Obtenidos

Se desarrolló una API REST completamente funcional que permite:

- Consultar usuarios desde Firebase.
- Construir perfiles financieros dinámicamente.
- Generar contexto financiero personalizado.
- Ejecutar seis capacidades de Inteligencia Artificial.
- Documentar automáticamente la API mediante Swagger.

---

# Conclusiones

La implementación de Finance AI API demuestra la integración exitosa de una arquitectura REST basada en FastAPI con Firebase Firestore y OpenAI.

El proyecto utiliza una arquitectura por capas que facilita el mantenimiento, la escalabilidad y la reutilización de componentes.

La incorporación de múltiples capacidades inteligentes (Summary, Analyze, Recommend, Predict, Classify y Chat) permite ofrecer análisis financieros personalizados a partir de la información almacenada en Firebase.

La documentación generada mediante Swagger, junto con los ejemplos de uso y las pruebas realizadas con Postman y cURL, facilitan la integración de la API con aplicaciones cliente y garantizan una experiencia consistente para los desarrolladores.

---
