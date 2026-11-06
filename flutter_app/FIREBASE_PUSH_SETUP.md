# Configuración de alertas SOS push

La app ya tiene el cliente Flutter FCM, la recepción en segundo plano para Web y el contrato que debe implementar el backend. **Las alertas remotas no estarán activas hasta completar la configuración Firebase y desplegar las Cloud Functions indicadas abajo.** El SOS local sigue funcionando si Firebase no está disponible.

## Alcance y privacidad acordados

- Al activar un SOS, el dispositivo comparte sus coordenadas GPS con el backend solo para ese evento.
- Quienes activan «Recibir alertas SOS cercanas» comparten su posición verificada mientras usan la app y tienen activada esa opción.
- El backend debe notificar al emisor y a los usuarios suscritos cuya última posición activa esté a no más de 10 km. No debe usar la ubicación de respaldo de Madrid.
- La presencia del receptor debe caducar en el servidor (máximo 2 minutos); la app la borra al salir de primer plano y la renueva mientras está activa.
- No guardar recorridos históricos ni exponer tokens FCM a otros usuarios.

## Firebase y compilación Flutter

1. Crea un proyecto Firebase y registra aplicaciones para los IDs de aplicación Android e iOS configurados en sus proyectos y para Web.
2. Activa **Anonymous** en Authentication, Cloud Messaging y Cloud Functions. Configura APNs para iOS y una clave pública VAPID para Web.
3. Crea `flutter_app/firebase_options.json` (ignorado por Git) con los valores públicos de Firebase:

   ```json
   {
     "FIREBASE_ANDROID_API_KEY": "…",
     "FIREBASE_IOS_API_KEY": "…",
     "FIREBASE_WEB_API_KEY": "…",
     "FIREBASE_PROJECT_ID": "…",
     "FIREBASE_MESSAGING_SENDER_ID": "…",
     "FIREBASE_ANDROID_APP_ID": "…",
     "FIREBASE_IOS_APP_ID": "…",
     "FIREBASE_IOS_BUNDLE_ID": "…",
     "FIREBASE_WEB_APP_ID": "…",
     "FIREBASE_WEB_AUTH_DOMAIN": "…",
     "FIREBASE_WEB_VAPID_KEY": "…",
     "FIREBASE_WEB_APPCHECK_SITE_KEY": "…",
     "FIREBASE_FUNCTIONS_REGION": "us-central1"
   }
   ```

4. Copia el objeto de configuración Web de Firebase a `web/firebase-config.js` (mismos valores de Web que `FIREBASE_WEB_APP_ID`). La app usa App Check: en desarrollo registra el debug token que aparece en consola en Firebase; en producción configura reCAPTCHA v3 para Web, Play Integrity para Android y DeviceCheck para iOS. Esta configuración y las claves de cliente son públicas; nunca incluyas credenciales de cuenta de servicio en la app.
5. Compila desde `flutter_app` con `flutter build web --dart-define-from-file=firebase_options.json`. Para Android/iOS, añade el mismo argumento a `flutter run` o a la compilación correspondiente. iOS también requiere la capacidad Push Notifications/APNs y perfil de aprovisionamiento configurado en Xcode.
6. Despliega el backend y autoriza el dominio Web en Firebase Authentication. Revisa el plan de facturación y cuotas de Cloud Functions antes de publicar. Web Push requiere HTTPS y un navegador compatible (localhost sirve para desarrollo); en iOS Web el soporte depende de la versión y de instalar la PWA.

## Contrato de Cloud Functions callable

Todas las funciones deben requerir Firebase Authentication, validar entradas y aplicar Firebase App Check y límites de frecuencia antes de producción. La app usa la región definida por `FIREBASE_FUNCTIONS_REGION` y envía coordenadas como números; Firebase autentica el `uid`, no debe aceptarlo desde el payload. Para que el emisor reciba la copia push en su propio teléfono, debe permitir notificaciones y activar el interruptor de alertas en Perfil.

| Función | Entrada | Comportamiento requerido |
|---|---|---|
| `registerPushDevice` | `{token}` | Asociar el token FCM al usuario autenticado; validar tamaño/formato, evitar duplicados y permitir reemplazar tokens. |
| `setSosAlertPreferences` | `{enabled}` | Guardar consentimiento de recepción; solo `true` habilita a ser destinatario. |
| `updateSosPresence` | `{latitude, longitude}` | Solo con alertas habilitadas; validar coordenadas, guardar posición/geohash y `lastSeenAt` de servidor. Escribir solo en presencia efímera. |
| `clearSosPresence` | `{}` | Borrar inmediatamente la presencia del usuario autenticado. Configurar también TTL del lado servidor (máximo 2 min). |
| `activateSos` | `{riderName, latitude, longitude}` | Crear SOS activo ligado al emisor autenticado; limitar abuso; encontrar receptores con presencia reciente dentro de 10 km mediante consulta geohash y distancia exacta; enviar FCM al emisor y a suscriptores cercanos; devolver `{sosId}`. |
| `resolveSos` | `{sosId}` | Cerrar el SOS solo si pertenece al usuario autenticado y limpiar su ubicación de emergencia. |

El mensaje FCM debe incluir un payload `notification` para que Android/iOS/Web puedan mostrarlo con la app suspendida y estos campos string en `data`:

```json
{
  "type": "sos_active",
  "sosId": "id-generado-en-servidor",
  "senderId": "uid-del-emisor",
  "riderName": "Nombre del ciclista",
  "latitude": "-34.60",
  "longitude": "-58.38"
}
```

En Android usa prioridad alta y el canal de alta prioridad `sos_alerts`; en APNs solicita sonido/alerta (sujeto a los ajustes de iOS); en Web configura `webpush.fcmOptions.link` al URL HTTPS de la app. FCM Admin se ejecuta únicamente en Cloud Functions; nunca incrustes una clave privada en Flutter.

Hasta que existan el proyecto, los valores de compilación y esas funciones, el interruptor de alertas permanecerá deshabilitado y el SOS indicará explícitamente que solo se activó la alarma local.
