
# Project Title

A brief description of what this project does and who it's for

# EX-CODOX

## 1. Información General 

**Módulo:** Módulo 4 - Desarrollo de Aplicaciones con IA      
**Semana:** Semana 1 - Diagnóstico y arquitectura inicial

**Integrantes del equipo**

Emely Alexandra Guevara Jimenez   
Natalia Alexandra Trigueros Blanco        
Kevin Alexander Luna Acosta


## 2. Descripción del problema

La gestión de las finanzas personales representa un desafío para muchos estudiantes universitarios debido a la falta de planificación financiera, ingresos limitados y escasos conocimientos sobre educación financiera. Estas dificultades pueden ocasionar gastos innecesarios, problemas de ahorro y una administración ineficiente de los recursos económicos.

Aunque existen aplicaciones para registrar ingresos y gastos, la mayoría únicamente permiten almacenar información financiera sin realizar un análisis inteligente del comportamiento económico del usuario ni ofrecer recomendaciones personalizadas.

Ex-Codox busca resolver esta problemática integrando Inteligencia Artificial para analizar los hábitos financieros del usuario, generar recomendaciones, emitir alertas preventivas y proporcionar asistencia conversacional que facilite una mejor planificación financiera.


## 3. Usuarios o Beneficiarios

| Usuario / Beneficiario                                  | Necesidad principal                                | Cómo ayuda la aplicación                                                                                                  |
| ------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Estudiantes universitarios                              | Controlar sus ingresos, gastos y ahorro.           | Permite registrar transacciones, administrar billeteras y recibir recomendaciones financieras personalizadas mediante IA. |
| Personas interesadas en mejorar sus finanzas personales | Organizar y analizar su comportamiento financiero. | Proporciona estadísticas, alertas inteligentes, proyecciones y un asistente financiero conversacional.                    |

---


## 4. Descripción de la Solución

Ex-Codox es una aplicación móvil que facilita la administración de las finanzas personales mediante una interfaz intuitiva y herramientas inteligentes.

La aplicación permite:

* Registro e inicio de sesión de usuarios.
* Gestión de billeteras.
* Registro de ingresos y gastos.
* Visualización de estadísticas financieras.
* Captura de recibos mediante OCR.
* Generación de recomendaciones financieras.
* Alertas inteligentes.
* Proyecciones de saldo.
* Asistente financiero conversacional (Codox IA).

### Entrada

* Información financiera registrada por el usuario.
* Consultas realizadas al asistente financiero.
* Imágenes de recibos o facturas.

### Procesamiento

Los datos son almacenados en Firebase Firestore y procesados mediante modelos de Inteligencia Artificial de OpenAI para generar análisis financieros personalizados.

### Salida

* Estadísticas financieras.
* Recomendaciones inteligentes.
* Alertas preventivas.
* Proyecciones financieras.
* Respuestas del chatbot.
* Registro automático de transacciones mediante OCR.

---


## 5. Componente de Inteligencia Artificial      
 

| Elemento                                  | Descripción                                                                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo de IA utilizada**                  | Inteligencia Artificial Generativa (LLM) y Procesamiento de Lenguaje Natural (NLP).                                                                                                               |
| **Modelo, algoritmo, servicio o técnica** | OpenAI API utilizando los modelos GPT-4o Mini y GPT-4.1 Mini.                                                                                                                                     |
| **Datos de entrada**                      | Historial de transacciones, billeteras, ingresos, gastos, consultas del usuario e imágenes de recibos para OCR.                                                                                   |
| **Resultado generado por la IA**          | Recomendaciones financieras, análisis de hábitos de consumo, alertas inteligentes, proyecciones financieras, respuestas conversacionales y extracción automática de información desde recibos.    |
| **Métrica o forma de evaluación**         | Validación funcional mediante pruebas de la aplicación, verificando la coherencia de las respuestas, la utilidad de las recomendaciones y el correcto funcionamiento del OCR.                     |
| **Limitaciones actuales**                 | El chatbot y el sistema de recomendaciones dependen de modelos preentrenados y de la calidad de los datos registrados por el usuario, por lo que su nivel de personalización aún puede mejorarse. |



