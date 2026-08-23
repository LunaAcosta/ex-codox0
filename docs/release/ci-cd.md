# CI/CD y cadena de verificación

**Workflow:** [.github/workflows/ci.yml](../../.github/workflows/ci.yml)  
**Release objetivo:** `v1.0.0-rc.1`

## Activadores

El workflow se ejecuta en:

- Push a `main`.
- Push a `master`.
- Pull requests.
- Ejecución manual mediante `workflow_dispatch`.

## Permisos

El workflow declara únicamente:

```yaml
permissions:
  contents: read
```

No necesita permisos de escritura para ejecutar las verificaciones.

## Job frontend

El job `mobile` utiliza Ubuntu y Node.js 24. Ejecuta:

```text
npm ci
npm run ci
```

`npm run ci` incluye:

```text
npm test
npm run typecheck
npm run lint
```

El frontend utiliza `package-lock.json` y la caché de npm configurada mediante `actions/setup-node`.

## Job backend

El job `api` utiliza Ubuntu y Python 3.12. Su directorio de trabajo es `Finance_AI_API` y ejecuta:

```text
python -m pip install --upgrade pip
pip install -r requirements.txt
pip check
python -m unittest discover -s tests -v
python -m compileall -q app
```

`requirements.txt` contiene versiones fijadas y la caché de pip utiliza ese archivo como dependencia.

## Secretos

- CI usa un placeholder no real para `OPENAI_API_KEY`.
- No se imprimen claves privadas.
- Las credenciales Firebase no se requieren para los tests contractuales porque se usan dobles controlados.
- Los smoke tests contra producción requieren variables temporales y no forman parte del pipeline normal.

## Estado verificado localmente

- `npm ci --ignore-scripts`: correcto.
- `npm run test`: 3 pruebas correctas.
- `npm run typecheck`: correcto.
- `npm run lint`: correcto.
- `python -m unittest discover -s tests -q`: correcto.
- `python -m compileall -q app`: correcto.
- `pip check`: sin conflictos.

## Verificaciones fuera del CI normal

Estas verificaciones deben ejecutarse en una etapa controlada antes del release:

- `npm audit` y decisión sobre vulnerabilidades.
- `pip-audit` para dependencias Python.
- Smoke tests contra la URL pública.
- Pruebas con Firebase y OpenAI reales.
- Build y despliegue Docker.
- Validación de rollback.

No se agregan al pull request por defecto porque pueden requerir secretos, consumir cuota o modificar datos si se configuran incorrectamente.

## Limitaciones actuales

- `npm audit` reporta vulnerabilidades transitivas pendientes.
- `pip-audit` no está instalado en el entorno actual.
- No existe todavía un job de smoke contra producción.
- No existe un job de despliegue automático; Render se configura por separado.
- No se publican tags ni releases automáticamente.

## Criterio de aprobación

El CI se considera aprobado cuando ambos jobs terminan correctamente y no se introducen secretos en el workflow. La aprobación del release requiere además ejecutar manualmente smoke, seguridad, despliegue y rollback.
