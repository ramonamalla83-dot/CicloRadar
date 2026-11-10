enum MapLayerType {
  streets,
  dark,
  satellite,
  terrain,
}

class MapLayerConfig {
  final MapLayerType type;
  final String name;
  final String description;
  final String urlTemplate;
  final List<String> subdomains;

  const MapLayerConfig({
    required this.type,
    required this.name,
    required this.description,
    required this.urlTemplate,
    this.subdomains = const ['a', 'b', 'c'],
  });

  static const List<MapLayerConfig> allLayers = [
    MapLayerConfig(
      type: MapLayerType.streets,
      name: 'Calles (Día)',
      description: 'OpenStreetMap de alta visibilidad diurna',
      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: [],
    ),
    MapLayerConfig(
      type: MapLayerType.dark,
      name: 'Oscuro (Noche)',
      description: 'CartoDB Dark para conducción nocturna',
      urlTemplate: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c', 'd'],
    ),
    MapLayerConfig(
      type: MapLayerType.satellite,
      name: 'Satélite',
      description: 'Imágenes aéreas de alta resolución',
      urlTemplate: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      subdomains: [],
    ),
    MapLayerConfig(
      type: MapLayerType.terrain,
      name: 'Relieve / Terreno',
      description: 'Curvas topográficas y elevación para rutas',
      urlTemplate: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      subdomains: [],
    ),
  ];

  static MapLayerConfig getByType(MapLayerType type) {
    return allLayers.firstWhere(
      (layer) => layer.type == type,
      orElse: () => allLayers[0],
    );
  }
}
