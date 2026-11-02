import 'dart:async';
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../models/alarm_preset.dart';
import '../models/cyclist.dart';
import '../models/map_layer.dart';
import '../services/audio_alarm_service.dart';
import '../services/location_service.dart';

class AppState extends ChangeNotifier {
  // Perfil del ciclista
  String _userName = 'Alejandro';
  String _userInitials = 'AL';
  String _bikeModel = 'Cannondale Topstone Gravel';
  String _emergencyContact = '+34 612 345 678';
  String _emergencyMessage = '¡Emergencia ciclista! Necesito asistencia en mi ubicación GPS.';

  // Pantalla activa (0: Mapa, 1: Comunidad, 2: SOS, 3: Perfil)
  int _currentScreenIndex = 0;

  // Ubicación del usuario
  LatLng _userLocation = LocationService.defaultLocation;
  bool _isLoadingLocation = true;

  // Capas y Modos del Mapa (Día / Streets por defecto según AGENTS.md)
  MapLayerType _activeLayer = MapLayerType.streets;
  bool _heatmapEnabled = true;
  bool _trackingEnabled = true; // false = Modo Sigilo / Invisible

  // Alarmas del sistema (Radar iOS por defecto según AGENTS.md)
  AlarmPreset _activeAlarm = AlarmPreset.radarIos;

  // Estado del Sistema SOS
  bool _isCountingDown = false;
  int _countdownSeconds = 5;
  Timer? _countdownTimer;
  bool _isEmergencyActive = false;

  // Alerta comunitaria entrante (simulada o recibida)
  Cyclist? _incomingEmergency;

  // Ciclistas de la comunidad y corredores
  List<Cyclist> _communityCyclists = [];
  List<HeatmapCorridor> _corridors = [];

  final AudioAlarmService _audioService = AudioAlarmService();
  final LocationService _locationService = LocationService();

  // Getters
  String get userName => _userName;
  String get userInitials => _userInitials;
  String get bikeModel => _bikeModel;
  String get emergencyContact => _emergencyContact;
  String get emergencyMessage => _emergencyMessage;
  int get currentScreenIndex => _currentScreenIndex;
  LatLng get userLocation => _userLocation;
  bool get isLoadingLocation => _isLoadingLocation;
  MapLayerType get activeLayer => _activeLayer;
  bool get heatmapEnabled => _heatmapEnabled;
  bool get trackingEnabled => _trackingEnabled;
  AlarmPreset get activeAlarm => _activeAlarm;
  bool get isCountingDown => _isCountingDown;
  int get countdownSeconds => _countdownSeconds;
  bool get isEmergencyActive => _isEmergencyActive;
  Cyclist? get incomingEmergency => _incomingEmergency;
  List<Cyclist> get communityCyclists => _communityCyclists;
  List<HeatmapCorridor> get corridors => _corridors;

  AppState() {
    _initApp();
  }

  Future<void> _initApp() async {
    await _audioService.init();
    await refreshLocation();
    _corridors = CommunityData.getSampleCorridors(_userLocation);
    _communityCyclists = CommunityData.getInitialCyclists(_userLocation);
    notifyListeners();

    // Iniciar rastreo continuo
    _locationService.startTracking((newPos) {
      _userLocation = newPos;
      notifyListeners();
    });
  }

  Future<void> refreshLocation() async {
    _isLoadingLocation = true;
    notifyListeners();

    _userLocation = await _locationService.getCurrentLocation();
    _isLoadingLocation = false;
    _corridors = CommunityData.getSampleCorridors(_userLocation);
    _communityCyclists = CommunityData.getInitialCyclists(_userLocation);
    notifyListeners();
  }

  void setScreenIndex(int index) {
    _currentScreenIndex = index;
    notifyListeners();
  }

  void setMapLayer(MapLayerType layer) {
    _activeLayer = layer;
    notifyListeners();
  }

  void toggleHeatmap() {
    _heatmapEnabled = !_heatmapEnabled;
    notifyListeners();
  }

  void toggleTracking() {
    _trackingEnabled = !_trackingEnabled;
    notifyListeners();
  }

  void setActiveAlarm(AlarmPreset preset) {
    _activeAlarm = preset;
    notifyListeners();
  }

  void previewAlarmSound(AlarmPreset preset) {
    _audioService.previewAlarm(preset);
  }

  void updateProfile({
    String? name,
    String? bikeModel,
    String? contact,
    String? message,
  }) {
    if (name != null && name.isNotEmpty) {
      _userName = name;
      final parts = name.trim().split(' ');
      if (parts.length >= 2) {
        _userInitials = '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      } else {
        _userInitials = name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
      }
    }
    if (bikeModel != null) _bikeModel = bikeModel;
    if (contact != null) _emergencyContact = contact;
    if (message != null) _emergencyMessage = message;
    notifyListeners();
  }

  // --- FLUJO DE EMERGENCIA SOS ---

  /// Inicia la cuenta regresiva de 5 segundos contra pulsaciones accidentales
  void startSosCountdown() {
    if (_isCountingDown || _isEmergencyActive) return;

    _isCountingDown = true;
    _countdownSeconds = 5;
    notifyListeners();

    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdownSeconds > 1) {
        _countdownSeconds--;
        notifyListeners();
      } else {
        timer.cancel();
        _isCountingDown = false;
        triggerEmergencySos();
      }
    });
  }

  /// Cancela la cuenta regresiva inmediatamente
  void cancelSosCountdown() {
    _countdownTimer?.cancel();
    _countdownTimer = null;
    _isCountingDown = false;
    _countdownSeconds = 5;
    notifyListeners();
  }

  /// Dispara la alerta SOS activa con volumen forzado al máximo
  void triggerEmergencySos() {
    _isEmergencyActive = true;
    notifyListeners();
    _audioService.triggerEmergencyAlarm(preset: _activeAlarm);
  }

  /// Detiene la alarma activa y silencia la sirena
  void dismissEmergencySos() {
    _isEmergencyActive = false;
    _audioService.stopAlarm();
    notifyListeners();
  }

  /// Simula una alerta entrante de un ciclista cercano para probar el radar
  void simulateIncomingEmergency() {
    final alertPos = LatLng(_userLocation.latitude + 0.0019, _userLocation.longitude + 0.0014);
    _incomingEmergency = Cyclist(
      id: 'alert-sim-1',
      name: 'Elena Gómez (Alerta SOS)',
      initials: 'EG',
      distanceKm: 0.28,
      position: alertPos,
      isEmergency: true,
      lastSeen: '¡Caída detectada hace 1 min!',
      bikeModel: 'Cannondale Trail 5',
    );
    notifyListeners();

    // Activar sonido con boost
    _audioService.triggerEmergencyAlarm(preset: _activeAlarm);
  }

  void dismissIncomingEmergency() {
    _incomingEmergency = null;
    _audioService.stopAlarm();
    notifyListeners();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _locationService.stopTracking();
    _audioService.dispose();
    super.dispose();
  }
}
