import 'dart:convert';

import 'package:cicloradar/services/eta_estimation_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:latlong2/latlong.dart';

void main() {
  test(
      'uses the elevation profile to calculate ascent and terrain-adjusted ETA',
      () {
    final flatEstimate = EtaEstimationService.calculate(
      distanceKm: 10,
      elevationsMeters: List<double>.filled(11, 100),
      averageSpeedKmh: 20,
    );
    final uphillEstimate = EtaEstimationService.calculate(
      distanceKm: 10,
      elevationsMeters: List<double>.generate(11, (index) => index * 10),
      averageSpeedKmh: 20,
    );

    expect(flatEstimate.ascentMeters, 0);
    expect(flatEstimate.duration.inMinutes, 30);
    expect(uphillEstimate.ascentMeters, 100);
    expect(
      uphillEstimate.duration.inSeconds,
      greaterThan(flatEstimate.duration.inSeconds),
    );
  });

  test('loads terrain elevations for points between origin and destination',
      () async {
    Uri? requestedUri;
    final client = MockClient((request) async {
      requestedUri = request.url;
      return http.Response(
        jsonEncode({'elevation': List<double>.filled(11, 50)}),
        200,
      );
    });
    final service = EtaEstimationService(client: client);

    final estimate = await service.estimate(
      origin: const LatLng(40.4, -3.7),
      destination: const LatLng(40.5, -3.6),
      averageSpeedKmh: 16.7,
    );

    expect(requestedUri?.path, '/v1/elevation');
    expect(
        requestedUri?.queryParameters['latitude']?.split(','), hasLength(11));
    expect(estimate.averageSpeedKmh, 16.7);
    expect(estimate.ascentMeters, 0);
    service.close();
  });

  test('rejects destinations that are too close to the origin', () async {
    final service = EtaEstimationService(
      client: MockClient((_) async => http.Response('{}', 200)),
    );

    await expectLater(
      service.estimate(
        origin: const LatLng(40.4, -3.7),
        destination: const LatLng(40.4001, -3.7),
        averageSpeedKmh: 16.7,
      ),
      throwsA(isA<EtaEstimationException>()),
    );
    service.close();
  });
}
