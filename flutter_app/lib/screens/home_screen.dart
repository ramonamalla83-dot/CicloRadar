import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

const _orange = Color(0xFFF97316);
const _surface = Color(0xFF18181B);
const _muted = Color(0xFFA1A1AA);

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static const _weeklyDistance = [11.3, 0.0, 18.6, 8.2, 0.0, 24.3, 13.1];
  static const _days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  static const _recentRides = [
    _RideExample('Vuelta por el río', 'Hoy · 08:15', '13,1 km', '48 min'),
    _RideExample('Parque y ciclovía', 'Ayer · 17:40', '24,3 km', '1 h 26 min'),
    _RideExample('Circuito urbano', 'Hace 3 días', '18,6 km', '1 h 07 min'),
  ];
  static const _savedRoutes = [
    _RouteExample('Costanera tranquila', 'Familiar · Poco tráfico', '12,4 km'),
    _RouteExample('Vuelta al parque', 'Mixta · Circular', '8,6 km'),
    _RouteExample('Camino del mirador', 'Gravel · Desnivel medio', '21,2 km'),
  ];

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final firstName = appState.userName.trim().split(RegExp(r'\s+')).first;

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF09090B),
        title:
            const Text('Inicio', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: CircleAvatar(
              radius: 19,
              backgroundColor: _orange.withValues(alpha: 0.18),
              child: Text(
                appState.userInitials,
                style: const TextStyle(
                  color: _orange,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final horizontalPadding = constraints.maxWidth > 700 ? 32.0 : 16.0;
          final contentWidth = constraints.maxWidth - horizontalPadding * 2;
          return ListView(
            padding: EdgeInsets.fromLTRB(
                horizontalPadding, 8, horizontalPadding, 28),
            children: [
              Text(
                '¡Hola, $firstName!',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Este es el resumen de tu actividad ciclista.',
                style: TextStyle(color: _muted, fontSize: 14),
              ),
              const SizedBox(height: 18),
              const _DemoNotice(),
              const SizedBox(height: 16),
              _WeeklyActivityCard(
                width: contentWidth,
                values: _weeklyDistance,
                days: _days,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _MetricCard(
                    width: (contentWidth - 12) / 2,
                    icon: Icons.timer_outlined,
                    title: 'Tiempo total',
                    value: '4 h 32 min',
                    detail: 'Esta semana',
                    color: const Color(0xFF38BDF8),
                  ),
                  _MetricCard(
                    width: (contentWidth - 12) / 2,
                    icon: Icons.bookmark_border,
                    title: 'Rutas guardadas',
                    value: '4',
                    detail: 'En tu colección',
                    color: const Color(0xFFA78BFA),
                  ),
                ],
              ),
              const SizedBox(height: 26),
              const _SectionHeader(
                  title: 'Actividad reciente', trailing: 'Esta semana'),
              const SizedBox(height: 10),
              ..._recentRides.map((ride) => _RideTile(ride: ride)),
              const SizedBox(height: 24),
              const _SectionHeader(
                  title: 'Rutas guardadas', trailing: '4 en total'),
              const SizedBox(height: 10),
              ..._savedRoutes.map((route) => _RouteTile(route: route)),
              const SizedBox(height: 12),
              SizedBox(
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: () => appState.setScreenIndex(1),
                  icon: const Icon(Icons.map_outlined),
                  label: const Text('Abrir radar del mapa'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _orange,
                    side: BorderSide(color: _orange.withValues(alpha: 0.55)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _DemoNotice extends StatelessWidget {
  const _DemoNotice();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: const Color(0xFF27272A),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, color: _orange, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Vista de ejemplo. La app todavía no registra recorridos GPS ni guarda rutas reales.',
              style: TextStyle(
                  color: Color(0xFFD4D4D8), fontSize: 12, height: 1.4),
            ),
          ),
          SizedBox(width: 8),
          Text(
            'DEMO',
            style: TextStyle(
              color: _orange,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }
}

class _WeeklyActivityCard extends StatelessWidget {
  const _WeeklyActivityCard({
    required this.width,
    required this.values,
    required this.days,
  });

  final double width;
  final List<double> values;
  final List<String> days;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Kilómetros recorridos',
                  style: TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w600),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: _orange.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  '7 DÍAS',
                  style: TextStyle(
                    color: _orange,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '75,5',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 34,
                  fontWeight: FontWeight.bold,
                  height: 1,
                ),
              ),
              SizedBox(width: 7),
              Padding(
                padding: EdgeInsets.only(bottom: 3),
                child: Text('km esta semana', style: TextStyle(color: _muted)),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 116,
            width: double.infinity,
            child: CustomPaint(painter: _WeeklyChartPainter(values)),
          ),
          const SizedBox(height: 8),
          Row(
            children: days
                .map(
                  (day) => Expanded(
                    child: Text(
                      day,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: _muted, fontSize: 11),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _WeeklyChartPainter extends CustomPainter {
  const _WeeklyChartPainter(this.values);

  final List<double> values;

  @override
  void paint(Canvas canvas, Size size) {
    const topPadding = 6.0;
    const bottomPadding = 4.0;
    final chartHeight = size.height - topPadding - bottomPadding;
    final maxValue = values.reduce((a, b) => a > b ? a : b);
    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..strokeWidth = 1;
    final barPaint = Paint()..style = PaintingStyle.fill;

    for (var line = 0; line < 4; line++) {
      final y = topPadding + chartHeight * line / 3;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final slotWidth = size.width / values.length;
    for (var i = 0; i < values.length; i++) {
      if (values[i] == 0) continue;
      final barHeight = (values[i] / maxValue) * (chartHeight - 8);
      final left = i * slotWidth + slotWidth * 0.28;
      final top = topPadding + chartHeight - barHeight;
      barPaint.shader = LinearGradient(
        begin: Alignment.bottomCenter,
        end: Alignment.topCenter,
        colors: [
          _orange.withValues(alpha: 0.48),
          _orange,
        ],
      ).createShader(Rect.fromLTWH(left, top, slotWidth * 0.44, barHeight));
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(left, top, slotWidth * 0.44, barHeight),
          const Radius.circular(6),
        ),
        barPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _WeeklyChartPainter oldDelegate) => false;
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.width,
    required this.icon,
    required this.title,
    required this.value,
    required this.detail,
    required this.color,
  });

  final double width;
  final IconData icon;
  final String title;
  final String value;
  final String detail;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 21),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(color: _muted, fontSize: 12)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 19,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 3),
          Text(detail, style: const TextStyle(color: _muted, fontSize: 11)),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.trailing});

  final String title;
  final String trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Text(trailing, style: const TextStyle(color: _muted, fontSize: 12)),
      ],
    );
  }
}

class _RideExample {
  const _RideExample(this.name, this.when, this.distance, this.duration);

  final String name;
  final String when;
  final String distance;
  final String duration;
}

class _RideTile extends StatelessWidget {
  const _RideTile({required this.ride});

  final _RideExample ride;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: _orange.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(Icons.directions_bike, color: _orange, size: 21),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(ride.name,
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600)),
                const SizedBox(height: 3),
                Text(ride.when,
                    style: const TextStyle(color: _muted, fontSize: 12)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(ride.distance,
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold)),
              const SizedBox(height: 3),
              Text(ride.duration,
                  style: const TextStyle(color: _muted, fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }
}

class _RouteExample {
  const _RouteExample(this.name, this.description, this.distance);

  final String name;
  final String description;
  final String distance;
}

class _RouteTile extends StatelessWidget {
  const _RouteTile({required this.route});

  final _RouteExample route;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        children: [
          const Icon(Icons.bookmark, color: Color(0xFFA78BFA), size: 21),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(route.name,
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600)),
                const SizedBox(height: 3),
                Text(route.description,
                    style: const TextStyle(color: _muted, fontSize: 12)),
              ],
            ),
          ),
          Text(route.distance,
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
