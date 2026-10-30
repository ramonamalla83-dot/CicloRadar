# AGENTS.md — Directrices para Asistentes de IA y Programación

Este documento contiene la arquitectura, convenciones técnicas, restricciones y directrices operativas para cualquier asistente de inteligencia artificial (Claude Code, Cursor, Windsurf, Copilot, Gemini CLI, etc.) o desarrollador que trabaje en el código fuente de **CicloRadar**.

---

## 1. Visión General del Proyecto

**CicloRadar** es una aplicación web responsiva (mobile-first) de seguridad y asistencia comunitaria para ciclistas urbanos y de ruta.

### Pilares Fundamentales
1. **Cartografía en Tiempo Real**: Mapas interactivos con modo diurno y nocturno, centrado GPS y marcadores de posición.
2. **Sistema SOS de Emergencia**: Alertas inmediatas sonoras y visuales con cuenta regresiva de 5 segundos contra pulsaciones accidentales.
3. **Red Comunitaria**: Visualización de ciclistas activos cercanos, estado de visibilidad y distancias.
4. **Privacidad y Modo Sigilo**: Posibilidad de apagar el rastreo en cualquier momento sin perder acceso a las herramientas del mapa.

---

## 2. Stack Tecnológico y Dependencias

- **Framework**: React 19 (`react`, `react-dom`) con hooks funcionales.
- **Lenguaje**: TypeScript 5.8+ (modo estricto).
- **Herramienta de Compilación**: Vite 6.
- **Estilos**: Tailwind CSS v4 (importado en `src/index.css` con `@import "tailwindcss";`).
- **Librería de Mapas**: `react-map-gl/maplibre` junto a `maplibre-gl`.
  - Proveedor de teselas: **CartoDB** raster tiles (`light_all` y `dark_all`).
- **Motor de Audio**: Web Audio API nativo sintetizado mediante `AudioContext` en `src/utils/audio.ts`.
- **Iconografía**: `lucide-react`.

---

## 3. Arquitectura y Flujo de Datos

### 3.1 Gestión de Estado Global y Navegación (`src/App.tsx`)
`App.tsx` actúa como el orquestador principal de pantallas y estados globales:
- **Flujo de Entrada Directo**: Al completar el registro en `Auth.tsx`, el usuario es redirigido directamente a `'map'` para comenzar a visualizar el radar de inmediato.
- **Barra de Navegación Inferior (Bottom Bar)**: Barra de navegación táctil fija en la parte inferior con acceso directo a `'map'`, `'community'`, `'sos'`, `'profile'` e `'home'`, con resaltado activo en naranja (`orange-500`) y punto indicador.
- **`currentScreen`**: Define la pantalla activa (`'auth' | 'home' | 'map' | 'community' | 'sos' | 'profile'`).
- **`user`**: Objeto `{ name: string, initials: string }` o `null`. Si es `null`, la app muestra la pantalla `Auth`.
- **`trackingEnabled`**: Booleano que controla si la ubicación del usuario se comparte con otros ciclistas en la comunidad.
- **`alarmSound`**: Tipo de sonido seleccionado para alertas (`'radar_ios' | 'good_morning_samsung' | 'bright_morning_pixel' | 'sirena' | 'alarma' | 'pitido'`). Por defecto: `'radar_ios'`.
- **`incomingSos`**: Objeto con los datos de emergencia de un ciclista cercano (`{ name, distance, lat, lng }`). Al estar activo, reproduce la alarma sonora a volumen máximo acústico y muestra un overlay prioritario a pantalla completa.

### 3.2 Estructura de Componentes (`src/components/`)
- `Auth.tsx`: Formulario de inicio con personalización de nombre de ciclista.
- `HomeMenu.tsx`: Pantalla de menú resumen con accesos directos por tarjetas y simulador de prueba.
- `Map.tsx`: Componente de mapa MapLibre:
  - Soporta múltiples capas ráster de alta precisión: **Calles (Día)** (OpenStreetMap por defecto), **Oscuro (Noche)** (Carto Dark), **Satélite** (Google `lyrs=s`) y **Relieve / Terreno** (Google `lyrs=p`).
  - **Modo día por defecto** (`activeLayer: 'streets'`).
  - Selector flotante de capas interactivo (`Layers`) con vista previa y distintivo activo.
  - **Botón de Mapa de Calor Mejorado**: Toggle táctil directo con badge de estado `ON`/`OFF`, indicador pulsante y notificaciones de confirmación.
  - Capa nativa `heatmap` de MapLibre con gradiente térmico (verde ➔ cian ➔ amarillo ➔ naranja ➔ rojo) y trazas de ciclovías (`LineString`).
  - Panel flotante de estadísticas de rutas comunitarias frecuentes, métricas en vivo y botón para centrar en corredores clave.
  - Botón flotante para recentrado GPS instantáneo (`LocateFixed`).
  - Botón flotante para gestión de instalación y permisos (`ShieldCheck`).
  - Botón flotante inferior para activar la secuencia SOS con temporizador y auto-emisión de alarma a volumen forzado.
- `PermissionsModal.tsx`: Centro interactivo de permisos del dispositivo (GPS de alta precisión, desbloqueo de audio a volumen máximo, notificaciones locales/push, Wake Lock de pantalla activa, vibración háptica) e instalación PWA para Android e iOS.
- `Community.tsx`: Directorio de ciclistas cercanos, con indicador de modo invisible si `trackingEnabled` es falso.
- `SosConfig.tsx`: Formulario de contactos de emergencia y mensaje personalizado.
- `ProfileSettings.tsx`: Selector de alarmas del sistema (Apple Radar, Samsung Good Morning, Google Pixel Bright Morning, Sirena, Alarma Industrial, Sonar), ficha técnica de la bicicleta, fotos, interruptor de radar/sigilo y cierre de sesión.