La Inteligencia Artificial es uno de los componentes principales de Ex-Codox. Mediante la integración de modelos preentrenados de OpenAI, la aplicación analiza la información financiera registrada por el usuario para generar recomendaciones personalizadas, detectar patrones de gasto, elaborar proyecciones de saldo y responder consultas en lenguaje natural a través de Codox IA. Además, la IA participa en el procesamiento de recibos mediante OCR, facilitando el registro automático de transacciones y mejorando la experiencia de uso.


## 6. Estado Actual del Proyecto

### Funcionalidades que ya funcionan

- **Autenticación de usuarios:** Registro e inicio de sesión con Firebase Authentication.
- **Gestión de billeteras:** Crear, editar y eliminar billeteras para organizar fondos.
- **Registro de transacciones:** Agregar ingresos y gastos con categorías, montos y descripciones.
- **Visualización de estadísticas:** Gráficas y tablas que muestran el comportamiento financiero.
- **Interfaz responsiva:** Navegación con pestañas y modales para interacción intuitiva.
- **Autenticación con contexto:** Sistema de autenticación persistente con React Context.

### Funcionalidades incompletas o pendientes

- **OCR mejorado:** Optimizar la extracción de información de recibos (imageService y ocrService).
- **Sistema de recomendaciones avanzado:** Mejorar la lógica de recomendaciones basada en patrones de gasto (recommendationService).
- **Alertas inteligentes:** Implementar notificaciones proactivas cuando se detecten gastos anómalos.
- **Proyecciones financieras:** Desarrollar algoritmo de predicción de saldo futuro.
- **Mejora del chat:** Expandir las capacidades del asistente Codox IA con más contexto financiero.
- **Exportación de reportes:** Permitir descargar informes en PDF o CSV.

### Evidencias actuales

- Aplicación funcional en desarrollo usando Expo.
- Sistema de autenticación y gestión de usuarios implementado.
- Interfaz base con navegación por pestañas completada.
- Servicios conectados a Firebase Firestore para almacenamiento de datos.
- Integración con OpenAI API para funciones de IA (chatbot y recomendaciones)

---


## 7. Arquitectura Actual

Ex-Codox utiliza una arquitectura cliente-servidor con componentes de IA integrados. La aplicación se estructura en capas de presentación, lógica de negocios y acceso a datos.

**Componentes actuales:**

| Componente | Descripción | Estado actual |
|---|---|---|
| **Interfaz de usuario** | React Native con Expo. Pantallas de autenticación, gestión de billeteras, transacciones, estadísticas y asistente IA. | ✅ Funcional |
| **Lógica de negocio** | Servicios TypeScript (financialAssistantService, recommendationService, transactionService, walletService, userService). | ✅ Parcialmente funcional |
| **Componente IA** | Integración con OpenAI API (GPT-4o Mini, GPT-4.1 Mini) para chatbot, recomendaciones y OCR. | ✅ Funcional |
| **Base de datos** | Firebase Firestore para almacenamiento de usuarios, transacciones, billeteras y datos de sesión. | ✅ Funcional |
| **Servicios externos** | Firebase Authentication, OpenAI API, Cloudinary (almacenamiento de imágenes). | ✅ Funcional |
| **Configuración** | Firebase config centralizada en config/firebase.tsx, variables de entorno para credenciales. | ✅ Funcional |

**Flujo de arquitectura:**

```
[Interfaz (React Native/Expo)]
         ↓
[Componentes React + Hooks]
         ↓
[Servicios (lógica de negocio)]
         ↓
[Firebase Firestore] ← → [OpenAI API] ← → [Cloudinary]
         ↓
[Context API (Autenticación)]
```

**Estructura de directorios:**

