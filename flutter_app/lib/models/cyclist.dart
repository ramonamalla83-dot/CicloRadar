import 'package:latlong2/latlong.dart';

class Cyclist {
  final String id;
  final String name;
  final String initials;
  final double distanceKm;
  final LatLng position;
  final bool isEmergency;
  final String lastSeen;
  final String bikeModel;
  final int batteryLevel;

  const Cyclist({
    required this.id,
    required this.name,
    required this.initials,
    required this.distanceKm,
    required this.position,
    this.isEmergency = false,
    required this.lastSeen,
    required this.bikeModel,
    this.batteryLevel = 85,
  });

  Cyclist copyWith({
    String? id,
    String? name,
    String? initials,
    double? distanceKm,
    LatLng? position,
    bool? isEmergency,
    String? lastSeen,
    String? bikeModel,
    int? batteryLevel,
  }) {
    return Cyclist(
      id: id ?? this.id,
      name: name ?? this.name,
      initials: initials ?? this.initials,
      distanceKm: distanceKm ?? this.distanceKm,
      position: position ?? this.position,
      isEmergency: isEmergency ?? this.isEmergency,
      lastSeen: lastSeen ?? this.lastSeen,
      bikeModel: bikeModel ?? this.bikeModel,
      batteryLevel: batteryLevel ?? this.batteryLevel,
    );
  }
}

class HeatmapCorridor {
  final String id;
  final String name;
  final String description;
  final List<LatLng> coordinates;
  final int dailyRiders;
  final double safetyScore; // 1.0 a 5.0

  const HeatmapCorridor({
    required this.id,
    required this.name,
    required this.description,
    required this.coordinates,
    required this.dailyRiders,
    required this.safetyScore,
  });
}

class CommunityData {
  static List<Cyclist> getInitialCyclists(LatLng userPos) {
    return [
      Cyclist(
        id: 'c1',
        name: 'Carlos Mendoza',
        initials: 'CM',
        distanceKm: 0.35,
        position: LatLng(userPos.latitude + 0.0022, userPos.longitude + 0.0018),
        lastSeen: 'En movimiento (24 km/h)',
        bikeModel: 'Trek Domane AL 3',
        batteryLevel: 92,
      ),
      Cyclist(
        id: 'c2',
        name: 'Lucía Fernández',
        initials: 'LF',
        distanceKm: 0.72,
        position: LatLng(userPos.latitude - 0.0035, userPos.longitude + 0.0041),
        lastSeen: 'Detenida en semáforo',
        bikeModel: 'Specialized Allez E5',
        batteryLevel: 78,
      ),
      Cyclist(
        id: 'c3',
        name: 'Mateo Rivas',
        initials: 'MR',
        distanceKm: 1.15,
        position: LatLng(userPos.latitude + 0.0061, userPos.longitude - 0.0032),
        lastSeen: 'Pedaleando hacia el norte',
        bikeModel: 'Giant Contend AR',
        batteryLevel: 64,
      ),
      Cyclist(
        id: 'c4',
        name: 'Valentina Soto',
        initials: 'VS',
        distanceKm: 1.48,
        position: LatLng(userPos.latitude - 0.0052, userPos.longitude - 0.0048),
        lastSeen: 'Corredor Parque Principal',
        bikeModel: 'Cannondale Synapse',
        batteryLevel: 88,
      ),
    ];
  }

  static List<HeatmapCorridor> getSampleCorridors(LatLng center) {
    return [
      HeatmapCorridor(
        id: 'corridor-1',
        name: 'Ciclovía Expresa Central',
        description: 'Vía segregada de alto flujo con iluminación LED',
        dailyRiders: 1420,
        safetyScore: 4.8,
        coordinates: [
          LatLng(center.latitude - 0.012, center.longitude - 0.008),
          LatLng(center.latitude - 0.006, center.longitude - 0.004),
          LatLng(center.latitude, center.longitude),
          LatLng(center.latitude + 0.008, center.longitude + 0.005),
          LatLng(center.latitude + 0.015, center.longitude + 0.011),
        ],
      ),
      HeatmapCorridor(
        id: 'corridor-2',
        name: 'Bulevar Costanera / Río',
        description: 'Corredor recreativo con asfalto renovado y bebederos',
        dailyRiders: 980,
        safetyScore: 4.6,
        coordinates: [
          LatLng(center.latitude - 0.008, center.longitude + 0.014),
          LatLng(center.latitude - 0.002, center.longitude + 0.010),
          LatLng(center.latitude + 0.005, center.longitude + 0.006),
          LatLng(center.latitude + 0.011, center.longitude + 0.002),
        ],
      ),
      HeatmapCorridor(
        id: 'corridor-3',
        name: 'Avenida Universitaria',
        description: 'Carril compartido con señalización luminosa',
        dailyRiders: 640,
        safetyScore: 4.1,
        coordinates: [
          LatLng(center.latitude + 0.010, center.longitude - 0.010),
          LatLng(center.latitude + 0.004, center.longitude - 0.005),
          LatLng(center.latitude, center.longitude),
          LatLng(center.latitude - 0.004, center.longitude + 0.006),
        ],
      ),
    ];
  }
}
