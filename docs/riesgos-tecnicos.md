# Riesgos técnicos y deuda técnica

## Riesgos identificados

| Riesgo | Categoría | Probabilidad | Impacto | Mitigación propuesta |
|---|---|---|---|---|
| Exposición de credenciales de Firebase y OpenAI | Seguridad / Configuración | Media | Alto | Mover secretos a variables de entorno y revisar reglas de acceso. |
| Dependencia fuerte de servicios externos | Dependencias / Modelo | Media | Medio | Implementar fallbacks y manejo de errores cuando la API no responda. |
| Calidad limitada del OCR en documentos poco claros | Datos / Modelo | Alta | Medio | Mejorar el procesamiento con reglas heurísticas y validación manual. |
| Falta de pruebas automatizadas | Código | Alta | Medio | Incorporar pruebas unitarias e integración desde la siguiente iteración. |
| Lógica de negocio parcialmente acoplada a la interfaz | Código | Media | Medio | Separar mejor servicios y componentes para facilitar mantenimiento. |
| Ausencia de monitoreo y observabilidad | Despliegue / Operación | Media | Medio | Agregar logs, métricas básicas y seguimiento de errores. |
| Riesgo de inconsistencia en datos financieros | Datos | Media | Alto | Validar entradas y mantener reglas de negocio claras para transacciones y billeteras. |

## Deuda técnica observada
- Configuración sensible mezclada con código fuente.
- Servicios de IA y acceso a datos usados directamente desde la capa de presentación.
- Falta de pruebas automáticas para proteger cambios futuros.
- Dependencia de procesos manuales en algunas funciones clave como OCR o carga de documentos.