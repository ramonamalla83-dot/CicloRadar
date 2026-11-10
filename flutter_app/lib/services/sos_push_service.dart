import 'dart:async';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import 'firebase_config.dart';

class SosPushException implements Exception {
  const SosPushException(this.message);

  final String message;

  @override
  String toString() => message;
}

class SosActivationResult {
  const SosActivationResult({
    required this.sosId,
    required this.groupNotifiedCount,
    required this.groupSkippedCount,
  });

  final String sosId;
  final int groupNotifiedCount;
  final int groupSkippedCount;
}

class SosPushService {
  FirebaseMessaging? _messaging;
  FirebaseFunctions? _functions;
  StreamSubscription<RemoteMessage>? _foregroundSubscription;
  StreamSubscription<RemoteMessage>? _openedSubscription;
  StreamSubscription<String>? _tokenSubscription;
  void Function(String)? _onError;

  bool get isConfigured => FirebaseConfig.isConfigured;
  bool get isInitialized => _messaging != null;
  bool get isFirebaseInitialized =>
      Firebase.apps.isNotEmpty && FirebaseAuth.instance.currentUser != null;
  String? get currentUserId => FirebaseAuth.instance.currentUser?.uid;

  Future<void> initialize({
    required void Function(RemoteMessage) onIncomingSos,
    required void Function(String) onError,
  }) async {
    if (!FirebaseConfig.isCoreConfigured) return;
    _onError = onError;

    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(options: FirebaseConfig.currentPlatform);
      }

      if (kDebugMode ||
          !kIsWeb ||
          FirebaseConfig.webAppCheckSiteKey.isNotEmpty) {
        await FirebaseAppCheck.instance.activate(
          providerWeb: kIsWeb
              ? (kDebugMode
                  ? WebDebugProvider()
                  : ReCaptchaV3Provider(FirebaseConfig.webAppCheckSiteKey))
              : null,
          providerAndroid: kDebugMode
              ? const AndroidDebugProvider()
              : const AndroidPlayIntegrityProvider(),
          providerApple: kDebugMode
              ? const AppleDebugProvider()
              : const AppleDeviceCheckProvider(),
        );
      }

      final auth = FirebaseAuth.instance;
      if (auth.currentUser == null) {
        await auth.signInAnonymously();
      }

      if (!isConfigured) return;

      _functions = FirebaseFunctions.instanceFor(
        region: FirebaseConfig.functionsRegion,
      );
      _messaging = FirebaseMessaging.instance;
      await _messaging!.setForegroundNotificationPresentationOptions(
        alert: false,
        badge: false,
        sound: false,
      );

      _foregroundSubscription = FirebaseMessaging.onMessage.listen((message) {
        if (message.data['type'] == 'sos_active') onIncomingSos(message);
      }, onError: (Object error) {
        onError('Error al recibir una notificación push: $error');
      });
      _openedSubscription =
          FirebaseMessaging.onMessageOpenedApp.listen((message) {
        if (message.data['type'] == 'sos_active') onIncomingSos(message);
      }, onError: (Object error) {
        onError('Error al abrir una notificación push: $error');
      });
      final initialMessage = await _messaging!.getInitialMessage();
      if (initialMessage?.data['type'] == 'sos_active') {
        onIncomingSos(initialMessage!);
      }