### 3.3 Utilidades y Datos (`src/utils/` y `src/hooks/`)
- `audio.ts`: Implementa la clase `AudioEngine` con síntesis matemática pura de Web Audio API:
  - **Radar (Apple iOS)**: Patrón rítmico percusivo de marimba en doble tono agudo característico de iPhone.
  - **Good Morning (Samsung Galaxy)**: Arpegio de campana brillante ascendente en Do Mayor de dispositivos Galaxy.
  - **Bright Morning (Google Pixel)**: Kalimba y vibráfono pentatónico cálido característico de Pixel/Android Puro.
  - **Maximizador Acústico de Volumen (Auto-Boost)**: Cadena con `DynamicsCompressorNode` (-24dB threshold, 14:1 ratio) y `GainNode` (+240%) para proyectar el volumen al nivel más alto posible superando niveles bajos de parlantes móviles.
  - **Integración de Sistema**: Bloqueo de suspensión de pantalla (`navigator.wakeLock`), vibración háptica cíclica (`navigator.vibrate`) y `navigator.mediaSession` para audio focus prioritario.
- `useAppPermissions.ts`: Hook reactivo para estado y solicitud unificada de GPS, AudioContext, Notificaciones, Wake Lock y PWA.
- `audio.ts`: Implementa la clase `AudioEngine` que encapsula `window.AudioContext`.
- `heatmapData.ts`: Genera y simula en tiempo real la telemetría comunitaria de rutas ciclistas, puntos de densidad térmica por segmentos y corredores (`LineString`).
- **No depende de archivos MP3/WAV externos**: Todos los tonos se sintetizan con osciladores senoidales, cuadrados o triangulares con modulación de frecuencia y rampa de ganancia exponencial.
- Siempre maneja la reactivación del contexto suspendido por políticas de autoplay de navegadores (`if (this.ctx.state === 'suspended') this.ctx.resume()`).

---

## 4. Reglas Críticas para Asistentes de IA (Do's and Don'ts)

### ❌ Lo que NUNCA debes hacer (Anti-Patrones):
1. **NO usar archivos de audio externos (URL o locales)**:
   - Nunca intentes descargar o enlazar archivos `.mp3` o `.wav` remotos que puedan fallar por CORS, 404 o conexión lenta. Usa siempre `audioEngine` en `src/utils/audio.ts`.
2. **NO cambiar el proveedor de mapas a Google Maps o Mapbox sin que el usuario lo solicite explícitamente**:
   - `MapLibre GL` con teselas CartoDB funciona sin token ni tarjeta de crédito. No agregues librerías pesadas que requieran API Keys de pago obligatorias a menos que sea un requisito directo del usuario.
3. **NO usar `window.alert()` ni `window.confirm()`**:
   - Los diálogos nativos bloquean la UI y fallan en iframes o navegadores móviles embebidos. Utiliza modales, banners o overlays de Tailwind.
4. **NO romper el tema visual oscuro (`zinc-950` / `zinc-900`)**:
   - La interfaz base de la aplicación está construida sobre una paleta oscura moderna con acentos en naranja (`orange-500`) y rojo para emergencias (`red-500` / `red-600`). Mantén consistencia visual en nuevos componentes.
5. **NO eliminar el modo día por defecto en el mapa**:
   - El mapa debe iniciar en modo día (`lightMapStyle`) y permitir alternar a modo noche con el botón interactivo.

### ✅ Lo que SIEMPRE debes cumplir (Mejores Prácticas):
1. **Tipado Estricto de TypeScript**:
   - Declara tipos explícitos para todas las props, callbacks y estados.
   - Evita el uso de `any` excepto en configuraciones específicas de estilos de mapas de terceros donde la librería lo requiera.
2. **Diseño Mobile-First Responsivo**:
   - Los ciclistas usan la app en soportes de manillar o teléfonos móviles. Asegura botones con tamaño táctil adecuado (mínimo `44x44px` o `h-11`/`h-12`), fuentes legibles y alto contraste.
3. **Manejo Seguro de Geolocalización**:
   - Siempre verifica si `'geolocation' in navigator` y provee coordenadas de fallback predeterminadas en caso de denegación de permisos o error de hardware.
4. **Respetar la Privacidad del Usuario**:
   - Cuando `trackingEnabled` sea `false`, el avatar debe mostrarse con icono de ojo tachado (`EyeOff`) o indicador de modo sigilo, sin publicar coordenadas a la red comunitaria simulada.

---

## 5. Comandos de Verificación y Pruebas

Antes de dar por concluida cualquier modificación en el código, el asistente debe ejecutar o comprobar:

```bash
# 1. Comprobación estricta de tipos TypeScript (sin emitir archivos)
npm run lint

# 2. Compilación completa para producción con Vite
npm run build
```

Si surge algún error de compilación o tipado, arréglalo inmediatamente antes de responder al usuario.

---

## 6. Ideas para Futuras Extensiones (Backlog Técnico)
- **Persistencia Local**: Guardar contactos SOS y configuración de audio en `localStorage` o base de datos.
- **Rutas GPX / KML**: Soporte para cargar y visualizar rutas ciclistas en formato GPX sobre la capa de MapLibre.
- **Geocoding Inverso**: Mostrar nombre de calle o intersección actual en la tarjeta SOS.
- **Vibración Háptica**: Integrar `navigator.vibrate([500, 200, 500])` para complementar la sirena sonora cuando el hardware lo soporte.
