import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/alarm_preset.dart';
import '../providers/app_state.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Scaffold(
      backgroundColor: const Color(0xFF09090B), // zinc-950
      appBar: AppBar(
        backgroundColor: const Color(0xFF09090B),
        elevation: 0,
        title: const Text(
          'Ajustes y Perfil Ciclista',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        children: [
          // Tarjeta de Perfil y Bicicleta
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF18181B), // zinc-900
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: const Color(0xFFF97316),
                  child: Text(
                    appState.userInitials,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appState.userName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        appState.bikeModel,
                        style: const TextStyle(color: Color(0xFFF97316), fontSize: 13),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Contacto SOS: ${appState.emergencyContact}',
                        style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Interruptor Modo Sigilo (Privacidad del Radar)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF18181B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: appState.trackingEnabled
                        ? const Color(0xFF22C55E).withValues(alpha: 0.15)
                        : Colors.grey.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    appState.trackingEnabled ? Icons.radar : Icons.visibility_off,
                    color: appState.trackingEnabled ? const Color(0xFF22C55E) : Colors.grey,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Radar Comunitario Visible',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        appState.trackingEnabled
                            ? 'Tu posición se comparte con otros ciclistas'
                            : 'Modo Sigilo activo (Navegas de incógnito)',
                        style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: appState.trackingEnabled,
                  activeColor: const Color(0xFFF97316),
                  onChanged: (val) {
                    appState.toggleTracking();
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // SELECTOR DE ALARMA DEL SISTEMA (Apple Radar, Samsung, Google Pixel)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Tono de Alarma del Sistema (Auto-Boost)',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  '100% VOLUMEN',
                  style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'En caso de emergencia SOS, la app fuerza el volumen acústico al nivel máximo para alertar a tu entorno.',
            style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
          ),
          const SizedBox(height: 14),

          ...AlarmPresetConfig.presets.map((preset) {
            final isSelected = preset.id == appState.activeAlarm;
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF18181B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? const Color(0xFFF97316) : Colors.white10,
                  width: isSelected ? 1.5 : 1.0,
                ),
              ),
              child: ListTile(
                leading: Radio<AlarmPreset>(
                  value: preset.id,
                  groupValue: appState.activeAlarm,
                  activeColor: const Color(0xFFF97316),
                  onChanged: (val) {
                    if (val != null) appState.setActiveAlarm(val);
                  },
                ),
                title: Text(
                  preset.title,
                  style: TextStyle(
                    color: isSelected ? const Color(0xFFF97316) : Colors.white,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  ),
                ),
                subtitle: Text(
                  '${preset.manufacturer} • ${preset.subtitle}',
                  style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.volume_up_outlined, color: Colors.white70),
                  tooltip: 'Probar sonido',
                  onPressed: () {
                    appState.previewAlarmSound(preset.id);
                  },
                ),
                onTap: () {
                  appState.setActiveAlarm(preset.id);
                },
              ),
            );
          }),

          const SizedBox(height: 24),

          // Tarjeta de Permisos del Dispositivo
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF18181B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Estado de Sensores y Permisos',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 12),
                _buildPermissionRow('GPS de Alta Precisión', 'Activo (Rastreo cada 5m)', Icons.gps_fixed, true),
                _buildPermissionRow('Bloqueo de Suspensión (WakeLock)', 'Activo en Ruta', Icons.screen_lock_portrait, true),
                _buildPermissionRow('Vibración Háptica de Emergencia', 'Habilitada', Icons.vibration, true),
                _buildPermissionRow('Maximizador de Volumen Acústico', 'Boost Dinámico', Icons.volume_up, true),
              ],
            ),
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildPermissionRow(String title, String status, IconData icon, bool ok) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Icon(icon, size: 18, color: ok ? const Color(0xFF10B981) : Colors.grey),
          const SizedBox(width: 10),
          Expanded(
            child: Text(title, style: const TextStyle(color: Colors.white, fontSize: 13)),
          ),
          Text(status, style: TextStyle(color: ok ? const Color(0xFF10B981) : Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }
}