      // Keep the backend token current after FCM rotates it.
      // ignore: deprecated_member_use
      _tokenSubscription = _messaging!.onTokenRefresh.listen((token) {
        unawaited(_registerRotatedToken(token));
      }, onError: (Object error) {
        onError('No se pudo renovar el registro de notificaciones: $error');
      });
    } on FirebaseException catch (error) {
      throw SosPushException(
        'No se pudo inicializar Firebase (${error.code}): ${error.message ?? 'error desconocido'}.',
      );
    }
  }

  Future<void> _registerRotatedToken(String token) async {
    try {
      await _registerToken(token);
    } on SosPushException catch (error) {
      _onError?.call(error.message);
    }
  }

  Future<bool> enableSosAlerts() async {
    final messaging = _requireMessaging();
    try {
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      final authorized =
          settings.authorizationStatus == AuthorizationStatus.authorized ||
              settings.authorizationStatus == AuthorizationStatus.provisional;
      if (!authorized) return false;

      final token = await _getToken(messaging);
      if (token == null || token.isEmpty) {
        throw const SosPushException(
          'Firebase no pudo registrar este dispositivo para notificaciones.',
        );
      }
      await _registerToken(token);
      await _call('setSosAlertPreferences', {'enabled': true});
      return true;
    } on FirebaseFunctionsException catch (error) {
      throw _functionsError(error);
    } on FirebaseException catch (error) {
      throw SosPushException(
        'No se pudieron activar las notificaciones (${error.code}): ${error.message ?? 'error desconocido'}.',
      );
    }
  }

  Future<void> disableSosAlerts() async {
    try {
      await _call('setSosAlertPreferences', {'enabled': false});
      await clearSosPresence();
    } on FirebaseFunctionsException catch (error) {
      throw _functionsError(error);
    }
  }

  Future<void> updateSosPresence({
    required double latitude,
    required double longitude,
  }) async {
    try {
      await _call('updateSosPresence', {
        'latitude': latitude,
        'longitude': longitude,
      });
    } on FirebaseFunctionsException catch (error) {
      throw _functionsError(error);
    }
  }

  Future<void> clearSosPresence() async {
    try {
      await _call('clearSosPresence', const {});
    } on FirebaseFunctionsException catch (error) {
      throw _functionsError(error);
    }
  }

  Future<SosActivationResult> activateSos({
    required String riderName,
    required double latitude,
    required double longitude,
    required List<String> recipientPhones,
  }) async {
    try {
      final result = await _call('activateSos', {
        'riderName': riderName,
        'latitude': latitude,
        'longitude': longitude,
        'recipientPhones': recipientPhones,
      });
      final data = result.data;
      if (data is! Map ||
          data['sosId'] is! String ||
          (data['sosId'] as String).isEmpty ||
          data['groupNotifiedCount'] is! int ||
          data['groupSkippedCount'] is! int ||
          (data['groupNotifiedCount'] as int) < 0 ||
          (data['groupSkippedCount'] as int) < 0) {
        throw const SosPushException(
          'El backend respondió sin un resumen válido del SOS grupal.',
        );
      }
      return SosActivationResult(
        sosId: data['sosId'] as String,
        groupNotifiedCount: data['groupNotifiedCount'] as int,
        groupSkippedCount: data['groupSkippedCount'] as int,
      );
    } on FirebaseFunctionsException catch (error) {
      throw _functionsError(error);
    }
  }

  Future<void> resolveSos(String sosId) async {
    try {
      await _call('resolveSos', {'sosId': sosId});
    } on FirebaseFunctionsException catch (error) {
      throw _functionsError(error);
    }
  }

  Future<void> _registerToken(String token) async {
    try {
      await _call('registerPushDevice', {'token': token});
    } on FirebaseFunctionsException catch (error) {
      throw _functionsError(error);
    }
  }

  Future<String?> _getToken(FirebaseMessaging messaging) async {
    try {
      // The backend needs the FCM registration token for Admin SDK delivery.
      // ignore: deprecated_member_use
      return await messaging.getToken(
        vapidKey: kIsWeb ? FirebaseConfig.webVapidKey : null,
        serviceWorkerScriptPath: kIsWeb ? 'firebase-messaging-sw.js' : null,
      );
    } on FirebaseException catch (error) {
      throw SosPushException(
        'No se pudo obtener el token FCM (${error.code}): ${error.message ?? 'error desconocido'}.',
      );
    }
  }

  Future<HttpsCallableResult<Object?>> _call(
    String name,
    Map<String, Object?> data,
  ) async {
    final functions = _functions;
    if (functions == null) {
      throw const SosPushException('Firebase Functions no está configurado.');
    }
    return functions.httpsCallable(name).call<Object?>(data);
  }

  FirebaseMessaging _requireMessaging() {
    final messaging = _messaging;
    if (messaging == null) {
      throw const SosPushException(
        'Las notificaciones SOS no están configuradas para esta plataforma.',
      );
    }
    return messaging;
  }

  SosPushException _functionsError(FirebaseFunctionsException error) {
    return SosPushException(
      'El servicio SOS respondió (${error.code}): ${error.message ?? 'error desconocido'}.',
    );
  }

  Future<void> dispose() async {
    await _foregroundSubscription?.cancel();
    await _openedSubscription?.cancel();
    await _tokenSubscription?.cancel();
  }
}
