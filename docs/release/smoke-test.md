# Pruebas de humo del release

**Release objetivo:** `v1.0.0-rc.1`  
**Suite:** [Finance_AI_API/tests/smoke/test_smoke_api.py](../../Finance_AI_API/tests/smoke/test_smoke_api.py)

## Propósito

Verificar rápidamente que la API desplegada está disponible, que la autenticación funciona, que la autorización por UID se mantiene y que una entrada inválida produce un error controlado.

Las pruebas usan únicamente operaciones de lectura o validación. No crean transacciones, billeteras ni recordatorios.

## Requisitos

- URL pública de la API desplegada.
- Cuenta Firebase de demostración.
- UID de esa cuenta.
- Firebase ID Token vigente de esa cuenta.
- Segundo UID ficticio o de otra cuenta de prueba.
- Python con las dependencias de `Finance_AI_API/requirements.txt`.

Nunca guardes el token en el repositorio, documentación, capturas o logs.

## Configuración temporal

En PowerShell, definir las variables únicamente en la sesión actual:

```powershell
$env:SMOKE_BASE_URL = "https://api-publica.example.com"
$env:SMOKE_UID = "UID_DE_LA_CUENTA_DEMO"
$env:SMOKE_OTHER_UID = "UID_DE_OTRA_CUENTA_DEMO"
$env:SMOKE_FIREBASE_ID_TOKEN = "TOKEN_VIGENTE_DE_LA_CUENTA_DEMO"
```

No sustituyas estos valores por secretos dentro de archivos versionados.

## Ejecución

Desde `Finance_AI_API`:

```powershell
python -m unittest discover -s tests/smoke -v
```

También puede ejecutarse junto con los contratos backend:

```powershell
python -m unittest discover -s tests -v
```

Si las variables no están definidas, la suite de humo se marca como omitida para no intentar llamadas incompletas.

## Casos y resultados esperados

| Caso | Solicitud | Resultado esperado |
|---|---|---|
| Health | `GET /health` | `200` y `data.status=running` |
| Usuario autenticado | `GET /users/` con Bearer válido | `200` y `success=true` |
| Sin token | `GET /users/` sin Authorization | `401` y mensaje seguro |
| UID incorrecto | `GET /data/financial/{SMOKE_OTHER_UID}` con token válido | `403` sin modificar datos |
| Entrada inválida | `POST /ai/chat` con `question` vacío | `4xx`, normalmente `422`, sin stack trace |

## Resultado de esta preparación

- La suite fue creada.
- La suite se omite correctamente cuando no hay configuración de smoke.
- No se ejecutó contra una URL pública durante esta fase porque no se proporcionaron URL, UID ni token de demostración.
- La ejecución contra producción queda pendiente y no debe simularse con resultados inventados.

## Evidencia que debe guardarse

- URL pública utilizada, sin incluir tokens.
- Fecha y hora de la ejecución.
- Versión del release.
- Salida de la suite con códigos HTTP.
- Identificador de cuenta de demostración anonimizado si es necesario.
- Captura de `/health` sin secretos.
- Confirmación de que no se modificaron datos reales.

## Criterios de aprobación

El smoke test se considera aprobado cuando:

- `/health` responde `200`.
- Un usuario válido puede consultar `/users/`.
- Una solicitud sin token responde `401`.
- Un UID diferente responde `403`.
- Una entrada inválida responde `4xx` controlado.
- No se imprimen tokens, claves, stack traces ni datos financieros completos.

## Limitaciones

- El test autenticado depende de un Firebase ID Token vigente.
- No se renueva automáticamente la sesión.
- No prueba operaciones de escritura para evitar cambios peligrosos.
- No reemplaza pruebas de carga, pruebas de seguridad ni validación funcional completa de la aplicación.
