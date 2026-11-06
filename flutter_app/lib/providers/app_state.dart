import 'dart:async';
import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/alarm_preset.dart';
import '../models/cyclist.dart';
import '../models/map_layer.dart';
import '../models/sos_contact.dart';
import '../services/advanced_night_mode_service.dart';
import '../services/audio_alarm_service.dart';
import '../services/location_service.dart';
import '../services/sos_push_service.dart';

class AppState extends ChangeNotifier with WidgetsBindingObserver {
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
  String _emergencyMessage =
      '¡Emergencia ciclista! Necesito asistencia en mi ubicación GPS.';

  // Pantalla activa (0: Inicio, 1: Mapa, 2: Comunidad, 3: Contactos SOS, 4: Perfil)
  int _currentScreenIndex = 0;

  // Ubicación del usuario
  LatLng _userLocation = LocationService.defaultLocation;
  bool _isLoadingLocation = true;

  // Capas y Modos del Mapa (Día / Streets por defecto según AGENTS.md)
  MapLayerType _activeLayer = MapLayerType.streets;
  MapLayerType _preferredMapLayer = MapLayerType.streets;
  bool _automaticNightModeEnabled = true;
  bool _advancedNightModeEnabled = false;
  String _advancedNightModeStatus = 'Desactivado';
  Timer? _nightModeTimer;
  bool _heatmapEnabled = true;
  bool _trackingEnabled = true; // false = Modo Sigilo / Invisible
  bool _sosAlertNotificationsEnabled = false;
  bool _hasVerifiedUserLocation = false;
  String? _sosPushStatus;
  String? _activeSosId;
  Timer? _presenceTimer;
  bool _presencePublishInProgress = false;
  DateTime? _lastPresencePublishedAt;
  LatLng? _lastPresencePosition;

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

  late final AudioAlarmService _audioService = AudioAlarmService();
  final LocationService _locationService = LocationService();
  final SosPushService _sosPushService = SosPushService();
  final AdvancedNightModeService _nightModeService =
      const AdvancedNightModeService();
  late final DateTime Function() _localClock;
  late final Brightness Function() _platformBrightness;

  // Getters
  String get userName => _userName;
  String get userInitials => _userInitials;
  String get bikeModel => _bikeModel;
  String get phoneNumber => _phoneNumber;
  String get bikeType => _bikeType;
  String get experienceLevel => _experienceLevel;
  bool get isRegistered => _isRegistered;
  bool get isReady => _isReady;
  List<SosContact> get emergencyContacts =>
      List.unmodifiable(_emergencyContacts);
  String get emergencyContact => _emergencyContacts.isEmpty
      ? 'Sin configurar'
      : _emergencyContacts.first.phone;
  String get emergencyMessage => _emergencyMessage;
  int get currentScreenIndex => _currentScreenIndex;
  LatLng get userLocation => _userLocation;
  bool get isLoadingLocation => _isLoadingLocation;
  bool get hasVerifiedUserLocation => _hasVerifiedUserLocation;
  MapLayerType get activeLayer => _activeLayer;
  MapLayerType get preferredMapLayer => _preferredMapLayer;
  bool get automaticNightModeEnabled => _automaticNightModeEnabled;
  bool get advancedNightModeEnabled => _advancedNightModeEnabled;
  String get advancedNightModeStatus => _advancedNightModeStatus;

  bool get heatmapEnabled => _heatmapEnabled;
  bool get trackingEnabled => _trackingEnabled;
  bool get sosPushConfigured => _sosPushService.isConfigured;
  bool get sosAlertNotificationsEnabled => _sosAlertNotificationsEnabled;
  String? get sosPushStatus => _sosPushStatus;
  AlarmPreset get activeAlarm => _activeAlarm;
  bool get isCountingDown => _isCountingDown;
  int get countdownSeconds => _countdownSeconds;
  bool get isEmergencyActive => _isEmergencyActive;
  Cyclist? get incomingEmergency => _incomingEmergency;
  List<Cyclist> get communityCyclists => _communityCyclists;
  List<HeatmapCorridor> get corridors => _corridors;

