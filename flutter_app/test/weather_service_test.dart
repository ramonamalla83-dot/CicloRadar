import 'dart:convert';

import 'package:cicloradar/models/weather_forecast.dart';
import 'package:cicloradar/services/weather_service.dart';
import 'package:cicloradar/widgets/weather_map_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:latlong2/latlong.dart';

void main() {
  test('detects thunderstorms and strong gusts in the next three hours', () {
    final now = DateTime.utc(2025, 1, 1, 12, 30);
    final forecast = WeatherForecast.fromOpenMeteoJson(
      _response(
        now,
        weatherCodes: [3, 95, 3, 3, 99, 3],
        windGusts: [10, 25, 45, 12, 90, 8],
        precipitation: [0, 70, 10, 0, 100, 0],
      ),
      now: now,
    );

    expect(forecast.hasThunderstorm, isTrue);
    expect(forecast.hasStrongWind, isTrue);
    expect(forecast.maxWindGustKmh, 45);
    expect(forecast.maxPrecipitationProbability, 70);
  });

  test('does not warn about thunderstorms or strong wind below thresholds', () {
    final now = DateTime.utc(2025, 1, 1, 12, 30);
    final forecast = WeatherForecast.fromOpenMeteoJson(
      _response(
        now,
        weatherCodes: [3, 61, 2, 2, 95, 2],
        windGusts: [10, 25, 39, 12, 90, 8],
        precipitation: [0, 70, 10, 0, 100, 0],
      ),
      now: now,
    );

    expect(forecast.hasThunderstorm, isFalse);
    expect(forecast.hasStrongWind, isFalse);
    expect(forecast.maxWindGustKmh, 39);
  });

  test('warns at the 40 km/h strong-wind threshold', () {
    const forecast = WeatherForecast(
      maxWindGustKmh: 40,
      maxPrecipitationProbability: 0,
      hasThunderstorm: false,
    );

    expect(forecast.hasStrongWind, isTrue);
  });

  test('requests the forecast using the verified location coordinates',
      () async {
    Uri? requestedUri;
    final service = WeatherService(
      client: MockClient((request) async {
        requestedUri = request.url;
        return http.Response(
          jsonEncode(
            _response(
              DateTime.now().toUtc(),
              weatherCodes: [1, 1, 1, 1, 1, 1],
              windGusts: [12, 15, 18, 12, 15, 18],
              precipitation: [0, 0, 0, 0, 0, 0],
            ),
          ),
          200,
        );
      }),
    );

    final forecast = await service.getForecast(const LatLng(40.4, -3.7));

    expect(requestedUri?.host, 'api.open-meteo.com');
    expect(requestedUri?.queryParameters['latitude'], '40.4');
    expect(requestedUri?.queryParameters['longitude'], '-3.7');
    expect(forecast.hasStrongWind, isFalse);
    service.close();
  });

  test('reports an invalid hourly response', () {
    expect(
      () => WeatherForecast.fromOpenMeteoJson({'hourly': {}}),
      throwsFormatException,
    );
  });

  testWidgets('shows weather warnings and route coverage limitation',
      (tester) async {
    final now = DateTime.now().toUtc();
    final service = WeatherService(
      client: MockClient((_) async {
        return http.Response(
          jsonEncode(
            _response(
              now,
              weatherCodes: [95, 3, 3, 3, 3, 3],
              windGusts: [52, 18, 15, 20, 12, 10],
              precipitation: [90, 20, 0, 0, 0, 0],
            ),
          ),
          200,
        );
      }),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WeatherMapWidget(
            location: const LatLng(40.4, -3.7),
            service: service,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Riesgo de tormenta'), findsOneWidget);
    expect(find.text('Tormenta y ráfagas de hasta 52 km/h'), findsOneWidget);
    expect(
      find.text('Open-Meteo · clima en tu posición; no cubre toda la ruta.'),
      findsOneWidget,
    );
    service.close();
  });
}

Map<String, dynamic> _response(
  DateTime now, {
  required List<int> weatherCodes,
  required List<double> windGusts,
  required List<int> precipitation,
}) {
  final currentHour = DateTime.utc(now.year, now.month, now.day, now.hour);
  return {
    'hourly': {
      'time': List.generate(
        6,
        (index) =>
            currentHour.add(Duration(hours: index)).millisecondsSinceEpoch ~/
            1000,
      ),
      'weather_code': weatherCodes,
      'wind_gusts_10m': windGusts,
      'precipitation_probability': precipitation,
    },
  };
}
