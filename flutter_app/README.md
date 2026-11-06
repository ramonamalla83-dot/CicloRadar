# CicloRadar Flutter

Implementación única de CicloRadar para Android, iOS y Web. El código de la app está en `lib/`; `web/` contiene la entrada y metadatos de Flutter Web.

## Requisitos

- Flutter 3.16 o superior (Dart 3).
- Android Studio o VS Code con el SDK Flutter para Android.
- macOS, Xcode y CocoaPods para compilar iOS.

## Desarrollo

Desde este directorio:

```powershell
flutter pub get
flutter run
```

Para navegador: `flutter run -d chrome`.

## Validación y compilación

```powershell
flutter analyze
flutter test
flutter build web
```

Android: `flutter build apk --release`. iOS: `flutter build ipa --release` desde macOS.

## Funcionalidad y límites

La app inicia con un registro local de tres pasos (teléfono, código de demostración y perfil ciclista) y continúa a Inicio, con un dashboard ilustrativo, y al mapa. Incluye mapas raster, GPS con ubicación de respaldo, datos de comunidad de ejemplo, privacidad local, perfil y contactos SOS guardados en el dispositivo. Las alarmas se sintetizan localmente; vibración y bloqueo de pantalla dependen de la plataforma.

**Prototipo solamente:** el código de registro no se envía por SMS ni se valida con un servicio; solo sirve para avanzar el flujo de demostración. La comunidad no se conecta a otros usuarios. El cliente FCM de alertas SOS requiere un proyecto Firebase y las Cloud Functions documentadas antes de poder enviar notificaciones remotas. No usar como sistema de emergencia real. El nivel de volumen también depende del dispositivo.
Las métricas, recorridos recientes y rutas de Inicio son datos de ejemplo; la app todavía no registra trayectos ni permite guardar rutas reales.

Consulta [FIREBASE_PUSH_SETUP.md](./FIREBASE_PUSH_SETUP.md) para configuración, privacidad y contrato del backend requerido para recibir alertas SOS en segundo plano.
