import 'package:cicloradar/models/safety_report.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('safety hazard categories have custom labels and icons', () {
    expect(SafetyHazardType.roadworks.label, 'Obras');
    expect(SafetyHazardType.pothole.label, 'Baches');
    expect(SafetyHazardType.dangerousRoute.label, 'Ruta peligrosa');
    expect(SafetyHazardType.obstacle.label, 'Obstáculo');
    expect(SafetyHazardType.roadworks.icon, isNotNull);
  });

  test('parses valid community reports and checks their expiry', () {
    final createdAt = DateTime(2026, 11, 6, 10);
    final expiresAt = createdAt.add(const Duration(hours: 24));
    final report = SafetyReport.fromMap('report-1', {
      'type': 'pothole',
      'latitude': -34.6,
      'longitude': -58.38,
      'createdAt': createdAt,
      'expiresAt': expiresAt,
    });

    expect(report.type, SafetyHazardType.pothole);
    expect(report.position.latitude, -34.6);
    expect(report.position.longitude, -58.38);
    expect(report.isActiveAt(expiresAt.subtract(const Duration(seconds: 1))),
        isTrue);
    expect(report.isActiveAt(expiresAt), isFalse);
  });

  test('rejects unknown categories and out-of-range coordinates', () {
    final createdAt = DateTime(2026, 11, 6, 10);
    final validData = <String, dynamic>{
      'type': 'roadworks',
      'latitude': 40.4,
      'longitude': -3.7,
      'createdAt': createdAt,
      'expiresAt': createdAt.add(const Duration(hours: 24)),
    };

    expect(
      () => SafetyReport.fromMap('report-1', {
        ...validData,
        'type': 'unknown',
      }),
      throwsFormatException,
    );
    expect(
      () => SafetyReport.fromMap('report-1', {
        ...validData,
        'latitude': 91,
      }),
      throwsFormatException,
    );
  });
}
