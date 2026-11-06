import 'dart:async';

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

import '../models/weather_forecast.dart';
import '../services/weather_service.dart';

class WeatherMapWidget extends StatefulWidget {
  const WeatherMapWidget({
    super.key,
    required this.location,
    this.service,
  });

  final LatLng? location;
  final WeatherService? service;

  @override
  State<WeatherMapWidget> createState() => _WeatherMapWidgetState();
}

class _WeatherMapWidgetState extends State<WeatherMapWidget> {
  static const double _refreshDistanceMeters = 500;
  static const Duration _refreshInterval = Duration(minutes: 20);

  late WeatherService _service;
  bool _ownsService = false;
  bool _isLoading = false;
  WeatherForecast? _forecast;
  String? _errorMessage;
  LatLng? _lastRequestedLocation;
  Timer? _refreshTimer;
  int _requestId = 0;

  @override
  void initState() {
    super.initState();
    _setService();
    _refreshTimer = Timer.periodic(_refreshInterval, (_) {
      if (widget.location != null) {
        unawaited(_loadForecast());
      }
    });
    if (widget.location != null) {
      unawaited(_loadForecast());
    }
  }

  @override
  void didUpdateWidget(covariant WeatherMapWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.service != widget.service) {
      if (_ownsService) {
        _service.close();
      }
      _setService();
      _forecast = null;
      _errorMessage = null;
      if (widget.location != null) {
        unawaited(_loadForecast());
      }
    }

    final location = widget.location;
    if (location != null && _shouldRefreshForLocation(location)) {
      unawaited(_loadForecast());
    }
  }

  bool _shouldRefreshForLocation(LatLng location) {
    final previous = _lastRequestedLocation;
    if (previous == null) return true;
    const distance = Distance();
    return distance.as(LengthUnit.Meter, previous, location) >=
        _refreshDistanceMeters;
  }

  void _setService() {
    _ownsService = widget.service == null;
    _service = widget.service ?? WeatherService();
  }

  Future<void> _loadForecast() async {
    final location = widget.location;
    if (location == null) return;

    final requestId = ++_requestId;
    _lastRequestedLocation = location;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final forecast = await _service.getForecast(location);
      if (!mounted || requestId != _requestId) return;
      setState(() {
        _forecast = forecast;
        _isLoading = false;
      });
    } on WeatherServiceException catch (error) {
      _setError(requestId, error.message);
    } on FormatException {
      _setError(requestId, 'La respuesta del clima no se pudo interpretar.');
    }
  }

  void _setError(int requestId, String message) {
    if (!mounted || requestId != _requestId) return;
    setState(() {
      _forecast = null;
      _errorMessage = message;
      _isLoading = false;
    });
  }

  @override
  void dispose() {
    _requestId++;
    _refreshTimer?.cancel();
    if (_ownsService) {
      _service.close();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final forecast = _forecast;
    final isStormRisk = forecast?.hasThunderstorm ?? false;
    final isWindRisk = forecast?.hasStrongWind ?? false;
    final riskColor = isStormRisk
        ? Colors.red.shade400
        : isWindRisk
            ? Colors.amber.shade400
            : const Color(0xFF34D399);
    final icon = isStormRisk
        ? Icons.thunderstorm
        : isWindRisk
            ? Icons.air
            : Icons.wb_sunny_outlined;
    final title = widget.location == null
        ? 'GPS no disponible'
        : _isLoading && forecast == null
            ? 'Consultando el clima...'
            : _errorMessage != null && forecast == null
                ? 'Clima no disponible'
                : isStormRisk
                    ? 'Riesgo de tormenta'
                    : isWindRisk
                        ? 'Viento fuerte'
                        : 'Sin riesgo importante';
    final details = widget.location == null
        ? 'Activa la ubicación para consultar el pronóstico.'
        : _errorMessage != null && forecast == null
            ? _errorMessage!
            : forecast == null
                ? 'Pronóstico de las próximas 3 horas.'
                : _forecastDetails(forecast);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: const Color(0xF209090B),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: (isStormRisk || isWindRisk) ? riskColor : Colors.white24,
          width: (isStormRisk || isWindRisk) ? 1.5 : 1,
        ),
        boxShadow: const [
          BoxShadow(
              color: Colors.black54, blurRadius: 12, offset: Offset(0, 3)),
        ],
      ),
      child: Row(
        children: [
          Icon(icon, color: riskColor, size: 25),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  details,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Open-Meteo · clima en tu posición; no cubre toda la ruta.',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.white54, fontSize: 10),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: widget.location == null || _isLoading
                ? null
                : () => unawaited(_loadForecast()),
            tooltip: 'Actualizar clima',
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            padding: EdgeInsets.zero,
            icon: _isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white70,
                    ),
                  )
                : Icon(
                    Icons.refresh,
                    color: Colors.white70,
                    size: 20,
                  ),
          ),
        ],
      ),
    );
  }

  String _forecastDetails(WeatherForecast forecast) {
    final wind = forecast.maxWindGustKmh.round();
    final precipitation = forecast.maxPrecipitationProbability;
    if (forecast.hasThunderstorm && forecast.hasStrongWind) {
      return 'Tormenta y ráfagas de hasta $wind km/h';
    }
    if (forecast.hasThunderstorm) {
      return 'Tormenta posible · lluvia hasta $precipitation%';
    }
    if (forecast.hasStrongWind) {
      return 'Ráfagas de hasta $wind km/h en las próximas 3 h';
    }
    return 'Ráfagas hasta $wind km/h · lluvia hasta $precipitation%';
  }
}
