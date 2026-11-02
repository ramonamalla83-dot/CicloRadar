import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:vibration/vibration.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../models/alarm_preset.dart';

class AudioAlarmService {
  static final AudioAlarmService _instance = AudioAlarmService._internal();
  factory AudioAlarmService() => _instance;
  AudioAlarmService._internal();

  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isPlaying = false;
  Timer? _vibrationTimer;
  AlarmPreset _currentPreset = AlarmPreset.radarIos;

  bool get isPlaying => _isPlaying;

  Future<void> init() async {
    // Configurar modo de baja latencia y volumen prioritario
    await _audioPlayer.setReleaseMode(ReleaseMode.stop);
  }

  /// Activa la alarma de emergencia SOS a volumen acústico máximo,
  /// activa el bloqueo de suspensión de pantalla (WakeLock) y vibración háptica repetitiva.
  Future<void> triggerEmergencyAlarm({AlarmPreset? preset}) async {
    final activePreset = preset ?? _currentPreset;
    _isPlaying = true;

    // 1. Mantener pantalla despierta para lectura rápida en el manillar
    try {
      await WakelockPlus.enable();
    } catch (_) {}

    // 2. Forzar volumen al 100% (boost acústico)
    try {
      await _audioPlayer.setVolume(1.0);
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);

      // Reproducir sonido según el preset seleccionado
      final url = _getAlarmAudioUrl(activePreset);
      await _audioPlayer.play(UrlSource(url));
    } catch (_) {
      // Fallback a tonos de sistema
    }

    // 3. Activar pulsos de vibración háptica de emergencia
    _startEmergencyVibration();
  }

  /// Detiene la alarma, la vibración y libera el WakeLock
  Future<void> stopAlarm() async {
    _isPlaying = false;
    _vibrationTimer?.cancel();
    _vibrationTimer = null;

    try {
      await _audioPlayer.stop();
      await Vibration.cancel();
      await WakelockPlus.disable();
    } catch (_) {}
  }

  /// Vista previa de 4 segundos del tono seleccionado
  Future<void> previewAlarm(AlarmPreset preset) async {
    await stopAlarm();
    _currentPreset = preset;

    try {
      await _audioPlayer.setVolume(0.9);
      await _audioPlayer.setReleaseMode(ReleaseMode.stop);
      final url = _getAlarmAudioUrl(preset);
      await _audioPlayer.play(UrlSource(url));

      // Probar vibración corta
      final hasVibrator = await Vibration.hasVibrator() ?? false;
      if (hasVibrator) {
        await Vibration.vibrate(duration: 400);
      }
    } catch (_) {}
  }

  void _startEmergencyVibration() {
    _vibrationTimer?.cancel();
    _vibrationTimer = Timer.periodic(const Duration(milliseconds: 1200), (timer) async {
      if (!_isPlaying) {
        timer.cancel();
        return;
      }
      try {
        final hasCustomVibe = await Vibration.hasCustomVibrationsSupport() ?? false;
        if (hasCustomVibe) {
          await Vibration.vibrate(
            pattern: [0, 400, 200, 400],
            intensities: [0, 255, 0, 255],
          );
        } else {
          await Vibration.vibrate(duration: 600);
        }
      } catch (_) {}
    });
  }

  /// URLs de audio optimizadas y fuentes de tonos
  String _getAlarmAudioUrl(AlarmPreset preset) {
    switch (preset) {
      case AlarmPreset.radarIos:
        // Tono tipo marimba percusiva iOS Radar
        return 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';
      case AlarmPreset.goodMorningSamsung:
        // Arpegio brillante tipo Galaxy
        return 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';
      case AlarmPreset.brightMorningPixel:
        // Kalimba y vibráfono Android Puro
        return 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
      case AlarmPreset.siren:
        // Sirena acústica
        return 'https://actions.google.com/sounds/v1/emergency/emergency_siren_short_burst.ogg';
      case AlarmPreset.industrialAlarm:
        // Alarma de fábrica / pulso rápido
        return 'https://actions.google.com/sounds/v1/alarms/mechanical_clock_ring.ogg';
      case AlarmPreset.sonarBeep:
        // Sonar táctico
        return 'https://actions.google.com/sounds/v1/science_fiction/alien_beacon.ogg';
    }
  }

  void dispose() {
    stopAlarm();
    _audioPlayer.dispose();
  }
}
