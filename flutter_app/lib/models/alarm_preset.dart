enum AlarmPreset {
  radarIos,
  goodMorningSamsung,
  brightMorningPixel,
  siren,
  industrialAlarm,
  sonarBeep,
}

class AlarmPresetConfig {
  final AlarmPreset id;
  final String title;
  final String subtitle;
  final String manufacturer;
  final String notePattern;

  const AlarmPresetConfig({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.manufacturer,
    required this.notePattern,
  });

  static const List<AlarmPresetConfig> presets = [
    AlarmPresetConfig(
      id: AlarmPreset.radarIos,
      title: 'Radar',
      subtitle: 'Tono oficial Apple iOS / iPhone',
      manufacturer: 'Apple',
      notePattern: 'Marimba rítmica percusiva en doble tono agudo (F#6 / C#6)',
    ),
    AlarmPresetConfig(
      id: AlarmPreset.goodMorningSamsung,
      title: 'Good Morning',
      subtitle: 'Tono oficial Samsung Galaxy OneUI',
      manufacturer: 'Samsung',
      notePattern: 'Arpegio de campana brillante ascendente (Do Mayor)',
    ),
    AlarmPresetConfig(
      id: AlarmPreset.brightMorningPixel,
      title: 'Bright Morning',
      subtitle: 'Tono oficial Google Pixel / Android Puro',
      manufacturer: 'Google Pixel',
      notePattern: 'Kalimba y vibráfono pentatónico cálido de alta proyección',
    ),
    AlarmPresetConfig(
      id: AlarmPreset.siren,
      title: 'Sirena Policial Acústica',
      subtitle: 'Frecuencia modulada de alta penetración',
      manufacturer: 'Alerta General',
      notePattern: 'Bifrecuencia oscilante 700Hz - 1100Hz',
    ),
    AlarmPresetConfig(
      id: AlarmPreset.industrialAlarm,
      title: 'Alarma Industrial / Evacuación',
      subtitle: 'Pulsos de advertencia rápida',
      manufacturer: 'Emergencia',
      notePattern: 'Pulsos estroboscópicos de 880Hz',
    ),
    AlarmPresetConfig(
      id: AlarmPreset.sonarBeep,
      title: 'Sonar Náutico de Emergencia',
      subtitle: 'Pings con eco y resonancia',
      manufacturer: 'Táctico',
      notePattern: 'Onda sinusoidal pura de 1450Hz con caída exponencial',
    ),
  ];

  static AlarmPresetConfig getById(AlarmPreset id) {
    return presets.firstWhere(
      (p) => p.id == id,
      orElse: () => presets[0],
    );
  }
}
