import 'package:flutter/widgets.dart';

class AdvancedNightModeFilter extends StatelessWidget {
  const AdvancedNightModeFilter({
    super.key,
    required this.enabled,
    required this.child,
  });

  final bool enabled;
  final Widget child;

  static const ColorFilter _dimFilter = ColorFilter.matrix([
    0.84,
    0,
    0,
    0,
    0,
    0,
    0.84,
    0,
    0,
    0,
    0,
    0,
    0.84,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ]);

  @override
  Widget build(BuildContext context) {
    if (!enabled) return child;
    return ColorFiltered(
      colorFilter: _dimFilter,
      child: child,
    );
  }
}
