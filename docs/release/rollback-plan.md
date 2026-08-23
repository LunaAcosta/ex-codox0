# Plan de rollback — Ex-Codox

**Release candidato:** `v1.0.0-rc.1`  
**Versión estable objetivo:** `PENDIENTE DE REGISTRAR`  
**Fecha:** 2026-08-22  
**Responsable:** responsable técnico del proyecto o persona designada para la evaluación

## Propósito

Restaurar la última versión estable si el release candidato presenta una regresión de seguridad, disponibilidad, autenticación, datos o funciones IA.

Este procedimiento no elimina datos de Firestore ni modifica credenciales. El rollback debe realizarse primero sobre el servicio que presenta la regresión y después sobre el frontend si existe incompatibilidad visible.

## Activadores de rollback

Ejecutar rollback si ocurre uno o más de los siguientes eventos:

- `GET /health` falla o deja de responder `200`.
- Aumento significativo de errores `5xx`.
- Login o renovación de sesión dejan de funcionar.
- Firebase Authentication o Firestore no conectan.
- Endpoints IA dejan de responder o devuelven respuestas vacías repetidamente.
- Se detecta exposición de secretos.
- El frontend apunta a una API incompatible.
- Se produce una regresión en el flujo financiero crítico.
- La latencia o tasa de error impide utilizar la aplicación.
- Se detecta corrupción o inconsistencia de datos.

## Responsabilidades

| Rol | Responsabilidad |
|---|---|
| Responsable técnico | Decide y ejecuta rollback, o autoriza su ejecución |
| Responsable de despliegue | Revierte servicio Render y/o distribución frontend |
| Responsable Firebase | Verifica Auth, Firestore y reglas de acceso |
| Responsable de pruebas | Ejecuta verificaciones posteriores y conserva evidencia |

Una misma persona puede asumir varios roles en un proyecto académico, pero la decisión y la evidencia deben quedar registradas.

## Preparación previa

Antes de activar el release:

1. Registrar el commit del candidato.
2. Registrar el commit o versión estable anterior.
3. Confirmar que la versión estable puede reconstruirse o seleccionarse en Render/EAS.
4. Confirmar que `release-manifest.yml` identifica ambos estados.
5. Exportar o conservar la configuración de despliegue sin secretos.
6. Confirmar que no se requiere migración destructiva de Firestore.
7. Preparar una cuenta Firebase de demostración.
8. Conservar una copia de los resultados de smoke test.

## Procedimiento exacto para la API

1. Confirmar el activador y registrar hora, endpoint afectado y `request_id` si existe.
2. Pausar temporalmente nuevas demostraciones o tráfico de evaluación.
3. Abrir Render y seleccionar el servicio `finance-ai-api`.
4. Identificar el último deploy estable anterior a `v1.0.0-rc.1`.
5. Ejecutar el rollback a ese deploy o desplegar el commit estable anterior.
6. Mantener las variables privadas de Render sin copiarlas en archivos ni tickets.
7. Confirmar que las variables de versión y entorno corresponden a la versión estable.
8. Esperar a que Render indique el servicio como disponible.
9. Ejecutar `GET /health`.
10. Revisar logs recientes buscando errores `5xx`, fallos Firebase, fallos OpenAI o cambios anómalos de latencia.

## Procedimiento exacto para el frontend

Realizarlo si el frontend del candidato es incompatible con la API estable:

1. Identificar el build o publicación estable anterior.
2. Retirar de distribución el build candidato si la plataforma lo permite.
3. Volver a distribuir el build estable anterior mediante Expo/EAS o la plataforma utilizada.
4. Verificar que `EXPO_PUBLIC_API_URL` apunta a la API estable.
5. Confirmar que Firebase Authentication utiliza el mismo proyecto esperado.
6. Abrir la aplicación desde una instalación limpia o ventana privada.
7. Ejecutar el flujo de validación posterior.

## Compatibilidad de datos

El rollback debe ser compatible con los datos existentes porque:

- No se documentó una migración destructiva de Firestore.
- Los datos financieros permanecen en Firebase Firestore.
- El rollback no debe borrar usuarios, billeteras, transacciones ni recordatorios.
- La versión estable debe conservar los mismos nombres de colecciones y campos utilizados por el flujo crítico.
- Las entradas de caché IA pueden ignorarse o regenerarse si el fingerprint ya no coincide.

Si se detecta una incompatibilidad de esquema, detener el rollback automático y realizar primero una copia o revisión de los datos afectados.

## Backup y preservación

Antes de modificar datos o intentar una reparación:

- No ejecutar scripts destructivos.
- Conservar logs y `request_id` relacionados con el incidente.
- Exportar datos únicamente mediante un procedimiento autorizado de Firebase.
- No incluir datos personales completos en capturas o documentos.
- Registrar el momento y responsable de cualquier backup.

El rollback de código no sustituye un backup de Firestore si hubo una operación de datos incorrecta.

## Verificaciones posteriores

### API

```text
GET /health                         -> 200
GET /users/ con token válido        -> 200
GET /users/ sin token               -> 401
GET /data/financial/{UID_AJENO}     -> 403
POST /ai/chat con entrada inválida  -> 4xx controlado
```

### Aplicación

- Login.
- Renovación o persistencia de sesión.
- Consulta de balance.
- Consulta de transacciones.
- Consulta de billeteras.
- Consulta de estadísticas.
- Consulta de recordatorios.
- Una capacidad IA no destructiva.

### Operación

- `/health` estable durante el periodo de observación.
- Logs sin nuevos errores críticos.
- Firebase conectado.
- OpenAI disponible o errores controlados.
- Tasa de error dentro de los valores observados antes del incidente.
- Frontend usando la URL correcta.

## Cierre del incidente

1. Registrar causa del rollback.
2. Registrar versión candidata retirada.
3. Registrar versión estable restaurada.
4. Guardar respuestas HTTP y `request_id` sin tokens.
5. Documentar datos afectados, si los hubo.
6. Abrir una corrección para el release candidato.
7. No crear un nuevo tag hasta repetir las verificaciones.
8. Actualizar `release-manifest.yml` y el informe final.

## Evidencia requerida

- Captura o registro del activador.
- Versión/commit candidato.
- Versión/commit estable.
- Hora de inicio y fin.
- Resultado de `/health`.
- Resultado de login.
- Resultado de flujo financiero crítico.
- Resultado de endpoint IA.
- Logs relacionados sin secretos.
- Confirmación de integridad de datos.

## Limitaciones

- La versión estable exacta aún no está registrada en el repositorio.
- El procedimiento de Render depende de que exista un deploy anterior seleccionable.
- El procedimiento de frontend depende de la plataforma real de distribución.
- No se ha probado un rollback real en producción.
- No se ha confirmado una política de backup automática de Firestore.
