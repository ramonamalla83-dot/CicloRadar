import 'dart:async';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
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

  /// Sintetiza la alarma localmente, mantiene la pantalla despierta y activa vibración.
  Future<void> triggerEmergencyAlarm({AlarmPreset? preset}) async {
    final activePreset = preset ?? _currentPreset;
    _currentPreset = activePreset;
    _isPlaying = true;

    try {
      await WakelockPlus.enable();
    } catch (_) {}

    await _audioPlayer.setVolume(1.0);
    await _audioPlayer.setReleaseMode(ReleaseMode.loop);
    await _audioPlayer.play(BytesSource(_createTone(activePreset, const Duration(seconds: 3))));
    _startEmergencyVibration();
  }

  /// Detiene la alarma, la vibración y libera el WakeLock
  Future<void> stopAlarm() async {
    _isPlaying = false;
    _vibrationTimer?.cancel();
    _vibrationTimer = null;

    try {
      await _audioPlayer.stop();
    } catch (_) {}
    if (!kIsWeb) {
      try {
        await Vibration.cancel();
      } catch (_) {}
    }
    try {
      await WakelockPlus.disable();
    } catch (_) {}
  }

  /// Vista previa sintetizada de cuatro segundos del tono seleccionado.
  Future<void> previewAlarm(AlarmPreset preset) async {
    await stopAlarm();
    _currentPreset = preset;

    await _audioPlayer.setVolume(0.9);
    await _audioPlayer.setReleaseMode(ReleaseMode.stop);
    await _audioPlayer.play(BytesSource(_createTone(preset, const Duration(seconds: 4))));

    if (!kIsWeb) {
      final hasVibrator = await Vibration.hasVibrator() ?? false;
      if (hasVibrator) {
        await Vibration.vibrate(duration: 400);
      }
    }
  }

  Uint8List _createTone(AlarmPreset preset, Duration duration) {
    const sampleRate = 22050;
    const bytesPerSample = 2;
    final sampleCount = duration.inMilliseconds * sampleRate ~/ 1000;
    final dataLength = sampleCount * bytesPerSample;
    final bytes = ByteData(44 + dataLength);

    void writeAscii(int offset, String value) {
      for (var index = 0; index < value.length; index++) {
        bytes.setUint8(offset + index, value.codeUnitAt(index));
      }
    }

    writeAscii(0, 'RIFF');
    bytes.setUint32(4, 36 + dataLength, Endian.little);
    writeAscii(8, 'WAVE');
    writeAscii(12, 'fmt ');
    bytes.setUint32(16, 16, Endian.little);
    bytes.setUint16(20, 1, Endian.little);
    bytes.setUint16(22, 1, Endian.little);
    bytes.setUint32(24, sampleRate, Endian.little);
    bytes.setUint32(28, sampleRate * bytesPerSample, Endian.little);
    bytes.setUint16(32, bytesPerSample, Endian.little);
    bytes.setUint16(34, bytesPerSample * 8, Endian.little);
    writeAscii(36, 'data');
    bytes.setUint32(40, dataLength, Endian.little);

    final frequencies = switch (preset) {
      AlarmPreset.radarIos => [1480.0, 1108.7, 1480.0, 1244.5],
      AlarmPreset.goodMorningSamsung => [523.3, 659.3, 784.0, 1046.5],
      AlarmPreset.brightMorningPixel => [587.3, 698.5, 880.0, 1046.5],
      AlarmPreset.siren => const <double>[],
      AlarmPreset.industrialAlarm => [880.0, 880.0, 660.0, 880.0],
      AlarmPreset.sonarBeep => [1450.0, 1450.0, 980.0],
    };
    var phase = 0.0;
    for (var index = 0; index < sampleCount; index++) {
      final time = index / sampleRate;
      final isSiren = preset == AlarmPreset.siren;
      final frequency = isSiren
          ? 700.0 + 400.0 * (0.5 + 0.5 * math.sin(2 * math.pi * 0.8 * time))
          : frequencies[(time * 3.5).floor() % frequencies.length];
      final noteProgress = isSiren ? 0.0 : (time * 3.5) % 1;
      final envelope = isSiren
          ? 0.8
          : noteProgress < 0.06
              ? noteProgress / 0.06
              : noteProgress > 0.82
                  ? (1 - noteProgress) / 0.18
                  : 0.8;
      phase += 2 * math.pi * frequency / sampleRate;
      final sample = (math.sin(phase) * 0.78 + math.sin(phase * 2) * 0.12) *
          envelope *
          0.72;
      bytes.setInt16(
        44 + index * bytesPerSample,
        (sample * 32767).round(),
        Endian.little,
      );
    }
    return bytes.buffer.asUint8List();
  }

  void _startEmergencyVibration() {
    if (kIsWeb) return;
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

  void dispose() {
    stopAlarm();
    _audioPlayer.dispose();
  }
}
