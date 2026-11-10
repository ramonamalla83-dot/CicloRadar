import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

import '../models/weather_forecast.dart';

class WeatherServiceException implements Exception {
  const WeatherServiceException(this.message);

  final String message;

  @override
  String toString() => message;
}

class WeatherService {
  WeatherService({http.Client? client}) : _client = client ?? http.Client();

  static const String _host = 'api.open-meteo.com';

  static const Map<String, String> _forecastParameters = {
    'hourly': 'weather_code,wind_gusts_10m,precipitation_probability',
    'wind_speed_unit': 'kmh',
    'timezone': 'auto',
    'timeformat': 'unixtime',
    'forecast_hours': '6',
  };

  final http.Client _client;

  Future<WeatherForecast> getForecast(LatLng location) async {
    final uri = Uri.https(_host, '/v1/forecast', {
      ..._forecastParameters,
      'latitude': location.latitude.toString(),
      'longitude': location.longitude.toString(),
    });

    late final http.Response response;
    try {
      response = await _client.get(uri).timeout(const Duration(seconds: 10));
    } on TimeoutException {
      throw const WeatherServiceException(
          'La consulta del clima tardó demasiado.');
    } on http.ClientException {
      throw const WeatherServiceException(
          'No se pudo conectar con el servicio del clima.');
    }

    if (response.statusCode != 200) {
      throw WeatherServiceException(
        'El servicio del clima respondió con el código ${response.statusCode}.',
      );
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException(
          'La respuesta del clima no tiene el formato esperado.');
    }
    return WeatherForecast.fromOpenMeteoJson(decoded);
  }

  void close() {
    _client.close();
  }
}