  AppState() {
    _localClock = DateTime.now;
    _platformBrightness =
        () => WidgetsBinding.instance.platformDispatcher.platformBrightness;
    WidgetsBinding.instance.addObserver(this);
    _nightModeTimer = Timer.periodic(
      const Duration(minutes: 1),
      (_) => refreshNightMode(),
    );
    refreshNightMode(notify: false);
    _initApp();
  }

  AppState.forTesting({
    DateTime Function()? localClock,
    Brightness platformBrightness = Brightness.light,
  })  : _localClock = localClock ?? (() => DateTime(2026, 1, 1, 12)),
        _platformBrightness = (() => platformBrightness),
        _isReady = true {
    refreshNightMode(notify: false);
  }

  Future<void> _initApp() async {
    final preferences = await SharedPreferences.getInstance();
    _loadPreferences(preferences);
    _isReady = true;
    notifyListeners();

    await _audioService.init();
    try {
      await _sosPushService.initialize(
        onIncomingSos: _handleIncomingPush,
        onError: (message) {
          _sosPushStatus = message;
          notifyListeners();
        },
      );
    } on SosPushException catch (error) {
      _sosPushStatus = error.message;
      notifyListeners();
    }

    await refreshLocation();
    _corridors = CommunityData.getSampleCorridors(_userLocation);
    _communityCyclists = CommunityData.getInitialCyclists(_userLocation);
    notifyListeners();

    // Iniciar rastreo continuo
    _locationService.startTracking((newPos) {
      _userLocation = newPos;
      _hasVerifiedUserLocation = true;
      if (_sosAlertNotificationsEnabled &&
          WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed) {
        unawaited(_publishSosPresence());
      }
      notifyListeners();
    });
    if (_sosAlertNotificationsEnabled && _sosPushService.isInitialized) {
      _startPresenceUpdates();
    }
  }

