import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/alarm_preset.dart';
import '../providers/app_state.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _editProfile(BuildContext context, AppState appState) async {
    final nameController = TextEditingController(text: appState.userName);
    final bikeController = TextEditingController(text: appState.bikeModel);
    final formKey = GlobalKey<FormState>();
    final shouldSave = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Editar perfil'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Nombre'),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Ingresa tu nombre.'
                    : null,
              ),
              TextFormField(
                controller: bikeController,
                decoration: const InputDecoration(labelText: 'Bicicleta'),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Ingresa el modelo de tu bicicleta.'
                    : null,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () {
              if (formKey.currentState!.validate()) {
                Navigator.pop(dialogContext, true);
              }
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    );

    if (shouldSave == true) {
      appState.updateProfile(
        name: nameController.text,
        bikeModel: bikeController.text,
      );
    }
    nameController.dispose();
    bikeController.dispose();
  }

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
                IconButton(
                  tooltip: 'Editar perfil',
                  onPressed: () => _editProfile(context, appState),
                  icon: const Icon(Icons.edit_outlined),
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
                            ? 'Visibilidad habilitada; la comunidad es de ejemplo por ahora'
                            : 'Modo Sigilo activo (Navegas de incógnito)',
                        style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: appState.trackingEnabled,
                  activeThumbColor: const Color(0xFFF97316),
                  onChanged: (val) {
                    appState.toggleTracking();
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Material(
            color: const Color(0xFF18181B),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: Colors.white10),
            ),
            clipBehavior: Clip.antiAlias,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: appState.sosPushConfigured &&
                        appState.sosAlertNotificationsEnabled,
                    onChanged: appState.sosPushConfigured
                        ? (enabled) async {
                            try {
                              await appState
                                  .setSosAlertNotificationsEnabled(enabled);
                            } catch (error) {
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(error.toString())),
                              );
                            }
                          }
                        : null,
                    activeThumbColor: const Color(0xFFF97316),
                    secondary: const Icon(
                      Icons.notifications_active_outlined,
                      color: Color(0xFFF97316),
                    ),
                    title: const Text(
                      'Notificaciones SOS en este dispositivo y cercanas',
                      style: TextStyle(color: Colors.white, fontSize: 14),
                    ),
                    subtitle: Text(
                      appState.sosPushConfigured
                          ? 'Activa las notificaciones y comparte GPS solo mientras usas la app para avisos a 10 km.'
                          : 'Pendiente de configurar Firebase y el servicio de notificaciones.',
                      style:
                          TextStyle(color: Colors.grey.shade400, fontSize: 12),
                    ),
                  ),
                  if (appState.sosPushStatus != null) ...[
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        appState.sosPushStatus!,
                        style: TextStyle(
                          color: appState.sosPushConfigured
                              ? Colors.grey.shade400
                              : Colors.amber.shade300,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // SELECTOR DE ALARMA DEL SISTEMA (Apple Radar, Samsung, Google Pixel)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Tono de alarma SOS',
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
                  'AUDIO AL 100%',
                  style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'En caso de emergencia, la app reproduce la alarma al máximo nivel del reproductor. El volumen físico depende del dispositivo.',
            style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
          ),
          const SizedBox(height: 14),

          RadioGroup<AlarmPreset>(
            groupValue: appState.activeAlarm,
            onChanged: (preset) {
              if (preset != null) appState.setActiveAlarm(preset);
            },
            child: Column(
              children: AlarmPresetConfig.presets.map((preset) {
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
                    leading: Radio<AlarmPreset>(value: preset.id),
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
              }).toList(),
            ),
          ),

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
                _buildPermissionRow('GPS', 'Madrid si falta permiso o señal', Icons.gps_fixed, false),
                _buildPermissionRow('Wake Lock', 'Se intenta durante la alarma', Icons.screen_lock_portrait, false),
                _buildPermissionRow('Vibración', 'Solo en equipos compatibles', Icons.vibration, false),
                _buildPermissionRow('Audio SOS', 'No controla el volumen físico', Icons.volume_up, false),
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