- `src/app/`: Pantallas principales, rutas y navegación de la aplicación mediante Expo Router.
- `src/components/`: Componentes reutilizables de la interfaz de usuario (botones, tarjetas, listas, modales, encabezados, etc.).
- `src/constants/`: Constantes globales como temas, colores, configuraciones y datos estáticos.
- `src/hooks/`: Hooks personalizados para reutilizar lógica de negocio y acceso a datos.
- `services/`: Lógica de negocio, integración con inteligencia artificial, OCR, gestión de transacciones, billeteras, usuarios y otros servicios externos.
- `contexts/`: Gestión del estado global de la aplicación, incluyendo la autenticación de usuarios.
- `config/`: Configuración e inicialización de servicios externos, como Firebase Authentication y Firestore.
- `utils/`: Funciones auxiliares y utilidades compartidas para el procesamiento de datos y estilos.
- `assets/`: Recursos estáticos de la aplicación, como íconos y otros archivos multimedia.
- `images/`: Imágenes utilizadas en la interfaz de usuario.
- `scripts/`: Scripts auxiliares para tareas de mantenimiento y configuración del proyecto.
- `types.ts`: Definición de tipos e interfaces globales utilizadas en toda la aplicación.
- `app.json`: Archivo de configuración principal del proyecto Expo.
- `package.json`: Gestión de dependencias, scripts y metadatos del proyecto.
- `tsconfig.json`: Configuración del compilador de TypeScript.
- `README.md`: Documentación general del proyecto, instrucciones de instalación, ejecución y descripción de la solución.

---


## 8. Arquitectura Objetivo
El proyecto debería evolucionar hacia una arquitectura modular que separe claramente la interfaz, la lógica de negocio, la inteligencia artificial y el almacenamiento de datos. La meta es que Ex-Codox siga funcionando como una app móvil con experiencia fluida para el usuario, mientras la IA y los servicios de datos se mantienen desacoplados para facilitar mantenimiento y escalabilidad.

### Arquitectura propuesta
- Interfaz móvil: React Native + Expo Router para pantallas de autenticación, billeteras, transacciones, estadísticas y asistente financiero.
- Servicios de negocio: módulos TypeScript especializados para transacciones, usuarios, billeteras, recomendaciones y OCR.
- Servicio inteligente: integración con OpenAI para análisis financiero, recomendaciones, respuestas conversacionales y extracción de información desde recibos.
- Persistencia: Firebase Authentication + Firestore para usuarios, transacciones y perfiles financieros.
- Variables de entorno: configuración externa para claves de IA y credenciales de servicios.
- Despliegue: Expo EAS Build para distribución móvil y Firebase/servicios cloud para almacenamiento y autenticación.
- Observabilidad: logs de operaciones, manejo de errores y métricas básicas de uso del asistente financiero.

### Pruebas mínimas esperadas
- Pruebas unitarias para servicios de cálculo financiero y normalización de categorías.
- Pruebas de integración para autenticación y persistencia en Firestore.
- Pruebas de flujo de usuario para registro, login, creación de transacciones y uso del asistente IA.

### Consideraciones de seguridad
- No almacenar claves privadas en el repositorio.
- Usar variables de entorno y reglas de seguridad en Firestore.
- Limitar el acceso a datos financieros sensibles.
- Validar entradas del usuario antes de enviarlas a servicios externos.

### Diagrama de arquitectura objetivo
```text
[React Native / Expo UI]
        ↓
[Hooks y componentes reutilizables]
        ↓
[Servicios de negocio y IA]
   ├─ Transacciones / Wallets / Usuarios
   ├─ Recomendaciones / Chat financiero
   └─ OCR y extracción de documentos
        ↓
[Firebase Auth + Firestore + Storage]
        ↓
[OpenAI API / modelos generativos]
```

Documento detallado: [docs/arquitectura-objetivo.md](docs/arquitectura-objetivo.md)
---
## 9. Estructura del Repositorio
La organización actual del proyecto está orientada a una aplicación móvil modular con carpetas para interfaz, servicios y configuración.

