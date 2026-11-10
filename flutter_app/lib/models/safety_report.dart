import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

enum SafetyHazardType {
  roadworks,
  pothole,
  dangerousRoute,
  obstacle,
}

extension SafetyHazardTypePresentation on SafetyHazardType {
  String get label => switch (this) {
        SafetyHazardType.roadworks => 'Obras',
        SafetyHazardType.pothole => 'Baches',
        SafetyHazardType.dangerousRoute => 'Ruta peligrosa',
        SafetyHazardType.obstacle => 'Obstáculo',
      };

  IconData get icon => switch (this) {
        SafetyHazardType.roadworks => Icons.construction,
        SafetyHazardType.pothole => Icons.tire_repair,
        SafetyHazardType.dangerousRoute => Icons.warning_amber_rounded,
        SafetyHazardType.obstacle => Icons.block,
      };

  Color get color => switch (this) {
        SafetyHazardType.roadworks => const Color(0xFFF97316),
        SafetyHazardType.pothole => const Color(0xFFEAB308),
        SafetyHazardType.dangerousRoute => const Color(0xFFEF4444),
        SafetyHazardType.obstacle => const Color(0xFF38BDF8),
      };

  static SafetyHazardType fromValue(Object? value) {
    return SafetyHazardType.values.firstWhere(
      (type) => type.name == value,
      orElse: () => throw const FormatException(
        'El tipo del reporte de seguridad no es válido.',
      ),
    );
  }
}

class SafetyReport {
  const SafetyReport({
    required this.id,
    required this.type,
    required this.position,
    required this.createdAt,
    required this.expiresAt,
  });

  final String id;
  final SafetyHazardType type;
  final LatLng position;
  final DateTime createdAt;
  final DateTime expiresAt;

  bool isActiveAt(DateTime time) => expiresAt.isAfter(time);

  factory SafetyReport.fromMap(String id, Map<String, dynamic> data) {
    final latitude = data['latitude'];
    final longitude = data['longitude'];
    final createdAt = data['createdAt'];
    final expiresAt = data['expiresAt'];
    if (latitude is! num ||
        longitude is! num ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180 ||
        createdAt is! DateTime ||
        expiresAt is! DateTime) {
      throw const FormatException(
        'Los datos del reporte de seguridad no son válidos.',
      );
    }

    return SafetyReport(
      id: id,
      type: SafetyHazardTypePresentation.fromValue(data['type']),
      position: LatLng(latitude.toDouble(), longitude.toDouble()),
      createdAt: createdAt,
      expiresAt: expiresAt,
    );
  }
}
