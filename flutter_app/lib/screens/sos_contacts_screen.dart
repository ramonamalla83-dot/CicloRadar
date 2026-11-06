import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/sos_contact.dart';
import '../providers/app_state.dart';

class SosContactsScreen extends StatefulWidget {
  const SosContactsScreen({super.key});

  @override
  State<SosContactsScreen> createState() => _SosContactsScreenState();
}

class _SosContactsScreenState extends State<SosContactsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _addContact() {
    if (!_formKey.currentState!.validate()) return;
    context.read<AppState>().addEmergencyContact(
          SosContact(
            id: DateTime.now().microsecondsSinceEpoch.toString(),
            name: _nameController.text.trim(),
            phone: _phoneController.text.trim(),
          ),
        );
    _nameController.clear();
    _phoneController.clear();
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final contacts = context.watch<AppState>().emergencyContacts;

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        title: const Text('Contactos SOS'),
        backgroundColor: const Color(0xFF09090B),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.amber.withValues(alpha: 0.35)),
            ),
            child: const Text(
              'Los contactos se guardan en este dispositivo. El SOS todavía no envía SMS ni comparte alertas: esta función es de configuración para pruebas.',
              style: TextStyle(color: Colors.amber, fontSize: 13),
            ),
          ),
          const SizedBox(height: 18),
          Form(
            key: _formKey,
            child: Column(
              children: [
                TextFormField(
                  controller: _nameController,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Nombre',
                    prefixIcon: Icon(Icons.person_outline),
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) =>
                      value == null || value.trim().isEmpty ? 'Ingresa un nombre.' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _addContact(),
                  decoration: const InputDecoration(
                    labelText: 'Teléfono',
                    prefixIcon: Icon(Icons.phone_outlined),
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) =>
                      value == null || value.trim().isEmpty ? 'Ingresa un teléfono.' : null,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton.icon(
                    onPressed: _addContact,
                    icon: const Icon(Icons.add),
                    label: const Text('Añadir contacto'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Contactos guardados (${contacts.length})',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
          ),
          const SizedBox(height: 10),
          if (contacts.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Text(
                'Todavía no agregaste contactos de emergencia.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white60),
              ),
            ),
          ...contacts.map(
            (contact) => Card(
              child: ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFF27272A),
                  child: Icon(Icons.person, color: Color(0xFFF97316)),
                ),
                title: Text(contact.name),
                subtitle: Text(contact.phone),
                trailing: IconButton(
                  tooltip: 'Eliminar contacto',
                  onPressed: () =>
                      context.read<AppState>().removeEmergencyContact(contact.id),
                  icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