```text
EX-CODOX0/
assets/
config/
contexts/
docs/
images/
scripts/
services/
src/
  app/
  components/
  constants/
  hooks/
utils/
app.json
package.json
tsconfig.json
types.ts
README.md
.env.example
```

### Descripción de las carpetas principales
- assets/ y images/: recursos visuales de la app.
- config/: inicialización de Firebase y otros servicios externos.
- contexts/: manejo del estado global de autenticación.
- docs/: documentación técnica y arquitectura objetivo.
- services/: lógica de negocio y conexión con OpenAI, OCR, transacciones y usuarios.
- src/app/: pantallas principales y rutas de navegación con Expo Router.
- src/components/: componentes reutilizables de la interfaz.
- src/constants/ y src/hooks/: datos estáticos y hooks personalizados.
- utils/: utilidades y funciones auxiliares compartidas.
- scripts/: tareas auxiliares de mantenimiento.
---
## 10. Instalación y Ejecución
### Requisitos previos
- Node.js 20 o superior.
- npm o yarn.
- Expo CLI.
- Android Studio o Xcode para emulación móvil (opcional).
- Una cuenta en Firebase y una clave de API de OpenAI.

### Instalación
```bash
npm install
cp .env.example .env
```

### Ejecución
```bash
npx expo start
```
Luego seleccionar la plataforma deseada desde la interfaz de Expo:
- Android
- iOS


### Variables de entorno
Crear un archivo .env con los valores correspondientes.

| Variable | Descripción | Obligatoria |
|---|---|---|
| EXPO_PUBLIC_OPENAI_API_KEY | Clave para consumir los modelos de OpenAI en chat, recomendaciones y OCR. | Sí |
| EXPO_PUBLIC_FIREBASE_API_KEY | API key de Firebase. | No |
| EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN | Dominio de autenticación de Firebase. | No |
| EXPO_PUBLIC_FIREBASE_PROJECT_ID | ID del proyecto Firebase. | No |
| EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET | Bucket de almacenamiento. | No |
| EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | Sender ID de Firebase Cloud Messaging. | No |
| EXPO_PUBLIC_FIREBASE_APP_ID | ID de la app Firebase. | No |

Archivo de ejemplo: [.env.example](.env.example)
---
## 11. Datos Utilizados
| Fuente de datos | Tipo de datos | Uso dentro del proyecto | Observaciones |
|---|---|---|---|
| Registros de usuario | Nombre, correo, sesión autenticada | Inicio de sesión, perfil y persistencia | Datos sensibles; deben protegerse mediante reglas de Firestore |
| Transacciones financieras | Ingresos, gastos, montos, categorías, fechas, descripciones | Estadísticas, análisis y recomendaciones | Requieren validación y normalización de categorías |
| Billeteras | Nombre, saldo y estado | Organización del dinero y cálculo del balance disponible | Deben mantenerse consistentes con las transacciones |
| Imágenes de recibos o documentos | Archivos de imagen y/o PDF | OCR para extracción automática de datos | La calidad depende del escaneo y del tipo de documento |
| Consultas del usuario al asistente IA | Texto libre | Generación de respuestas y recomendaciones financieras | Se recomienda filtrar y validar entradas para evitar uso indebido |

