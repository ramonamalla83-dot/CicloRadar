import 'package:cicloradar/services/advanced_night_mode_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = AdvancedNightModeService();

  test('activates during local night and deactivates at 07:00', () {
    expect(
      service.shouldEnable(
        localTime: DateTime(2026, 1, 1, 19, 59),
        platformBrightness: Brightness.light,
      ),
      isFalse,
    );
    expect(
      service.shouldEnable(
        localTime: DateTime(2026, 1, 1, 20),
        platformBrightness: Brightness.light,
      ),
      isTrue,
    );
    expect(
      service.shouldEnable(
        localTime: DateTime(2026, 1, 2, 6, 59),
        platformBrightness: Brightness.light,
      ),
      isTrue,
    );
    expect(
      service.shouldEnable(
        localTime: DateTime(2026, 1, 2, 7),
        platformBrightness: Brightness.light,
      ),
      isFalse,
    );
  });

  test('activates during daytime when the operating system is dark', () {
    expect(
      service.shouldEnable(
        localTime: DateTime(2026, 1, 1, 12),
        platformBrightness: Brightness.dark,
      ),
      isTrue,
    );
  });

  test('explains which automatic condition is active', () {
    expect(
      service.activationReason(
        localTime: DateTime(2026, 1, 1, 21),
        platformBrightness: Brightness.dark,
      ),
      'Activo por el tema oscuro del sistema y el horario local',
    );
    expect(
      service.activationReason(
        localTime: DateTime(2026, 1, 1, 12),
        platformBrightness: Brightness.light,
      ),
      'Desactivado según el tema del sistema y el horario local',
    );
  });
}
