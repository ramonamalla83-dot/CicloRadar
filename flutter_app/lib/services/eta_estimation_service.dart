import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

class EtaEstimationException implements Exception {
  const EtaEstimationException(this.message);

  final String message;

  @override
  String toString() => message;
}

class EtaEstimate {
  const EtaEstimate({
    required this.distanceKm,
    required this.ascentMeters,
    required this.averageSpeedKmh,
    required this.duration,
  });

  final double distanceKm;
  final double ascentMeters;
  final double averageSpeedKmh;
  final Duration duration;
}

class EtaEstimationService {
  EtaEstimationService({http.Client? client})
      : _client = client ?? http.Client();

  static const int _profilePointCount = 11;
  static const double _minimumRouteDistanceKm = 0.05;

  final http.Client _client;

  Future<EtaEstimate> estimate({
    required LatLng origin,
    required LatLng destination,
    required double averageSpeedKmh,
  }) async {
    if (!origin.latitude.isFinite ||
        !origin.longitude.isFinite ||
        !destination.latitude.isFinite ||
        !destination.longitude.isFinite ||
        origin.latitude < -90 ||
        origin.latitude > 90 ||
        destination.latitude < -90 ||
        destination.latitude > 90 ||
        origin.longitude < -180 ||
        origin.longitude > 180 ||
        destination.longitude < -180 ||
        destination.longitude > 180) {
      throw const EtaEstimationException(
        'El origen o el destino no tiene coordenadas válidas.',
      );
    }
    if (!averageSpeedKmh.isFinite || averageSpeedKmh <= 0) {
      throw const EtaEstimationException(
        'No hay una velocidad media válida para calcular la llegada.',
      );
    }

    final distanceKm = const Distance().as(
      LengthUnit.Kilometer,
      origin,
      destination,
    );
    if (distanceKm < _minimumRouteDistanceKm) {
      throw const EtaEstimationException(
        'Selecciona un destino a más de 50 metros de tu ubicación.',
      );
    }

    final points = List<LatLng>.generate(_profilePointCount, (index) {
      final fraction = index / (_profilePointCount - 1);
      return LatLng(
        origin.latitude + (destination.latitude - origin.latitude) * fraction,
        origin.longitude +
            (destination.longitude - origin.longitude) * fraction,
      );
    });
    final elevation = await _loadElevationProfile(points);

    return calculate(
      distanceKm: distanceKm,
      elevationsMeters: elevation,
      averageSpeedKmh: averageSpeedKmh,
    );
  }

  Future<List<double>> _loadElevationProfile(List<LatLng> points) async {
    final uri = Uri.https('api.open-meteo.com', '/v1/elevation', {
      'latitude': points.map((point) => point.latitude).join(','),
      'longitude': points.map((point) => point.longitude).join(','),
    });

    late final http.Response response;
    try {
      response = await _client.get(uri).timeout(const Duration(seconds: 12));
    } on TimeoutException {
      throw const EtaEstimationException(
        'La consulta de altimetría tardó demasiado. Inténtalo de nuevo.',
      );
    } on http.ClientException {
      throw const EtaEstimationException(
        'No se pudo conectar con el servicio de altimetría.',
      );
    }

    if (response.statusCode != 200) {
      throw EtaEstimationException(
        'El servicio de altimetría respondió con el código '
        '${response.statusCode}.',
      );
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic> || decoded['elevation'] is! List) {
      throw const FormatException(
        'La respuesta de altimetría no tiene el formato esperado.',
      );
    }
    final elevations = (decoded['elevation'] as List)
        .whereType<num>()
        .map((value) => value.toDouble())
        .toList(growable: false);
    if (elevations.length != points.length ||
        elevations.any((value) => !value.isFinite)) {
      throw const FormatException(
        'El perfil de altimetría recibido está incompleto.',
      );
    }
    return elevations;
  }

  static EtaEstimate calculate({
    required double distanceKm,
    required List<double> elevationsMeters,
    required double averageSpeedKmh,
  }) {
    if (!distanceKm.isFinite ||
        distanceKm <= 0 ||
        !averageSpeedKmh.isFinite ||
        averageSpeedKmh <= 0 ||
        elevationsMeters.length < 2 ||
        elevationsMeters.any((value) => !value.isFinite)) {
      throw const EtaEstimationException(
        'No se pudo calcular una estimación con los datos recibidos.',
      );
    }

    final segmentDistanceMeters =
        distanceKm * 1000 / (elevationsMeters.length - 1);
    var ascentMeters = 0.0;
    var estimatedHours = 0.0;

    for (var index = 1; index < elevationsMeters.length; index++) {
      final elevationChange =
          elevationsMeters[index] - elevationsMeters[index - 1];
      if (elevationChange > 0) ascentMeters += elevationChange;

      final grade = elevationChange / segmentDistanceMeters;
      final speedFactor = grade >= 0
          ? (1 - grade * 2.5).clamp(0.45, 1.0)
          : (1 + (-grade * 1.2)).clamp(1.0, 1.2);
      final segmentSpeedKmh = averageSpeedKmh * speedFactor;
      estimatedHours +=
          (distanceKm / (elevationsMeters.length - 1)) / segmentSpeedKmh;
    }

    final durationSeconds = math.max(60, (estimatedHours * 3600).round());
    return EtaEstimate(
      distanceKm: distanceKm,
      ascentMeters: ascentMeters,
      averageSpeedKmh: averageSpeedKmh,
      duration: Duration(seconds: durationSeconds),
    );
  }

  void close() {
    _client.close();
  }
}
