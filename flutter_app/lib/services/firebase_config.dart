import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';

class FirebaseConfig {
  static const androidApiKey =
      String.fromEnvironment('FIREBASE_ANDROID_API_KEY');
  static const iosApiKey = String.fromEnvironment('FIREBASE_IOS_API_KEY');
  static const webApiKey = String.fromEnvironment('FIREBASE_WEB_API_KEY');
  static const projectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
  static const messagingSenderId =
      String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID');
  static const androidAppId = String.fromEnvironment('FIREBASE_ANDROID_APP_ID');
  static const iosAppId = String.fromEnvironment('FIREBASE_IOS_APP_ID');
  static const iosBundleId = String.fromEnvironment('FIREBASE_IOS_BUNDLE_ID');
  static const webAppId = String.fromEnvironment('FIREBASE_WEB_APP_ID');
  static const webAuthDomain =
      String.fromEnvironment('FIREBASE_WEB_AUTH_DOMAIN');
  static const webVapidKey = String.fromEnvironment('FIREBASE_WEB_VAPID_KEY');
  static const webAppCheckSiteKey =
      String.fromEnvironment('FIREBASE_WEB_APPCHECK_SITE_KEY');
  static const functionsRegion = String.fromEnvironment(
    'FIREBASE_FUNCTIONS_REGION',
    defaultValue: 'us-central1',
  );

  static String get _appId {
    if (kIsWeb) return webAppId;
    return switch (defaultTargetPlatform) {
      TargetPlatform.android => androidAppId,
      TargetPlatform.iOS => iosAppId,
      _ => '',
    };
  }

  static String get _apiKey {
    if (kIsWeb) return webApiKey;
    return switch (defaultTargetPlatform) {
      TargetPlatform.android => androidApiKey,
      TargetPlatform.iOS => iosApiKey,
      _ => '',
    };
  }

  static bool get isConfigured {
    final needsIosBundleId =
        !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
    return _apiKey.isNotEmpty &&
        projectId.isNotEmpty &&
        messagingSenderId.isNotEmpty &&
        _appId.isNotEmpty &&
        (!needsIosBundleId || iosBundleId.isNotEmpty) &&
        (!kIsWeb ||
            (webAuthDomain.isNotEmpty &&
                webVapidKey.isNotEmpty &&
                (kDebugMode || webAppCheckSiteKey.isNotEmpty)));
  }

  static FirebaseOptions get currentPlatform {
    if (!isConfigured) {
      throw StateError('Faltan los valores de configuración de Firebase.');
    }

    return FirebaseOptions(
      apiKey: _apiKey,
      appId: _appId,
      messagingSenderId: messagingSenderId,
      projectId: projectId,
      authDomain: kIsWeb ? webAuthDomain : null,
      iosBundleId: !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS
          ? iosBundleId
          : null,
    );
  }
}
