import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/alarm_preset.dart';
import '../models/cyclist.dart';
import '../models/map_layer.dart';
import '../models/sos_contact.dart';
import '../services/audio_alarm_service.dart';
import '../services/location_service.dart';

class AppState extends ChangeNotifier {
  // Perfil del ciclista
  String _userName = 'Alejandro';
  String _userInitials = 'AL';
  String _bikeModel = 'Cannondale Topstone Gravel';
  String _phoneNumber = '';
  String _bikeType = 'MTB';
  String _experienceLevel = 'Intermedio';
  bool _isRegistered = false;
  bool _isReady = false;
  List<SosContact> _emergencyContacts = [];
  String _emergencyMessage = '¡Emergencia ciclista! Necesito asistencia en mi ubicación GPS.';

  // Pantalla activa (0: Mapa, 1: Comunidad, 2: Contactos SOS, 3: Perfil)
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
  String get phoneNumber => _phoneNumber;
  String get bikeType => _bikeType;
  String get experienceLevel => _experienceLevel;
  bool get isRegistered => _isRegistered;
  bool get isReady => _isReady;
  List<SosContact> get emergencyContacts => List.unmodifiable(_emergencyContacts);
  String get emergencyContact =>
      _emergencyContacts.isEmpty ? 'Sin configurar' : _emergencyContacts.first.phone;
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

  AppState.forTesting() : _isReady = true;

  Future<void> _initApp() async {
    final preferences = await SharedPreferences.getInstance();
    _loadPreferences(preferences);
    _isReady = true;
    notifyListeners();

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

  void _loadPreferences(SharedPreferences preferences) {
    _userName = preferences.getString('profile.name') ?? _userName;
    _userInitials = _initialsFor(_userName);
    _bikeModel = preferences.getString('profile.bikeModel') ?? _bikeModel;
    _phoneNumber = preferences.getString('profile.phone') ?? _phoneNumber;
    _bikeType = preferences.getString('profile.bikeType') ?? _bikeType;
    _experienceLevel = preferences.getString('profile.experienceLevel') ?? _experienceLevel;
    _isRegistered = preferences.getBool('profile.isRegistered') ?? false;
    _trackingEnabled = preferences.getBool('privacy.trackingEnabled') ?? _trackingEnabled;
    _heatmapEnabled = preferences.getBool('map.heatmapEnabled') ?? _heatmapEnabled;

    final layerName = preferences.getString('map.activeLayer');
    if (layerName != null) {
      _activeLayer = MapLayerType.values.firstWhere(
        (layer) => layer.name == layerName,
        orElse: () => MapLayerType.streets,
      );
    }

    final alarmName = preferences.getString('sos.activeAlarm');
    if (alarmName != null) {
      _activeAlarm = AlarmPreset.values.firstWhere(
        (preset) => preset.name == alarmName,
        orElse: () => AlarmPreset.radarIos,
      );
    }

    final contactsJson = preferences.getString('sos.contacts');
    if (contactsJson != null) {
      final decoded = jsonDecode(contactsJson);
      if (decoded is! List) {
        throw const FormatException('La lista de contactos SOS guardada no es válida.');
      }
      _emergencyContacts = decoded.map((entry) {
        if (entry is! Map<String, dynamic>) {
          throw const FormatException('Contacto SOS guardado con formato inválido.');
        }
        return SosContact.fromJson(entry);
      }).toList();
    }

    _emergencyMessage =
        preferences.getString('sos.message') ?? _emergencyMessage;
  }

  Future<void> completeRegistration({
    required String phone,
    required String name,
    required String bikeType,
    required String experienceLevel,
  }) async {
    final trimmedName = name.trim();
    final trimmedPhone = phone.trim();
    final preferences = await SharedPreferences.getInstance();
    final results = await Future.wait([
      preferences.setString('profile.phone', trimmedPhone),
      preferences.setString('profile.name', trimmedName),
      preferences.setString('profile.bikeType', bikeType),
      preferences.setString('profile.experienceLevel', experienceLevel),
      preferences.setString('profile.bikeModel', bikeType),
      preferences.setBool('profile.isRegistered', true),
    ]);
    if (results.any((saved) => !saved)) {
      throw StateError('El almacenamiento local rechazó uno o más datos del perfil.');
    }

    _phoneNumber = trimmedPhone;
    _userName = trimmedName;
    _userInitials = _initialsFor(trimmedName);
    _bikeType = bikeType;
    _experienceLevel = experienceLevel;
    _bikeModel = bikeType;
    _isRegistered = true;
    notifyListeners();
  }

  String _initialsFor(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((part) => part.isNotEmpty);
    final words = parts.toList();
    if (words.isEmpty) return 'U';
    if (words.length > 1) {
      return '${words.first[0]}${words[1][0]}'.toUpperCase();
    }
    return words.first.substring(0, words.first.length >= 2 ? 2 : 1).toUpperCase();
  }

  void _savePreference(Future<bool> Function(SharedPreferences) save) {
    unawaited(() async {
      final preferences = await SharedPreferences.getInstance();
      if (!await save(preferences)) {
        throw StateError('No se pudo guardar la preferencia de CicloRadar.');
      }
    }());
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
    _savePreference((preferences) => preferences.setString('map.activeLayer', layer.name));
    notifyListeners();
  }

  void toggleHeatmap() {
    _heatmapEnabled = !_heatmapEnabled;
    _savePreference((preferences) =>
        preferences.setBool('map.heatmapEnabled', _heatmapEnabled));
    notifyListeners();
  }

  void toggleTracking() {
    _trackingEnabled = !_trackingEnabled;
    _savePreference((preferences) =>
        preferences.setBool('privacy.trackingEnabled', _trackingEnabled));
    notifyListeners();
  }

  void setActiveAlarm(AlarmPreset preset) {
    _activeAlarm = preset;
    _savePreference((preferences) => preferences.setString('sos.activeAlarm', preset.name));
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
      _userName = name.trim();
      _userInitials = _initialsFor(_userName);
      _savePreference((preferences) => preferences.setString('profile.name', _userName));
    }
    if (bikeModel != null) {
      _bikeModel = bikeModel;
      _savePreference(
          (preferences) => preferences.setString('profile.bikeModel', _bikeModel));
    }
    if (contact != null && contact.trim().isNotEmpty) {
      _emergencyContacts = [
        SosContact(
          id: DateTime.now().microsecondsSinceEpoch.toString(),
          name: 'Contacto SOS',
          phone: contact.trim(),
        ),
      ];
      _saveContacts();
    }
    if (message != null) {
      _emergencyMessage = message;
      _savePreference((preferences) => preferences.setString('sos.message', message));
    }
    notifyListeners();
  }

  void addEmergencyContact(SosContact contact) {
    _emergencyContacts = [..._emergencyContacts, contact];
    _saveContacts();
    notifyListeners();
  }

  void removeEmergencyContact(String id) {
    _emergencyContacts =
        _emergencyContacts.where((contact) => contact.id != id).toList();
    _saveContacts();
    notifyListeners();
  }

  void _saveContacts() {
    final contactsJson = jsonEncode(
      _emergencyContacts.map((contact) => contact.toJson()).toList(),
    );
    _savePreference(
        (preferences) => preferences.setString('sos.contacts', contactsJson));
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
