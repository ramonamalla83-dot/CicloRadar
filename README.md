# CicloRadar

Aplicación multiplataforma Flutter para ciclistas. Android, iOS y Web comparten la implementación de `flutter_app/lib`.

## Estado actual

La app comienza con un registro local de tres pasos (teléfono, código de demostración y perfil ciclista), seguido del mapa. También incluye capas raster, ubicación GPS, corredores y ciclistas de ejemplo, modo sigilo, preferencias locales, contactos SOS configurables y una alarma local con cuenta regresiva.

**Es un prototipo, no un servicio de emergencia.** El registro no envía ni verifica SMS; el perfil solo se guarda en el dispositivo. La comunidad y las alertas también son simuladas: no hay backend, transmisión de ubicación ni envío de SMS a los contactos. La ubicación de respaldo es Madrid. El volumen final depende del dispositivo y del sistema operativo.

## Requisitos

- Flutter 3.16 o superior (Dart 3).
- Android Studio o VS Code con el SDK de Flutter para Android.
- Xcode y CocoaPods para compilar iOS.

## Desarrollo

```powershell
cd flutter_app
flutter pub get
flutter run
```

Para ejecutar en Chrome: `flutter run -d chrome`.

## Verificación y compilación

Desde `flutter_app`:

```powershell
flutter analyze
flutter test
flutter build web
```

Para Android, usa `flutter build apk --release`. Para iOS, compila desde macOS con Xcode.

## Estructura

- `flutter_app/lib/screens`: mapa, comunidad, contactos SOS, perfil y diálogo de emergencia.
- `flutter_app/lib/providers/app_state.dart`: estado compartido y preferencias persistidas localmente.
- `flutter_app/lib/services`: ubicación y alarma/vibración del dispositivo.
- `flutter_app/web`: entrada y metadatos de Flutter Web.

Consulta [AGENTS.md](./AGENTS.md) para convenciones y límites del prototipo.
