# Rendimiento y escalabilidad — Ex-Codox

**Release:** `v1.0.0-rc.1`  
**Fecha:** 2026-08-22  
**Script de referencia:** [Finance_AI_API/benchmark_baseline.py](../../Finance_AI_API/benchmark_baseline.py)

## Alcance

La medición debe realizarse sobre la API desplegada utilizando una cuenta Firebase de demostración y un token temporal. No deben utilizarse datos financieros reales ni tokens almacenados en el repositorio.

## Línea base existente

El script actual:

- ejecuta `20` solicitudes;
- mide `POST /ai/predict/{uid}`;
- utiliza `FIREBASE_ID_TOKEN` desde el entorno;
- espera hasta `60` segundos por solicitud;
- registra solicitudes exitosas y fallidas;
- calcula tasa de error;
- calcula p50, p95 y máximo de solicitudes exitosas.

El script actual apunta por defecto a:

```text
http://127.0.0.1:8000
```

Para el release final debe utilizarse la URL pública de Render y un UID de demostración autorizado. La ejecución contra producción todavía no está registrada en este documento.

## Métricas requeridas

| Métrica | Resultado release `v1.0.0-rc.1` | Estado |
|---|---:|---|
| Solicitudes totales | PENDIENTE | Requiere ejecutar benchmark final |
| Solicitudes exitosas | PENDIENTE | Requiere ejecutar benchmark final |
| Solicitudes fallidas | PENDIENTE | Requiere ejecutar benchmark final |
| Tasa de error | PENDIENTE | Requiere ejecutar benchmark final |
| p50 | PENDIENTE | Requiere ejecutar benchmark final |
| p95 | PENDIENTE | Requiere ejecutar benchmark final |
| Máximo | PENDIENTE | Requiere ejecutar benchmark final |
| Cache hit | PENDIENTE | El script actual no lo contabiliza |
| Latencia total | PENDIENTE | Disponible por solicitud; debe consolidarse |

No se presentan métricas estimadas como resultados del release.

## Preparación de una medición segura

Definir temporalmente las variables en PowerShell:

```powershell
$env:BENCHMARK_BASE_URL = "https://API_PUBLICA_REAL"
$env:FIREBASE_ID_TOKEN = "TOKEN_TEMPORAL_DE_CUENTA_DEMO"
```

El script actual requiere modificar temporalmente su configuración para usar la URL pública y el UID de demostración, o recibir esos valores mediante una mejora posterior. El token no debe escribirse en `benchmark_baseline.py` ni en documentación.

Ejecutar desde `Finance_AI_API`:

```powershell
python benchmark_baseline.py
```

Guardar únicamente el resumen de métricas y eliminar el token de la sesión al finalizar:

```powershell
Remove-Item Env:FIREBASE_ID_TOKEN
Remove-Item Env:BENCHMARK_BASE_URL -ErrorAction SilentlyContinue
```

## Cuello de botella identificado

El camino de `predict` construye el perfil financiero, calcula fingerprint, consulta caché y, ante un cache miss, llama a OpenAI y persiste el resultado. Por diseño, las partes con mayor variabilidad esperada son:

1. lectura de datos en Firestore;
2. latencia de OpenAI;
3. persistencia del resultado y recomendaciones;
4. suspensión o recursos limitados del plan gratuito de Render.

Esta identificación se basa en el flujo de código y no sustituye una medición real.

## Mejoras aplicadas antes del release

- Caché por usuario, capacidad y fingerprint.
- Límite de contexto enviado a OpenAI.
- Límite de tokens de salida.
- Timeout de OpenAI.
- Reintentos limitados.
- Métricas internas por etapa en logs IA.
- Healthcheck y `X-Process-Time-Ms` para solicitudes HTTP.

## Plan de escalabilidad

### Etapa 1 — Servicio pequeño

- Mantener caché.
- Medir p50, p95, máximo y error rate por release.
- Vigilar logs de `ai_cache_hit` y `ai_request_completed`.
- Evitar benchmarks con datos reales.

### Etapa 2 — Mayor concurrencia

- Añadir rate limiting por usuario.
- Añadir límite de concurrencia para OpenAI.
- Separar tareas OCR o recordatorios de las solicitudes síncronas.
- Revisar índices y lecturas de Firestore.

### Etapa 3 — Operación estable

- Incorporar métricas centralizadas.
- Configurar alertas para errores 5xx, latencia y cuota.
- Fijar imagen Docker por digest.
- Ejecutar pruebas de carga controladas.
- Definir presupuesto y límites de OpenAI/Firebase/Render.

## Limitaciones actuales

- No se ha ejecutado el benchmark final contra la URL pública.
- El script usa un UID y una URL definidos en el archivo.
- El script no mide `cache_hit` directamente.
- No hay pruebas de carga concurrente.
- No hay rate limiting por usuario.
- No hay métricas históricas centralizadas.
- El plan gratuito de Render puede introducir latencia por suspensión.
- El proveedor OpenAI puede variar su latencia y disponibilidad.

## Evidencia que debe guardarse

- Commit o versión evaluada.
- URL pública utilizada, sin tokens.
- Fecha y hora de la medición.
- Número total de solicitudes.
- p50, p95 y máximo.
- Tasa de error.
- Porcentaje de cache hit, si se incorpora al benchmark.
- Logs IA anonimizados con `request_id`.
- Condiciones de la cuenta de demostración.
- Confirmación de que no se modificaron datos peligrosos.

## Criterio de aceptación

El rendimiento del release se considera documentado cuando la tabla de métricas contiene resultados obtenidos contra la API pública, la tasa de error está calculada, los outliers están explicados y las limitaciones conocidas están registradas.
