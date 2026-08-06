# 💻 Finance AI API

# Ejemplos de uso con cURL

Este documento contiene ejemplos de consumo de todos los endpoints disponibles en Finance AI API utilizando **cURL**.

La URL base utilizada durante el desarrollo es:

```text
http://127.0.0.1:8000
```

---

# Endpoints Generales

## Información de la API

```bash
curl -X GET "http://127.0.0.1:8000/"
```

---

## Estado de la API

```bash
curl -X GET "http://127.0.0.1:8000/health"
```

---

## Metadata

```bash
curl -X GET "http://127.0.0.1:8000/metadata"
```

---

# Usuarios

## Obtener todos los usuarios

```bash
curl -X GET "http://127.0.0.1:8000/users"
```

---

## Obtener un usuario

```bash
curl -X GET "http://127.0.0.1:8000/users/6NLMplhbdTPAoQz2R66Tb3p8ay43"
```

---

# Inteligencia Artificial

## Resumen Financiero

```bash
curl -X POST \
"http://127.0.0.1:8000/ai/summary/6NLMplhbdTPAoQz2R66Tb3p8ay43"
```

---

## Análisis Financiero

```bash
curl -X POST \
"http://127.0.0.1:8000/ai/analyze/6NLMplhbdTPAoQz2R66Tb3p8ay43"
```

---

## Recomendaciones

```bash
curl -X POST \
"http://127.0.0.1:8000/ai/recommend/6NLMplhbdTPAoQz2R66Tb3p8ay43"
```

---

## Predicción

```bash
curl -X POST \
"http://127.0.0.1:8000/ai/predict/6NLMplhbdTPAoQz2R66Tb3p8ay43"
```

---

## Clasificación

```bash
curl -X POST \
"http://127.0.0.1:8000/ai/classify/6NLMplhbdTPAoQz2R66Tb3p8ay43"
```

---

## Chat Inteligente

Este endpoint requiere un cuerpo JSON.

```bash
curl -X POST "http://127.0.0.1:8000/ai/chat" \
-H "Content-Type: application/json" \
-d '{
  "uid":"6NLMplhbdTPAoQz2R66Tb3p8ay43",
  "question":"¿Cómo puedo ahorrar más dinero?"
}'
```

---

# Ejemplos de Errores

## Usuario inexistente

```bash
curl -X POST \
"http://127.0.0.1:8000/ai/summary/xxxxxxxxxxxxxxxx"
```

Respuesta esperada

```json
{
    "detail":"Usuario no encontrado."
}
```

---

## Chat sin pregunta

```bash
curl -X POST "http://127.0.0.1:8000/ai/chat" \
-H "Content-Type: application/json" \
-d '{
  "uid":"6NLMplhbdTPAoQz2R66Tb3p8ay43",
  "question":""
}'
```

Respuesta esperada

```text
HTTP 422 Unprocessable Entity
```

---

# Observaciones

- Todos los endpoints responden en formato JSON.
- Los endpoints de Inteligencia Artificial utilizan información almacenada en Firebase Firestore.
- El endpoint `/ai/chat` requiere un cuerpo JSON con el UID del usuario y la pregunta a realizar.
- Las respuestas generadas por la IA dependen del contexto financiero disponible para el usuario consultado.