### Consideraciones
- Los datos son principalmente privados y relacionados con información financiera personal.
- Contienen información sensible, por lo que deben manejarse con cuidado.
- Se requiere limpieza y validación de categorías, fechas y montos.
- La calidad de los datos puede variar según la forma en que el usuario registre sus transacciones o suba documentos.
---
## 12. Riesgos Técnicos y Deuda Técnica
| Riesgo | Categoría | Probabilidad | Impacto | Mitigación propuesta |
|---|---|---|---|---|
| Exposición de credenciales y claves de servicio | Seguridad | Media | Alto | Mover todas las credenciales a variables de entorno y revisar reglas de acceso |
| Dependencia del modelo de IA para tareas sensibles | Modelo | Media | Medio | Implementar validaciones, prompts controlados y fallback cuando no haya datos suficientes |
| Calidad limitada del OCR en documentos poco claros | Datos / Modelo | Alta | Medio | Mejorar el pipeline de extracción, agregar reglas heurísticas y validación manual |
| Falta de pruebas automatizadas | Código | Alta | Medio | Incorporar pruebas unitarias e integración desde la siguiente iteración |
| Arquitectura aún fuertemente acoplada a servicios externos | Código | Media | Medio | Separar mejor capas y abstraer servicios para facilitar mantenimiento y mocks |
| Ausencia de despliegue y monitoreo operativo | Despliegue | Media | Medio | Definir canal de despliegue con Expo EAS y métricas básicas de uso y errores |
---
## 13. Plan de Mejora por Semana
| Semana | Mejora esperada | Evidencia esperada |
|---|---|---|
| Semana 2 | API inteligente y contratos de entrada/salida | Servicio de IA documentado y probado manualmente |
| Semana 3 | Pruebas y CI/CD | Tests automatizados y pipeline básico de validación |
| Semana 4 | Contenedor o despliegue | Configuración de despliegue con Expo EAS o entorno simulado |
| Semana 5 | Observabilidad y rendimiento | Logs, métricas básicas y evaluación de tiempos de respuesta |
| Semana 6 | Seguridad, documentación y defensa final | README final, arquitectura objetivo, demo y presentación |
---
## 14. Limitaciones Actuales
- El OCR funciona con un fallback y depende de la calidad de la imagen.
- El asistente financiero ofrece respuestas útiles, pero aún necesita más contexto del usuario para personalizar mejor sus recomendaciones.
- No existe todavía una capa de backend independiente; la lógica se concentra en servicios del cliente.
- Falta una estrategia completa de pruebas automatizadas y monitoreo.
- La exportación de reportes y notificaciones proactivas siguen siendo pendientes.
---
## 15. Evidencias
| Evidencia | Enlace o ubicación | Descripción |
|---|---|---|
| Arquitectura objetivo | [docs/arquitectura-objetivo.md](docs/arquitectura-objetivo.md) | Documento con la propuesta de arquitectura futura del proyecto |
| Servicio de IA financiera | [services/financialAssistantService.ts](services/financialAssistantService.ts) | Lógica del asistente financiero con OpenAI |
| OCR y extracción documental | [services/ocrService.ts](services/ocrService.ts) | Proceso de extracción de datos desde documentos e imágenes |
| Configuración de Firebase | [config/firebase.tsx](config/firebase.tsx) | Inicialización del backend y autenticación |
| Variables de entorno de ejemplo | [.env.example](.env.example) | Plantilla para configurar credenciales externas |
---
## 16. Créditos y Referencias
- Expo y Expo Router para la aplicación móvil.
- React Native y TypeScript para la interfaz y la lógica.
- Firebase Authentication y Firestore para autenticación y persistencia.
- OpenAI para inteligencia artificial generativa y OCR.
- react-native-gifted-charts, expo-image-picker y expo-document-picker para visualización y carga de documentos.
- Documentación oficial de Expo, Firebase y OpenAI.
---
## 17. Checklist de Revisión
Antes de entregar, verificar:
- [x] El problema está claramente descrito.
- [x] Se explica quién usará o se beneficiará de la aplicación.
- [x] Se identifica dónde está la IA.
- [x] Se describen entradas y salidas.
- [x] Se documenta el estado actual del proyecto.
- [x] Se incluye arquitectura actual.
- [x] Se incluye arquitectura objetivo.
- [x] Se explica cómo ejecutar el proyecto.
- [x] Se identifican riesgos técnicos.
- [x] Se presenta plan de mejora por semana.
- [x] No se incluyen claves, contraseñas ni tokens privados.
