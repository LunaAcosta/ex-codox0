# Arquitectura objetivo de Ex-Codox

## Visión general
La arquitectura objetivo busca separar claramente la interfaz, la lógica de negocio, la inteligencia artificial y la persistencia para que el sistema sea más escalable, mantenible y seguro.

## Capa de interfaz
La app móvil seguirá desarrollándose con React Native y Expo Router. La interfaz deberá mantenerse simple, clara y orientada a la experiencia financiera del usuario.

## Capa de negocio
Se recomienda consolidar la lógica en servicios especializados para:
- autenticación y usuarios,
- transacciones,
- billeteras,
- recomendaciones,
- OCR y extracción documental,
- análisis financiero.

## Capa de inteligencia artificial
Se espera que la IA se mantenga como un componente independiente que procese:
- recomendaciones personalizadas,
- respuestas conversacionales,
- clasificación y análisis de gastos,
- extracción automática de datos a partir de comprobantes.

## Capa de datos
La persistencia debe mantenerse en Firebase, pero con mejores prácticas de seguridad y organización. El sistema deberá separar mejor los datos de sesión, transacciones, archivos y preferencias del usuario.

## Propuesta de evolución
- Semana 2: definir una API o servicio inteligente que exponga contratos claros de entrada y salida.
- Semana 3: incorporar pruebas unitarias e integración y automatización básica.
- Semana 4: preparar despliegue con Expo EAS o un entorno simulado.
- Semana 5: incorporar logs, métricas y monitoreo básico.
- Semana 6: reforzar seguridad, documentación y presentación final.

## Recomendaciones de diseño
- Mantener variables de entorno para credenciales y llaves de servicio.
- Evitar lógica compleja dentro de componentes de UI.
- Aislar los servicios externos para facilitar pruebas y cambios futuros.
- Implementar validación y manejo de errores en cada capa.