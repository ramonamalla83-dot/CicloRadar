import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:latlong2/latlong.dart';

import '../models/safety_report.dart';

class SafetyReportException implements Exception {
  const SafetyReportException(this.message);

  final String message;

  @override
  String toString() => message;
}

abstract interface class SafetyReportRepository {
  Stream<List<SafetyReport>> watchActiveReports();

  Future<void> createReport({
    required SafetyHazardType type,
    required LatLng position,
  });
}

class FirestoreSafetyReportService implements SafetyReportRepository {
  FirestoreSafetyReportService({
    FirebaseFirestore? firestore,
    FirebaseAuth? auth,
  })  : _firestore = firestore ?? FirebaseFirestore.instance,
        _auth = auth ?? FirebaseAuth.instance;

  static const String collectionName = 'safetyReports';

  final FirebaseFirestore _firestore;
  final FirebaseAuth _auth;

  @override
  Stream<List<SafetyReport>> watchActiveReports() {
    return _firestore
        .collection(collectionName)
        .where(
          'expiresAt',
          isGreaterThan: Timestamp.fromDate(DateTime.now()),
        )
        .limit(300)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map(
              (document) => SafetyReport.fromMap(
                document.id,
                _decodeDocument(document.data()),
              ),
            )
            .where((report) => report.isActiveAt(DateTime.now()))
            .toList(growable: false));
  }

  Map<String, dynamic> _decodeDocument(Map<String, dynamic> data) {
    final createdAt = data['createdAt'];
    final expiresAt = data['expiresAt'];
    if (createdAt is! Timestamp || expiresAt is! Timestamp) {
      throw const FormatException(
        'El reporte recibido no incluye marcas de tiempo válidas.',
      );
    }
    return {
      ...data,
      'createdAt': createdAt.toDate(),
      'expiresAt': expiresAt.toDate(),
    };
  }

  @override
  Future<void> createReport({
    required SafetyHazardType type,
    required LatLng position,
  }) async {
    if (_auth.currentUser == null) {
      throw const SafetyReportException(
        'Inicia sesión para compartir un reporte de seguridad.',
      );
    }
    if (!position.latitude.isFinite ||
        !position.longitude.isFinite ||
        position.latitude < -90 ||
        position.latitude > 90 ||
        position.longitude < -180 ||
        position.longitude > 180) {
      throw const SafetyReportException(
        'La ubicación seleccionada no es válida.',
      );
    }

    final now = DateTime.now();
    try {
      await _firestore.collection(collectionName).add({
        'type': type.name,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'createdAt': FieldValue.serverTimestamp(),
        'expiresAt': Timestamp.fromDate(now.add(const Duration(hours: 24))),
      });
    } on FirebaseException catch (error) {
      throw SafetyReportException(
        'No se pudo compartir el reporte (${error.code}): '
        '${error.message ?? 'error desconocido'}.',
      );
    }
  }
}