  void _loadPreferences(SharedPreferences preferences) {
    _userName = preferences.getString('profile.name') ?? _userName;
    _userInitials = _initialsFor(_userName);
    _bikeModel = preferences.getString('profile.bikeModel') ?? _bikeModel;
    _phoneNumber = preferences.getString('profile.phone') ?? _phoneNumber;
    _bikeType = preferences.getString('profile.bikeType') ?? _bikeType;
    _experienceLevel =
        preferences.getString('profile.experienceLevel') ?? _experienceLevel;
    _isRegistered = preferences.getBool('profile.isRegistered') ?? false;
    _trackingEnabled =
        preferences.getBool('privacy.trackingEnabled') ?? _trackingEnabled;
    _heatmapEnabled =
        preferences.getBool('map.heatmapEnabled') ?? _heatmapEnabled;
    _automaticNightModeEnabled =
        preferences.getBool('map.automaticNightModeEnabled') ?? true;
    _sosAlertNotificationsEnabled =
        preferences.getBool('sos.alertsEnabled') ?? false;

    final layerName = preferences.getString('map.activeLayer');
    if (layerName != null) {
      _preferredMapLayer = MapLayerType.values.firstWhere(
        (layer) => layer.name == layerName,
        orElse: () => MapLayerType.streets,
      );
    }
    refreshNightMode(notify: false);

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
        throw const FormatException(
            'La lista de contactos SOS guardada no es válida.');
      }
      _emergencyContacts = decoded.map((entry) {
        if (entry is! Map<String, dynamic>) {
          throw const FormatException(
              'Contacto SOS guardado con formato inválido.');
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
      throw StateError(
          'El almacenamiento local rechazó uno o más datos del perfil.');
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
    final parts =
        name.trim().split(RegExp(r'\s+')).where((part) => part.isNotEmpty);
    final words = parts.toList();
    if (words.isEmpty) return 'U';
    if (words.length > 1) {
      return '${words.first[0]}${words[1][0]}'.toUpperCase();
    }
    return words.first
        .substring(0, words.first.length >= 2 ? 2 : 1)
        .toUpperCase();
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

    final verifiedLocation =
        await _locationService.getVerifiedCurrentLocation();
    _hasVerifiedUserLocation = verifiedLocation != null;
    _userLocation = verifiedLocation ?? LocationService.defaultLocation;
    _isLoadingLocation = false;
    _corridors = CommunityData.getSampleCorridors(_userLocation);
    _communityCyclists = CommunityData.getInitialCyclists(_userLocation);
    notifyListeners();
  }

  void setScreenIndex(int index) {
    _currentScreenIndex = index;
    notifyListeners();
  }

  Future<void> setSosAlertNotificationsEnabled(bool enabled) async {
    if (!enabled) {
      final preferences = await SharedPreferences.getInstance();
      if (!await preferences.setBool('sos.alertsEnabled', false)) {
        throw StateError('No se pudo guardar la preferencia de alertas SOS.');
      }
      _sosAlertNotificationsEnabled = false;
      _presenceTimer?.cancel();
      _presenceTimer = null;
      _sosPushStatus = null;
      notifyListeners();
      if (_sosPushService.isInitialized) {
        try {
          await _sosPushService.disableSosAlerts();
        } on SosPushException catch (error) {
          _sosPushStatus = error.message;
          notifyListeners();
          rethrow;
        }
      }
      return;
    }

    if (!_sosPushService.isConfigured || !_sosPushService.isInitialized) {
      throw const SosPushException(
        'Firebase aún no está configurado. No se activaron las alertas SOS.',
      );
    }

    final granted = await _sosPushService.enableSosAlerts();
    if (!granted) {
      throw const SosPushException(
        'El permiso de notificaciones fue rechazado; las alertas SOS siguen desactivadas.',
      );
    }
    final preferences = await SharedPreferences.getInstance();
    if (!await preferences.setBool('sos.alertsEnabled', true)) {
      await _sosPushService.disableSosAlerts();
      throw StateError('No se pudo guardar la preferencia de alertas SOS.');
    }

    _sosAlertNotificationsEnabled = true;
    _sosPushStatus = 'Recibirás alertas SOS grupales y de ciclistas cercanos.';
    notifyListeners();
    _startPresenceUpdates();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      refreshNightMode();
    }
    if (!_sosAlertNotificationsEnabled || !_sosPushService.isInitialized) {
      return;
    }
    if (state == AppLifecycleState.resumed) {
      _startPresenceUpdates();
    } else {
      _presenceTimer?.cancel();
      _presenceTimer = null;
      _lastPresencePublishedAt = null;
      _lastPresencePosition = null;
      unawaited(_clearSosPresence());
    }
  }

  @override
  void didChangePlatformBrightness() {
    refreshNightMode();
  }

  @override
  void didChangeLocales(List<Locale>? locales) {
    refreshNightMode();
  }

  void refreshNightMode({
    DateTime? localTime,
    Brightness? platformBrightness,
    bool notify = true,
  }) {
    final now = localTime ?? _localClock();
    final brightness = platformBrightness ?? _platformBrightness();
    final shouldEnable = _automaticNightModeEnabled &&
        _nightModeService.shouldEnable(
          localTime: now,
          platformBrightness: brightness,
        );
    final status = !_automaticNightModeEnabled
        ? 'Desactivado (activación automática deshabilitada)'
        : _nightModeService.activationReason(
            localTime: now,
            platformBrightness: brightness,
          );
    final didChange = shouldEnable != _advancedNightModeEnabled;
    final didStatusChange = status != _advancedNightModeStatus;
    _advancedNightModeEnabled = shouldEnable;
    _advancedNightModeStatus = status;
    _activeLayer = shouldEnable ? MapLayerType.dark : _preferredMapLayer;
    if ((didChange || didStatusChange) && notify) {
      notifyListeners();
    }
  }

  Future<void> setAutomaticNightModeEnabled(bool enabled) async {
    final preferences = await SharedPreferences.getInstance();
    if (!await preferences.setBool('map.automaticNightModeEnabled', enabled)) {
      throw StateError('No se pudo guardar la preferencia del modo nocturno.');
    }
    _automaticNightModeEnabled = enabled;
    refreshNightMode();
  }

  void _startPresenceUpdates() {
    _presenceTimer?.cancel();
    unawaited(_publishSosPresence(force: true));
    _presenceTimer = Timer.periodic(
      const Duration(minutes: 1),
      (_) => unawaited(_publishSosPresence(force: true)),
    );
  }

  Future<void> _publishSosPresence({bool force = false}) async {
    if (!_sosAlertNotificationsEnabled ||
        !_sosPushService.isInitialized ||
        _presencePublishInProgress) {
      return;
    }
    if (!_hasVerifiedUserLocation) {
      _sosPushStatus =
          'Alertas activas, pero tu GPS no está disponible para aparecer en el radio de 10 km.';
      notifyListeners();
      return;
    }
    final now = DateTime.now();
    final previousPosition = _lastPresencePosition;
    final movedMeters = previousPosition == null
        ? double.infinity
        : const Distance().as(
            LengthUnit.Meter,
            previousPosition,
            _userLocation,
          );
    if (!force &&
        _lastPresencePublishedAt != null &&
        now.difference(_lastPresencePublishedAt!) <
            const Duration(seconds: 30) &&
        movedMeters < 100) {
      return;
    }
    _presencePublishInProgress = true;
    try {
      await _sosPushService.updateSosPresence(
        latitude: _userLocation.latitude,
        longitude: _userLocation.longitude,
      );
      _lastPresencePublishedAt = now;
      _lastPresencePosition = _userLocation;
      _sosPushStatus = 'Ubicación compartida solo mientras usas la app.';
    } on SosPushException catch (error) {
      _sosPushStatus = error.message;
    } finally {
      _presencePublishInProgress = false;
    }
    notifyListeners();
  }

  Future<void> _clearSosPresence() async {
    try {
      await _sosPushService.clearSosPresence();
    } on SosPushException catch (error) {
      _sosPushStatus = error.message;
      notifyListeners();
    }
  }

  void _handleIncomingPush(RemoteMessage message) {
    final data = message.data;
    final latitude = double.tryParse(data['latitude']?.toString() ?? '');
    final longitude = double.tryParse(data['longitude']?.toString() ?? '');
    final sosId = data['sosId']?.toString();
    if (latitude == null ||
        longitude == null ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180 ||
        sosId == null ||
        sosId.isEmpty) {
      _sosPushStatus = 'Se recibió una alerta SOS con datos incompletos.';
      notifyListeners();
      return;
    }

    if (data['senderId'] == _sosPushService.currentUserId) {
      _activeSosId = sosId;
      final shouldStartAlarm = !_isEmergencyActive;
      _isEmergencyActive = true;
      _sosPushStatus = 'Tu SOS sigue activo.';
      if (shouldStartAlarm) {
        _audioService.triggerEmergencyAlarm(preset: _activeAlarm);
      }
    } else {
      if (_incomingEmergency?.id == sosId) return;
      final position = LatLng(latitude, longitude);
      final distanceKm =
          const Distance().as(LengthUnit.Kilometer, _userLocation, position);
      final name = data['riderName']?.toString() ?? 'Ciclista cercano';
      _incomingEmergency = Cyclist(
        id: sosId,
        name: name,
        initials: _initialsFor(name),
        distanceKm: distanceKm,
        position: position,
        isEmergency: true,
        lastSeen: 'SOS activo',
        bikeModel: 'No informado',
      );
      _audioService.triggerEmergencyAlarm(preset: _activeAlarm);
    }
    _currentScreenIndex = 1;
    notifyListeners();
  }

  void setMapLayer(MapLayerType layer) {
    _preferredMapLayer = layer;
    _activeLayer =
        _advancedNightModeEnabled ? MapLayerType.dark : _preferredMapLayer;
    _savePreference(
        (preferences) => preferences.setString('map.activeLayer', layer.name));
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
    _savePreference(
        (preferences) => preferences.setString('sos.activeAlarm', preset.name));
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
      _savePreference(
          (preferences) => preferences.setString('profile.name', _userName));
    }
    if (bikeModel != null) {
      _bikeModel = bikeModel;
      _savePreference((preferences) =>
          preferences.setString('profile.bikeModel', _bikeModel));
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
      _savePreference(
          (preferences) => preferences.setString('sos.message', message));
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
    if (_isEmergencyActive) return;
    _isEmergencyActive = true;
    _sosPushStatus = null;
    notifyListeners();
    _audioService.triggerEmergencyAlarm(preset: _activeAlarm);
    unawaited(_sendSosToBackend());
  }

  Future<void> _sendSosToBackend() async {
    final recipientPhones = normalizeSosRecipientPhones(_emergencyContacts);
    final invalidContactCount = _emergencyContacts
        .where((contact) => contact.normalizedPhone == null)
        .length;

    if (!_sosPushService.isConfigured) {
      _sosPushStatus =
          'SOS local activo; Firebase no está configurado y no se envió un push grupal. '
          'La alerta remota requiere backend desplegado y contactos con cuenta verificada.';
      notifyListeners();
      return;
    }
    if (!_sosPushService.isInitialized) {
      _sosPushStatus = _sosPushStatus ??
          'SOS local activo; Firebase no pudo inicializarse y no se envió un push grupal.';
      notifyListeners();
      return;
    }

    final position = await _locationService.getVerifiedCurrentLocation();
    if (!_isEmergencyActive) return;
    if (position == null) {
      _sosPushStatus =
          'SOS local activo; no se envió el push porque no se pudo obtener tu ubicación GPS.';
      notifyListeners();
      return;
    }

    try {
      final result = await _sosPushService.activateSos(
        riderName: _userName,
        latitude: position.latitude,
        longitude: position.longitude,
        recipientPhones: recipientPhones,
      );
      if (!_isEmergencyActive) {
        await _sosPushService.resolveSos(result.sosId);
        _sosPushStatus = 'SOS remoto desactivado.';
        notifyListeners();
        return;
      }
      _activeSosId = result.sosId;
      final invalidContactsMessage = invalidContactCount > 0
          ? ' $invalidContactCount contacto(s) omitido(s): verifica el teléfono con código de país.'
          : '';
      _sosPushStatus = result.groupNotifiedCount > 0
          ? 'SOS grupal aceptado para ${result.groupNotifiedCount} dispositivo(s). '
              'La entrega final depende de la conexión del destinatario.'
              '${result.groupSkippedCount > 0 ? ' ${result.groupSkippedCount} contacto(s) sin cuenta verificada o sin consentimiento.' : ''}'
              '$invalidContactsMessage'
          : 'SOS remoto activo, pero ningún contacto grupal confirmó elegibilidad.'
              '${result.groupSkippedCount > 0 ? ' ${result.groupSkippedCount} contacto(s) sin cuenta verificada o sin consentimiento.' : ''}'
              '$invalidContactsMessage';
    } on SosPushException catch (error) {
      _sosPushStatus =
          'SOS local activo, pero no se pudo enviar la alerta remota: ${error.message}';
    }
    notifyListeners();
  }

  /// Detiene la alarma activa y silencia la sirena
  void dismissEmergencySos() {
    _isEmergencyActive = false;
    _audioService.stopAlarm();
    final sosId = _activeSosId;
    _activeSosId = null;
    if (sosId != null) unawaited(_resolveSosOnBackend(sosId));
    notifyListeners();
  }

  Future<void> _resolveSosOnBackend(String sosId) async {
    try {
      await _sosPushService.resolveSos(sosId);
      _sosPushStatus = 'SOS desactivado.';
    } on SosPushException catch (error) {
      _sosPushStatus = 'No se pudo cerrar el SOS remoto: ${error.message}';
    }
    notifyListeners();
  }

  /// Simula una alerta entrante de un ciclista cercano para probar el radar
  void simulateIncomingEmergency() {
    final alertPos = LatLng(
        _userLocation.latitude + 0.0019, _userLocation.longitude + 0.0014);
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
    dismissIncomingSos();
  }

  void dismissIncomingSos() {
    _incomingEmergency = null;
    _audioService.stopAlarm();
    notifyListeners();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _countdownTimer?.cancel();
    _nightModeTimer?.cancel();
    _presenceTimer?.cancel();
    _locationService.stopTracking();
    _audioService.dispose();
    unawaited(_sosPushService.dispose());
    super.dispose();
  }
}
