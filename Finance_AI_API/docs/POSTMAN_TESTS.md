# 📬 Finance AI API

# Guía de Pruebas con Postman

Este documento describe el conjunto de pruebas realizadas sobre Finance AI API utilizando **Postman**.

El objetivo es validar el correcto funcionamiento de todos los endpoints implementados.

---

# Configuración

## Base URL

```
http://127.0.0.1:8000
```

---

# Usuario de Prueba

Durante las pruebas se utilizó el siguiente UID registrado en Firebase Firestore.

```
6NLMplhbdTPAoQz2R66Tb3p8ay43
```

---

# Orden Recomendado de Pruebas

Se recomienda ejecutar los endpoints en el siguiente orden.

```
1. GET /

2. GET /health

3. GET /metadata

4. GET /users

5. GET /users/{uid}

6. POST /ai/summary/{uid}

7. POST /ai/analyze/{uid}

8. POST /ai/recommend/{uid}

9. POST /ai/predict/{uid}

10. POST /ai/classify/{uid}

11. POST /ai/chat
```

---

# Prueba 1

## Información General

### Método

GET

### Endpoint

```
/
```

### Resultado Esperado

```
HTTP 200
```

### Validaciones

- success = true
- version
- status
- documentation

---

# Prueba 2

## Health

### Método

GET

### Endpoint

```
/health
```

### Resultado Esperado

```
HTTP 200
```

### Validaciones

- Firebase conectado
- OpenAI configurado
- API funcionando

---

# Prueba 3

## Metadata

### Método

GET

### Endpoint

```
/metadata
```

### Resultado Esperado

```
HTTP 200
```

### Validaciones

- Nombre de la API
- Framework
- Base de datos
- IA

---

# Prueba 4

## Obtener Usuarios

### Método

GET

### Endpoint

```
/users
```

### Resultado Esperado

```
HTTP 200
```

### Validaciones

- success = true
- count
- data

---

# Prueba 5

## Obtener Usuario

### Método

GET

### Endpoint

```
/users/6NLMplhbdTPAoQz2R66Tb3p8ay43
```

### Resultado Esperado

```
HTTP 200
```

### Validaciones

- UID
- Nombre
- Email

---

# Prueba 6

## Summary

### Método

POST

### Endpoint

```
/ai/summary/6NLMplhbdTPAoQz2R66Tb3p8ay43
```

### Resultado Esperado

```
HTTP 200
```

### Validaciones

- success = true
- uid
- summary

---

# Prueba 7

## Analyze

### Método

POST

### Endpoint

```
/ai/analyze/6NLMplhbdTPAoQz2R66Tb3p8ay43
```

### Resultado Esperado

```
HTTP 200
```

### Validaciones

- success = true
- uid
- analysis

---

# Prueba 8

## Recommend

### Método

POST

### Endpoint

```
/ai/recommend/6NLMplhbdTPAoQz2R66Tb3p8ay43
```

### Resultado Esperado

```
HTTP 200
```

### Validaciones

- success = true
- uid
- recommendations

---

# Prueba 9

## Predict

### Método

POST

### Endpoint

```
/ai/predict/6NLMplhbdTPAoQz2R66Tb3p8ay43
```

### Resultado Esperado

```
HTTP 200
```

### Validaciones

- success = true
- uid
- prediction

---

# Prueba 10

## Classify

### Método

POST

### Endpoint

```
/ai/classify/6NLMplhbdTPAoQz2R66Tb3p8ay43
```

### Resultado Esperado

```
HTTP 200
```

### Validaciones

- success = true
- uid
- classification

---

# Prueba 11

## Chat

### Método

POST

### Endpoint

```
/ai/chat
```

### Headers

```
Content-Type

application/json
```

### Body

```json
{
    "uid":"6NLMplhbdTPAoQz2R66Tb3p8ay43",
    "question":"¿Cómo puedo ahorrar más dinero?"
}
```

### Resultado Esperado

```
HTTP 200
```

### Validaciones

- success = true
- uid
- question
- answer

---

# Casos de Error

## Usuario inexistente

Endpoint

```
POST /ai/summary/xxxxxxxxxxxxxxxx
```

Resultado esperado

```
HTTP 404
```

---

## Chat sin pregunta

```json
{
    "uid":"6NLMplhbdTPAoQz2R66Tb3p8ay43",
    "question":""
}
```

Resultado esperado

```
HTTP 422
```

---

## UID inexistente

```
GET /users/xxxxxxxxxxxxxxxx
```

Resultado esperado

```
HTTP 404
```

---

# Criterios de Aceptación

La API se considera validada cuando:

- Todos los endpoints responden correctamente.
- Firebase devuelve información del usuario.
- OpenAI genera respuestas en español.
- Los endpoints de IA utilizan información real obtenida desde Firebase.
- Swagger documenta correctamente toda la API.
- No existen errores internos durante las pruebas.

---

# Resultado Final

| Endpoint | Estado |
|----------|--------|
| GET / | ✅ |
| GET /health | ✅ |
| GET /metadata | ✅ |
| GET /users | ✅ |
| GET /users/{uid} | ✅ |
| POST /ai/summary/{uid} | ✅ |
| POST /ai/analyze/{uid} | ✅ |
| POST /ai/recommend/{uid} | ✅ |
| POST /ai/predict/{uid} | ✅ |
| POST /ai/classify/{uid} | ✅ |
| POST /ai/chat | ✅ |

---

# Conclusión

Las pruebas realizadas mediante Postman verifican el correcto funcionamiento de los once endpoints implementados en Finance AI API.

La integración entre FastAPI, Firebase Firestore y OpenAI permite generar respuestas inteligentes utilizando el contexto financiero real del usuario, validando el cumplimiento de los objetivos planteados para el proyecto.