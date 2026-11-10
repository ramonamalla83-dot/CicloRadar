class WeatherForecast {
  const WeatherForecast({
    required this.maxWindGustKmh,
    required this.maxPrecipitationProbability,
    required this.hasThunderstorm,
  });

  static const double strongWindThresholdKmh = 40;

  final double maxWindGustKmh;
  final int maxPrecipitationProbability;
  final bool hasThunderstorm;

  bool get hasStrongWind => maxWindGustKmh >= strongWindThresholdKmh;

  factory WeatherForecast.fromOpenMeteoJson(
    Map<String, dynamic> json, {
    DateTime? now,
  }) {
    final hourly = json['hourly'];
    if (hourly is! Map<String, dynamic>) {
      throw const FormatException(
          'La respuesta del clima no incluye datos horarios.');
    }

    final times = hourly['time'];
    final weatherCodes = hourly['weather_code'];
    final windGusts = hourly['wind_gusts_10m'];
    final precipitation = hourly['precipitation_probability'];
    if (times is! List ||
        weatherCodes is! List ||
        windGusts is! List ||
        precipitation is! List ||
        times.isEmpty ||
        times.length != weatherCodes.length ||
        times.length != windGusts.length ||
        times.length != precipitation.length) {
      throw const FormatException(
          'Los datos horarios del clima no son válidos.');
    }

    final currentHour = now ?? DateTime.now().toUtc();
    final start = DateTime.utc(
      currentHour.year,
      currentHour.month,
      currentHour.day,
      currentHour.hour,
    );
    final end = start.add(const Duration(hours: 3));
    var maxWindGustKmh = 0.0;
    var maxPrecipitationProbability = 0;
    var hasThunderstorm = false;
    var foundForecastHour = false;

    for (var index = 0; index < times.length; index++) {
      final timestamp = times[index];
      final weatherCode = weatherCodes[index];
      final windGust = windGusts[index];
      final precipitationProbability = precipitation[index];
      if (timestamp is! num ||
          weatherCode is! num ||
          windGust is! num ||
          precipitationProbability is! num) {
        throw const FormatException('Un valor horario del clima no es válido.');
      }

      final forecastTime = DateTime.fromMillisecondsSinceEpoch(
          timestamp.toInt() * 1000,
          isUtc: true);
      if (forecastTime.isBefore(start) || forecastTime.isAfter(end)) {
        continue;
      }

      foundForecastHour = true;
      if (windGust.toDouble() > maxWindGustKmh) {
        maxWindGustKmh = windGust.toDouble();
      }
      if (precipitationProbability.toInt() > maxPrecipitationProbability) {
        maxPrecipitationProbability = precipitationProbability.toInt();
      }
      final code = weatherCode.toInt();
      if (code == 95 || code == 96 || code == 99) {
        hasThunderstorm = true;
      }
    }

    if (!foundForecastHour) {
      throw const FormatException(
          'No hay pronóstico disponible para las próximas horas.');
    }

    return WeatherForecast(
      maxWindGustKmh: maxWindGustKmh,
      maxPrecipitationProbability: maxPrecipitationProbability,
      hasThunderstorm: hasThunderstorm,
    );
  }
}
