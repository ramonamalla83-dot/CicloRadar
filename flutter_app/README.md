# 🚲 CicloRadar — Aplicación Móvil en Flutter

Este directorio (`/flutter_app`) contiene la versión nativa completa multiplataforma de **CicloRadar** desarrollada con el SDK de **Flutter** (Android, iOS y Web).

---

## 📱 Características Nativas Integradas

1. **Cartografía Multi-Capa con `flutter_map`**:
   - **Calles (Día)**: OpenStreetMap por defecto para máxima legibilidad bajo la luz del sol.
   - **Oscuro (Noche)**: CartoDB Dark para conducción nocturna y ahorro de batería OLED.
   - **Satélite**: Cobertura aérea de Google (`lyrs=s`).
   - **Relieve / Terreno**: Curvas de elevación y topografía para ciclistas de ruta (`lyrs=p`).
2. **Mapa de Calor y Corredores Seguros**:
   - Visualización de trazas de ciclovías y corredores con gradientes térmicos (verde esmeralda, cian y ámbar) según flujo de ciclistas.
3. **Sistema SOS con Auto-Boost Acústico de Volumen**:
   - Cuenta regresiva visual de 5 segundos contra toques accidentales.
   - Forzado de volumen al 100% con `audioplayers` para emergencias.
   - Tonos de sistema disponibles:
     - **Radar (Apple iOS)**
     - **Good Morning (Samsung Galaxy OneUI)**
     - **Bright Morning (Google Pixel / Android Puro)**
     - **Sirena Policial y Alarma Industrial**
4. **Hardware del Dispositivo**:
   - **WakeLock (`wakelock_plus`)**: Mantiene la pantalla encendida mientras el teléfono está montado en el soporte del manillar de la bicicleta.
   - **Vibración Háptica (`vibration`)**: Patrones rítmicos de advertencia durante una alerta activa.
   - **GPS en Tiempo Real (`geolocator`)**: Alta precisión cada 5 metros con manejo automático de permisos.
5. **Modo Sigilo e Incógnito**:
   - Conmutador para ocultar la posición en el radar comunitario en cualquier momento.

---

## 🛠️ Requisitos Previos

- **Flutter SDK**: Versión `3.16.0` o superior (Dart SDK `3.0.0`+).
- **Android Studio** o **VS Code** con la extensión de Flutter instalada.
- Para iOS: **Xcode** y **CocoaPods** instalados en macOS.

---

## 🚀 Cómo Ejecutar la Aplicación

### 1. Entrar al directorio del proyecto Flutter
```bash
cd flutter_app
```

### 2. Descargar e instalar las dependencias
```bash
flutter pub get
```

### 3. Ejecutar en un dispositivo o emulador

#### Android:
```bash
flutter run -d emulator
```
En VS Code también se puede iniciar desde **Run Android Emulator**; primero debe estar iniciado el AVD `CicloRadar_Pixel`.

#### iOS:
```bash
cd ios
pod install
cd ..
flutter run -d ios
```

#### Chrome / Web:
```bash
flutter run -d chrome
```

---

## 📦 Compilación para Distribución

### Compilar APK para Android:
```bash
flutter build apk --release
```
El archivo se generará en `build/app/outputs/flutter-apk/app-release.apk`.

### Compilar Android App Bundle (AAB para Google Play Store):
```bash
flutter build appbundle --release
```

### Compilar para iOS (App Store):
```bash
flutter build ipa --release
```

---

## 📂 Estructura del Código Fuente

```
flutter_app/
├── android/
│   └── app/src/main/AndroidManifest.xml    # Permisos de GPS, audio, vibración y wakelock
├── ios/
│   └── Runner/Info.plist                   # Configuraciones de ubicación y background audio
├── lib/
│   ├── main.dart                           # Entrada principal y tema oscuro (#09090B)
│   ├── models/
│   │   ├── alarm_preset.dart               # Presets de audio (Radar iOS, Galaxy, Pixel)
│   │   ├── cyclist.dart                    # Modelo de ciclistas, telemetría y corredores
│   │   └── map_layer.dart                  # Capas ráster (Streets, Dark, Sat, Relieve)
│   ├── providers/
│   │   └── app_state.dart                  # Estado global (GPS, SOS, capas, sigilo)
│   ├── screens/
│   │   ├── community_screen.dart           # Directorio de ciclistas y test de sirena
│   │   ├── main_shell.dart                 # Barra de navegación inferior
│   │   ├── map_screen.dart                 # Mapa flutter_map, FABs y capas
│   │   ├── profile_screen.dart             # Selector de alarmas, contacto SOS y bici
│   │   └── sos_dialog.dart                 # Cuenta regresiva de 5s y alerta activa
│   └── services/
│       ├── audio_alarm_service.dart        # Motor de audio con boost, wakelock y vibración
│       └── location_service.dart           # Servicio GPS con geolocator
├── pubspec.yaml                            # Dependencias Flutter
└── README.md
```
