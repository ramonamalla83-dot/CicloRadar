# CicloRadar: guía para asistentes y desarrolladores

## Aplicación y arquitectura

CicloRadar se mantiene como una sola aplicación Flutter en `flutter_app/`, compilable para Android, iOS y Web. No reintroducir una aplicación React/Vite paralela.

- `flutter_app/lib/main.dart`: tema, raíz de la app y proveedores.
- `flutter_app/lib/providers/app_state.dart`: estado global, GPS, privacidad, mapa, perfil, preferencias y flujo SOS.
- `flutter_app/lib/screens/`: mapa, comunidad, contactos SOS, perfil y diálogo de emergencia.
- `flutter_app/lib/services/`: ubicación y alarma/vibración del dispositivo.
- `flutter_app/web/`: configuración de la compilación web de Flutter.

La app usa Flutter/Dart, `provider`, `flutter_map`, `geolocator`, `audioplayers`, `shared_preferences`, `vibration` y `wakelock_plus`. Respeta los patrones existentes antes de añadir dependencias.

## Reglas de producto

- Mantener el tema oscuro zinc (`#09090B`, `#18181B`) con acento naranja (`#F97316`) y diseño adaptable a móvil.
- Mantener Calles/Día como capa inicial del mapa y no introducir proveedores de mapas de pago ni claves obligatorias.
- No añadir archivos ni URLs de audio externos. Generar los tonos localmente; el volumen físico sigue bajo el control del dispositivo.
- Solicitar permisos de ubicación de forma explícita y conservar una ubicación de respaldo si GPS o permisos no están disponibles.
- El modo sigilo debe indicar claramente que la ubicación no se comparte.
- No usar diálogos bloqueantes del sistema (`alert`/`confirm`); preferir componentes Flutter.
- No presentar datos simulados como ciclistas conectados ni el SOS local como una alerta transmitida. La app aún no tiene backend ni envío de SMS.
- Tipar código Dart y manejar errores de permisos y plugins de forma explícita.

## Validación

Desde `flutter_app/`, ejecutar:

```powershell
flutter analyze
flutter test
flutter build web
```

Ejecutar también la plataforma afectada cuando se modifiquen permisos o plugins nativos. Si falta el SDK o hardware necesario, indicarlo claramente y no afirmar que se validó.

## Cambios y Git

- Leer el estado de Git antes de editar. El árbol de trabajo puede contener cambios del usuario; conservarlos y no incorporarlos a los cambios propios.
- Hacer cambios quirúrgicos y actualizar la documentación relacionada.
- No reescribir historial ni forzar pushes. No confirmar ni publicar archivos generados, secretos o cambios ajenos.
