import 'package:flutter/material.dart';

class AdvancedNightModeService {
  const AdvancedNightModeService();

  bool shouldEnable({
    required DateTime localTime,
    required Brightness platformBrightness,
  }) {
    final isWithinNightHours = localTime.hour >= 20 || localTime.hour < 7;
    return isWithinNightHours || platformBrightness == Brightness.dark;
  }

  String activationReason({
    required DateTime localTime,
    required Brightness platformBrightness,
  }) {
    final isWithinNightHours = localTime.hour >= 20 || localTime.hour < 7;
    final followsSystem = platformBrightness == Brightness.dark;

    if (isWithinNightHours && followsSystem) {
      return 'Activo por el tema oscuro del sistema y el horario local';
    }
    if (followsSystem) {
      return 'Activo por el tema oscuro del sistema';
    }
    if (isWithinNightHours) {
      return 'Activo por el horario local (20:00–07:00)';
    }
    return 'Desactivado según el tema del sistema y el horario local';
  }
}
