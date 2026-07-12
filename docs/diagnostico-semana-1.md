# Diagnóstico técnico - Semana 1

## Estado actual del proyecto
Ex-Codox se encuentra en una etapa de prototipo funcional. La aplicación móvil ya permite autenticación de usuarios, registro de billeteras, creación de transacciones, visualización de estadísticas y uso de un asistente financiero basado en IA.

## Partes que funcionan actualmente
- Registro e inicio de sesión con Firebase Authentication.
- Gestión de billeteras y transacciones.
- Pantallas de navegación con Expo Router y tabs.
- Visualización de información financiera en la interfaz.
- Integración con OpenAI para asistente financiero y recomendaciones.
- OCR básico para extracción de datos desde documentos o imágenes.

## Partes manuales, incompletas o frágiles
- El OCR depende de la calidad del documento y del modelo externo.
- La arquitectura aún mezcla interfaz, lógica y acceso a servicios en varios archivos.
- Falta una estrategia formal de pruebas automatizadas.
- La configuración de Firebase y credenciales de OpenAI requiere cuidados para no exponer información sensible.
- Algunas funciones de recomendación y alertas todavía están incompletas.

## Dependencias técnicas actuales
- React Native + Expo.
- TypeScript.
- Firebase Authentication y Firestore.
- OpenAI API.
- Async Storage para persistencia local.
- Expo Image Picker y Document Picker.
- React Navigation y Expo Router.

## Datos, archivos, servicios y credenciales que necesita
- Un proyecto Firebase configurado.
- Clave de API de OpenAI.
- Archivos de imagen o documentos para OCR.
- Datos de usuarios, billeteras y transacciones registradas desde la app.
- Variables de entorno para proteger credenciales.

## Cómo se ejecuta actualmente
1. Instalar dependencias con npm install.
2. Configurar las variables de entorno.
3. Ejecutar la app con npx expo start.
4. Seleccionar Android, iOS.

## Evidencia de que el prototipo funciona
La evidencia se observa en la implementación actual del proyecto:
- pantallas funcionales en [src/app](../src/app),
- servicios de negocio en [services](../services),
- configuración de autenticación y base de datos en [config/firebase.tsx](../config/firebase.tsx),
- y el flujo de IA en [services/financialAssistantService.ts](../services/financialAssistantService.ts) y [services/ocrService.ts](../services/ocrService.ts).