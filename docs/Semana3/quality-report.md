# Informe de pruebas, CI y errores

Fecha de verificación: **2026-08-02**  
Entorno: Windows, Node.js 24.18.1, npm 11.16.0 y Python 3.14.5.

## Evidencia de ejecución local

Las verificaciones se ejecutaron sobre el código real del repositorio, no sobre un proyecto de demostración.

### Expo

Comando:

```powershell
cd ex-codox0
npm test
```

Resultado observado:

```text
tests 3
pass 3
fail 0
duration_ms 297.659
```

Casos cubiertos:

1. El repositorio conserva las rutas necesarias para datos, IA, recomendaciones y recordatorios.
2. El cliente agrega el Firebase ID token y no incluye claves privadas de OpenAI.
3. `.env.example` documenta API y Firebase sin publicar valores reales.

Verificaciones adicionales:

```text
npx tsc --noEmit  -> exit code 0
npm run lint      -> exit code 0
```

### FastAPI

Comando:

```powershell
cd Finance_AI_API
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Resultado observado:

```text
Ran 10 tests in 0.434s
OK
```

Los casos cubren las cinco capacidades de IA, aislamiento por usuario, autenticación 401/403, chat, OCR y fechas del recibo, datos financieros, recordatorios, caché y persistencia de recomendaciones.

Verificación adicional:

```text
.\.venv\Scripts\python.exe -m compileall -q app -> exit code 0
```

## Pipeline CI/CD

Se agregó `.github/workflows/ci.yml` con dos trabajos y sin secretos reales:

- `mobile`: `npm ci`, pruebas, TypeScript y ESLint.
- `api`: instalación de requisitos, pruebas unitarias y `compileall`.

### Intento documentado

La ejecución remota no puede iniciarse desde este entorno porque los cambios todavía no se han enviado a GitHub y no se autorizó un `push`. Como evidencia previa al primer run remoto, se ejecutaron localmente todos los comandos del workflow con resultado correcto. Tras subir el commit, GitHub Actions lo ejecutará automáticamente en un `push` o `pull_request`; también puede iniciarse con `workflow_dispatch`.

Este estado es un **bloqueo externo no funcional**: no indica un fallo del pipeline, sino que todavía no existe una revisión remota asociada a estos cambios.

## Registro de hallazgos y correcciones

| Hallazgo | Impacto | Corrección | Estado |
|---|---|---|:---:|
| Expo no tenía carpeta ni comando de pruebas | No había evidencia automatizada del contrato cliente/API | Se agregó `ex-codox0/tests/api-contract.test.js` y `npm test` | Corregido |
| No existía workflow del repositorio | Los cambios no tenían validación automática | Se agregó `.github/workflows/ci.yml` | Corregido |
| Firebase Web SDK estaba configurado con valores literales en dos archivos | Configuración ligada a un proyecto y visible en el código | Se creó `firebaseOptions.ts` y se usan variables `EXPO_PUBLIC_FIREBASE_*` | Corregido |
| El import de FastAPI inicializaba Firebase Admin durante las pruebas | CI necesitaría una cuenta de servicio real | La suite evita la inicialización al importar y usa mocks explícitos | Corregido |
| Faltaba evidencia persistente de las ejecuciones | El resultado solo quedaba en la terminal local | Se creó este informe con comandos y resultados | Corregido |
| `TestClient` muestra una advertencia de deprecación de Starlette sobre `httpx` | No falla pruebas, pero puede exigir migración futura | Mantener vigiladas las versiones; migrar cuando la API recomendada esté estable | Pendiente no bloqueante |
| Pipeline remoto aún no ejecutado | No hay enlace ni run ID de GitHub Actions | Subir los cambios y ejecutar el workflow | Bloqueo externo |

## Seguridad de variables

Se verificó con `git ls-files` que no están versionados:

- `ex-codox0/.env`
- `Finance_AI_API/.env`
- `Finance_AI_API/credentials/firebase-admin.json`

Los archivos `.env.example` contienen nombres de variables, URLs locales y marcadores. La clave de OpenAI solo pertenece al backend. Las variables Expo son configuración pública del Firebase Web SDK y nunca deben contener una clave privada de Firebase Admin.

## Cómo actualizar esta evidencia

Después de cada cambio relevante:

1. Ejecutar los comandos de ambos proyectos.
2. Registrar fecha, versiones y resumen de resultados.
3. Añadir el enlace o identificador del run de GitHub Actions cuando esté disponible.
4. Documentar errores nuevos, su corrección o el motivo concreto del bloqueo.
