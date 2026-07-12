# Arquitectura actual de Ex-Codox

## 1. Usuario o actor principal
El usuario principal es una persona que desea controlar sus ingresos, gastos y ahorro de forma sencilla, especialmente estudiantes universitarios o personas interesadas en mejorar sus finanzas personales.

## 2. Interfaz o punto de entrada
La aplicación inicia desde Expo Router en [src/app](../src/app), con pantallas principales para autenticación, bienvenida, billeteras, transacciones, estadísticas y perfil. La navegación se organiza mediante tabs y modales.

## 3. Backend, script, notebook o servicio actual
El proyecto no cuenta con un backend independiente; la lógica de negocio se implementa en servicios TypeScript ubicados en [services](../services). Estos servicios consumen Firebase y OpenAI directamente desde la app cliente.

## 4. Componente de IA
La IA se integra a través de:
- [services/financialAssistantService.ts](../services/financialAssistantService.ts): asistente financiero conversacional.
- [services/ocrService.ts](../services/ocrService.ts): extracción de datos a partir de recibos o documentos.
- [services/recommendationService.ts](../services/recommendationService.ts): generación de recomendaciones financieras.

Actualmente se usa OpenAI con modelos como GPT-4o Mini y GPT-4.1 Mini.

## 5. Datos utilizados
La app trabaja con:
- Datos de usuarios y sesión.
- Transacciones financieras (ingresos, gastos, categorías, montos, fechas).
- Billeteras y saldo disponible.
- Imágenes de recibos o documentos para OCR.
- Consultas del usuario al asistente financiero.

## 6. Servicios externos
- Firebase Authentication para autenticación.
- Firestore para almacenamiento de datos.
- OpenAI API para IA.
- Expo Image Picker y Document Picker para captura y selección de archivos.

## 7. Flujo básico de información
1. El usuario inicia sesión o crea una cuenta.
2. Registra billeteras y transacciones desde la interfaz.
3. Los servicios almacenan y procesan la información en Firebase.
4. La app muestra estadísticas y resúmenes financieros.
5. Si el usuario sube un documento, el sistema intenta extraer información mediante OCR y la transforma en una transacción sugerida.
6. El asistente financiero puede responder preguntas a partir del contexto financiero del usuario.

## 8. Dependencias manuales o puntos frágiles
- La configuración de Firebase está centralizada en [config/firebase.tsx](../config/firebase.tsx) y podría mejorarse con variables de entorno.
- La lógica de IA depende de la disponibilidad de la API y de la calidad de los datos ingresados por el usuario.
- El OCR es parcial y puede fallar con documentos poco claros.
- No existe todavía una capa de backend independiente ni pruebas automatizadas completas.