import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../models/cyclist.dart';
import '../models/map_layer.dart';
import '../providers/app_state.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();

  void _recenterMap(LatLng target) {
    _mapController.move(target, 15.0);
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final activeConfig = MapLayerConfig.getByType(appState.activeLayer);

    return Stack(
      children: [
        // 1. MAPA INTERACTIVO FLUTTER_MAP
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: appState.userLocation,
            initialZoom: 15.0,
            minZoom: 4.0,
            maxZoom: 19.0,
          ),
          children: [
            // Capa ráster activa (Calles día, Carto dark noche, Google Satélite, Google Relieve)
            TileLayer(
              urlTemplate: activeConfig.urlTemplate,
              subdomains: activeConfig.subdomains,
              userAgentPackageName: 'com.cicloradar.app',
            ),

            // Capa de calor de rutas ciclistas (Heatmap corridors)
            if (appState.heatmapEnabled) ...[
              PolylineLayer(
                polylines: appState.corridors.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final corridor = entry.value;
                  // Gradiente térmico según densidad
                  final colors = [
                    const Color(0xFF10B981).withValues(alpha: 0.8), // Esmeralda
                    const Color(0xFF06B6D4).withValues(alpha: 0.8), // Cian
                    const Color(0xFFF59E0B).withValues(alpha: 0.85), // Ámbar
                  ];
                  return Polyline(
                    points: corridor.coordinates,
                    strokeWidth: 6.0,
                    color: colors[idx % colors.length],
                  );
                }).toList(),
              ),
            ],

            // Marcadores de comunidad y usuario
            MarkerLayer(
              markers: [
                // Marcador del usuario actual
                Marker(
                  point: appState.userLocation,
                  width: 50,
                  height: 50,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFFF97316).withValues(alpha: 0.25),
                          border: Border.all(color: const Color(0xFFF97316), width: 2),
                        ),
                      ),
                      Container(
                        width: 28,
                        height: 28,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFF97316), // orange-500
                        ),
                        child: Icon(
                          appState.trackingEnabled ? Icons.directions_bike : Icons.visibility_off,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ],
                  ),
                ),

                // Marcadores de ciclistas cercanos
                ...appState.communityCyclists.map((cyclist) {
                  return Marker(
                    point: cyclist.position,
                    width: 46,
                    height: 46,
                    child: GestureDetector(
                      onTap: () {
                        _showCyclistDetails(context, cyclist);
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: cyclist.isEmergency
                              ? Colors.red
                              : const Color(0xFF27272A),
                          border: Border.all(
                            color: cyclist.isEmergency ? Colors.white : const Color(0xFFF97316),
                            width: 2,
                          ),
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black45,
                              blurRadius: 6,
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            cyclist.initials,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ],
        ),

        // 2. HEADER FLOTANTE CON RESUMEN DEL RADAR
        PositionSafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Indicador de Estado del Radar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF09090B).withValues(alpha: 0.90),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white12),
                    boxShadow: const [
                      BoxShadow(color: Colors.black45, blurRadius: 10),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 9,
                        height: 9,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: appState.trackingEnabled
                              ? const Color(0xFF22C55E)
                              : Colors.amber,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        appState.trackingEnabled
                            ? '${appState.communityCyclists.length} ciclistas activos'
                            : 'Modo Sigilo (Invisible)',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),

                // Botón de Selector de Capas Ráster
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF09090B).withValues(alpha: 0.90),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.layers_outlined, color: Colors.white, size: 20),
                    tooltip: 'Cambiar capa del mapa',
                    onPressed: () {
                      _showLayerSelectorModal(context, appState);
                    },
                  ),
                ),
              ],
            ),
          ),
        ),

        // 3. BARRA LATERAL FLOTANTE DE ACCIONES
        Positioned(
          right: 16,
          bottom: 100,
          child: Column(
            children: [
              // Botón Mapa de Calor (Toggle)
              FloatingActionButton.small(
                heroTag: 'fab_heatmap',
                backgroundColor: appState.heatmapEnabled
                    ? const Color(0xFFF97316)
                    : const Color(0xFF18181B),
                foregroundColor: Colors.white,
                onPressed: () {
                  appState.toggleHeatmap();
                },
                tooltip: 'Alternar mapa de calor',
                child: const Icon(Icons.local_fire_department, size: 22),
              ),
              const SizedBox(height: 12),

              // Botón Recentrar GPS
              FloatingActionButton.small(
                heroTag: 'fab_gps',
                backgroundColor: const Color(0xFF18181B),
                foregroundColor: Colors.white,
                onPressed: () {
                  _recenterMap(appState.userLocation);
                },
                tooltip: 'Recentrar GPS',
                child: const Icon(Icons.my_location, size: 20),
              ),
              const SizedBox(height: 16),

              // BOTÓN PRINCIPAL SOS DE EMERGENCIA
              FloatingActionButton.extended(
                heroTag: 'fab_sos',
                backgroundColor: Colors.red.shade700,
                foregroundColor: Colors.white,
                elevation: 8,
                onPressed: () {
                  appState.startSosCountdown();
                },
                icon: const Icon(Icons.sos, size: 24),
                label: const Text(
                  'SOS',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 1),
                ),
              ),
            ],
          ),
        ),

        // 4. ALERTA COMUNITARIA ENTRANTE (POPUP OVERLAY)
        if (appState.incomingEmergency != null) ...[
          Positioned(
            top: 70,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red.shade900,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: const [
                  BoxShadow(color: Colors.black87, blurRadius: 20),
                ],
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 32),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '¡EMERGENCIA: ${appState.incomingEmergency!.name}!',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          'A ${appState.incomingEmergency!.distanceKm} km • ${appState.incomingEmergency!.lastSeen}',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () {
                      appState.dismissIncomingEmergency();
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  void _showLayerSelectorModal(BuildContext context, AppState appState) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF18181B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Seleccionar Capa del Mapa',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              ...MapLayerConfig.allLayers.map((layer) {
                final isSelected = layer.type == appState.activeLayer;
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFFF97316).withValues(alpha: 0.2)
                          : const Color(0xFF27272A),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      layer.type == MapLayerType.streets
                          ? Icons.wb_sunny_outlined
                          : layer.type == MapLayerType.dark
                              ? Icons.nightlight_round
                              : layer.type == MapLayerType.satellite
                                  ? Icons.satellite_alt
                                  : Icons.terrain,
                      color: isSelected ? const Color(0xFFF97316) : Colors.white70,
                    ),
                  ),
                  title: Text(
                    layer.name,
                    style: TextStyle(
                      color: isSelected ? const Color(0xFFF97316) : Colors.white,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  subtitle: Text(
                    layer.description,
                    style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check_circle, color: Color(0xFFF97316))
                      : null,
                  onTap: () {
                    appState.setMapLayer(layer.type);
                    Navigator.pop(ctx);
                  },
                );
              }),
            ],
          ),
        );
      },
    );
  }

  void _showCyclistDetails(BuildContext context, Cyclist cyclist) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF18181B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: const Color(0xFFF97316),
                    radius: 22,
                    child: Text(
                      cyclist.initials,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        cyclist.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'A ${cyclist.distanceKm} km de tu posición',
                        style: const TextStyle(color: Color(0xFFF97316), fontSize: 13),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 18),
              _buildInfoRow(Icons.pedal_bike, 'Bicicleta', cyclist.bikeModel),
              _buildInfoRow(Icons.access_time, 'Estado', cyclist.lastSeen),
              _buildInfoRow(Icons.battery_charging_full, 'Batería del Radar', '${cyclist.batteryLevel}%'),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey.shade400),
          const SizedBox(width: 10),
          Text('$label: ', style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }
}

class PositionSafeArea extends StatelessWidget {
  final Widget child;
  const PositionSafeArea({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 8,
      left: 0,
      right: 0,
      child: child,
    );
  }
}
