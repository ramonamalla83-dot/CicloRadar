# 🚴‍♂️ CicloRadar

> **Seguridad y comunidad en tiempo real para ciclistas.**  
> Aplicación web progresiva diseñada para rodadas urbanas y de ruta con mapas interactivos, alertas de emergencia SOS sonoras y visuales, radar de proximidad y modo día/noche.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-5.24-388E3C)](https://maplibre.org/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

## 🌟 Características Principales

### 🗺️ Mapa Interactivo y Navegación Principal
- **Acceso Inmediato tras Registro**: Al ingresar el nombre del ciclista, la aplicación abre directamente la pantalla de Mapa para comenzar a rodar al instante.
- **Barra de Navegación Inferior (Bottom Bar)**: Barra de navegación táctil fija en la parte inferior para alternar de manera fluida y rápida entre:
  - **Mapa**: Radar GPS, mapa de calor y botón de emergencia SOS.
  - **Comunidad**: Ciclistas activos cercanos y modo sigilo.
  - **SOS**: Contactos de emergencia y protocolo de auxilio.
  - **Perfil**: Ficha técnica de la bicicleta, fotos y personalización de alarmas.
  - **Inicio**: Panel de tarjetas y simulación de alertas de prueba.
- **Selector Multicapa de Alta Precisión**:
  - **🛰️ Satélite**: Vista orbital fotográfica de alta resolución con teselas de Google (`https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}`).
  - **⛰️ Relieve / Terreno**: Vista topográfica detallada con curvas de nivel, pendientes y sombreado de montaña de Google (`https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}`), ideal para ciclismo de ruta y MTB.
  - **☀️ Calles (Día)**: Modo diurno claro por defecto con OpenStreetMap.
  - **🌙 Oscuro (Noche)**: Modo nocturno de alto contraste con Carto Dark.
- **Botón y Función Mejorada de Mapa de Calor (Heatmap)**: Botón táctil con indicador de estado `ON`/`OFF`, efecto pulsante de actividad, notificaciones visuales en tiempo real y panel de corredores y estadísticas frecuentes.
- **Geolocalización Automática y Botón de Recentrado**: Centrado automático según la ubicación GPS del ciclista y botón de recentrado rápido en el manillar.
- **Modo Sigilo / Radar**: Activa o desactiva la visibilidad en el radar comunitario en cualquier momento para proteger tu privacidad.
- **Controles Táctiles y Navegación**: Zoom fluido, orientación y controles adaptados tanto para móviles como computadoras.

### 🚨 Sistema de Emergencia SOS con Tonos de Sistema y Auto-Boost
- **Activación Rápida con Cuenta Regresiva**: Botón de auxilio con cuenta atrás de seguridad de 5 segundos para evitar falsas alarmas accidentales.
- **Tonos de Alarma por Defecto del Sistema**:
  - 🍎 **Radar (Apple / iOS / iPhone)**: Golpes rítmicos percusivos de marimba en doble tono agudo característico de iPhone.
  - 📱 **Good Morning (Samsung Galaxy)**: Arpegio de campana brillante ascendente en Do Mayor de dispositivos Galaxy.
  - 🤖 **Bright Morning (Google Pixel / Android Puro)**: Kalimba y vibráfono pentatónico cálido con armónicos envolventes.
  - 🚨 **Sirena Táctica**: Barrido oscilante penetrante de alta frecuencia para exteriores y tráfico ruidoso.
  - 📢 **Alarma Industrial**: Bocina continua con pulsos de onda cuadrada.
  - ⏱️ **Sonar de Alta Frecuencia**: Pitidos intermitentes a 1760 Hz.
- **Aumento Automático de Volumen Acústico (Auto-Boost +240%)**: Si el volumen del celular está bajo, una cadena de `DynamicsCompressorNode` (-24dB, 14:1) junto a un booster de ganancia elevan al máximo la presión sonora de los parlantes del móvil.
- **Integración con Sistema Operativo Móvil**: Bloqueo de suspensión de pantalla (`navigator.wakeLock`) para que el teléfono no se apague en el manillar, vibración háptica de emergencia (`navigator.vibrate`) y prioridad de audio con `MediaSession`.
- **Notificación a la Comunidad**: Avisos flotantes instantáneos para ciclistas cercanos indicando distancia en kilómetros y coordenadas.
- **Botón de Respuesta "Ir a Ayudar"**: Navegación directa hacia el ciclista que emitió el pedido de auxilio.

### 📲 Centro de Permisos e Instalación (PWA)
- **Gestor Unificado de Permisos**: Verificación y solicitud interactiva con 1 clic de GPS de alta precisión, Audio a volumen máximo, Notificaciones SOS y Wake Lock de pantalla.
- **Instalación PWA Lista para Manillar**: Instalación con 1 clic en Android/Chrome (`beforeinstallprompt`) y guía paso a paso ilustrada para Safari en iPhone/iOS ("Compartir" ➔ "Añadir a pantalla de inicio").

### 👥 Comunidad y Seguridad
- **Lista de Ciclistas Cercanos**: Estado de actividad, distancias calculadas y disponibilidad para rodar.
- **Simulador de Emergencias**: Herramienta de pruebas integrada para verificar cómo reacciona la aplicación ante un aviso de socorro entrante.
- **Configuración de Contactos de Emergencia**: Gestión de números de teléfono para alertas por SMS o WhatsApp.

### ⚙️ Personalización y Ficha Técnica
- **Selector de Tono de Alarma del Sistema**: Previsualización interactiva con botón de prueba en Perfil para escuchar el auto-boost antes de salir a la ruta.
- **Ficha de Bicicleta y Fotos**: Carga fotos del ciclista y de la bicicleta, marca, modelo y modalidad (MTB, Ruta, Urbana, Gravel).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend UI** | [React 19](https://react.dev/) | Arquitectura basada en componentes funcionales modernos y hooks reactivos. |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) | Tipado estático estricto para alta confiabilidad y mantenibilidad. |
| **Estilos** | [Tailwind CSS v4](https://tailwindcss.com/) | Diseño responsivo estilizado con temática dark minimalista (`zinc-950`). |
| **Cartografía** | [MapLibre GL](https://maplibre.org/) & `react-map-gl` | Renderizado rápido de mapas vectoriales/raster sin necesidad de claves API de pago. |
| **Motor de Audio** | [Web Audio API](https://developer.mozilla.org/es/docs/Web/API/Web_Audio_API) | Síntesis nativa de frecuencias (`AudioContext`, osciladores senoidales, cuadrados y triangulares). |
| **Iconos** | [Lucide React](https://lucide.dev/) | Iconografía nítida y consistente para interfaz móvil y de escritorio. |
| **Build Tool** | [Vite 6](https://vitejs.dev/) | Compilador ultra-rápido y servidor de desarrollo optimizado. |

---

## 📁 Estructura del Proyecto

```text
├── src/
│   ├── components/
│   │   ├── Auth.tsx             # Pantalla de acceso e ingreso de nombre de ciclista
│   │   ├── Community.tsx        # Lista de ciclistas activos en la comunidad y radar
│   │   ├── HomeMenu.tsx         # Menú principal con accesos rápidos a las funciones
│   │   ├── Map.tsx              # Mapa MapLibre interactivo con alternancia Día/Noche y botón SOS
│   │   ├── ProfileSettings.tsx  # Preferencias de visibilidad, sonido de alarma y cuenta
│   │   └── SosConfig.tsx        # Configuración de contactos de auxilio y mensajes automáticos
│   ├── utils/
│   │   └── audio.ts             # Motor de sintetizador de audio nativo (Web Audio API)
│   ├── App.tsx                  # Enrutador principal, gestión de estado y overlay de SOS entrante
│   ├── index.css                # Estilos globales y directivas de Tailwind CSS
│   └── main.tsx                 # Entrada principal de React DOM
├── index.html                   # Documento HTML base con meta tags SEO y título
├── metadata.json                # Configuración de capacidades y permisos de la aplicación
├── package.json                 # Dependencias y scripts del proyecto
├── tsconfig.json                # Configuración de TypeScript
└── AGENTS.md                    # Instrucciones y directrices para asistentes de IA y programadores
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 o **bun** / **yarn** / **pnpm**

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/cicloradar.git
   cd cicloradar
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre tu navegador en `http://localhost:3000`.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

5. **Verificar tipos y código:**
   ```bash
   npm run lint
   ```

---

## 🛡️ Permisos Requeridos

Para que la aplicación funcione a su máximo potencial, es necesario otorgar el siguiente permiso en el navegador:
- **Geolocalización (`geolocation`)**: Se utiliza exclusivamente para situar el marcador de tu bicicleta en el mapa y calcular distancias respecto a incidentes reportados. Si el usuario no otorga el permiso, la app cuenta con coordenadas de fallback seguras.

---

## 🤝 Asistentes de IA y Colaboración

Si utilizas asistentes de código basados en IA (Claude Code, GitHub Copilot, Cursor, Windsurf o modelos de Google AI Studio), consulta el archivo [`AGENTS.md`](./AGENTS.md) para conocer las pautas de arquitectura, reglas de diseño, directrices de audio sintético y convenciones de código obligatorias.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **Apache-2.0**. Consulta el archivo `LICENSE` para más detalles.
