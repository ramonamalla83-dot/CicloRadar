import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

typedef RegistrationSubmit = Future<void> Function({
  required String phone,
  required String name,
  required String bikeType,
  required String experienceLevel,
});

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({required this.onComplete, super.key});

  final RegistrationSubmit onComplete;

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  final _nameController = TextEditingController();

  int _step = 0;
  String _bikeType = 'MTB';
  String _experienceLevel = 'Intermedio';
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _continue() async {
    if (!_formKey.currentState!.validate()) return;

    if (_step < 2) {
      setState(() {
        _step++;
        _errorMessage = null;
      });
      return;
    }

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      await widget.onComplete(
        phone: _phoneController.text.trim(),
        name: _nameController.text.trim(),
        bikeType: _bikeType,
        experienceLevel: _experienceLevel,
      );
      if (mounted) {
        setState(() => _isSaving = false);
      }
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'No se pudo guardar el registro. $error';
        _isSaving = false;
      });
    }
  }

  InputDecoration _inputDecoration({
    required String label,
    required IconData icon,
  }) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: Colors.white54),
      filled: true,
      fillColor: const Color(0xFF18181B),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFF3F3F46)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFF3F3F46)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.5),
      ),
    );
  }

  String get _title => switch (_step) {
        0 => 'Tu número',
        1 => 'Verificar código',
        _ => 'Tu perfil',
      };

  String get _description => switch (_step) {
        0 => 'Ingresa tu teléfono para comenzar',
        1 => 'Código de verificación para ${_phoneController.text.trim()}',
        _ => 'Completa tus datos ciclistas',
      };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF97316).withValues(alpha: 0.16),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.directions_bike,
                      size: 34,
                      color: Color(0xFFF97316),
                    ),
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    'CicloRadar',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: List.generate(
                      3,
                      (index) => Expanded(
                        child: Container(
                          height: 4,
                          margin: EdgeInsets.only(right: index == 2 ? 0 : 8),
                          decoration: BoxDecoration(
                            color: index <= _step
                                ? const Color(0xFFF97316)
                                : const Color(0xFF27272A),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    _title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _description,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white60, fontSize: 14),
                  ),
                  const SizedBox(height: 24),
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (_step == 0) _buildPhoneField(),
                        if (_step == 1) _buildCodeField(),
                        if (_step == 2) ...[
                          TextFormField(
                            controller: _nameController,
                            textCapitalization: TextCapitalization.words,
                            textInputAction: TextInputAction.next,
                            decoration: _inputDecoration(
                              label: 'Nombre completo',
                              icon: Icons.person_outline,
                            ),
                            validator: (value) =>
                                value == null || value.trim().isEmpty
                                    ? 'Ingresa tu nombre.'
                                    : null,
                          ),
                          const SizedBox(height: 14),
                          DropdownButtonFormField<String>(
                            initialValue: _bikeType,
                            decoration: _inputDecoration(
                              label: 'Tipo de bicicleta',
                              icon: Icons.pedal_bike,
                            ),
                            items: const [
                              DropdownMenuItem(
                                  value: 'MTB',
                                  child: Text('Mountain Bike (MTB)')),
                              DropdownMenuItem(
                                  value: 'Ruta',
                                  child: Text('Bicicleta de Ruta')),
                              DropdownMenuItem(
                                  value: 'Urbana',
                                  child: Text('Bicicleta Urbana')),
                              DropdownMenuItem(
                                  value: 'Gravel', child: Text('Gravel')),
                            ],
                            onChanged: (value) {
                              if (value != null) {
                                setState(() => _bikeType = value);
                              }
                            },
                          ),
                          const SizedBox(height: 14),
                          DropdownButtonFormField<String>(
                            initialValue: _experienceLevel,
                            decoration: _inputDecoration(
                              label: 'Nivel de experiencia',
                              icon: Icons.flag_outlined,
                            ),
                            items: const [
                              DropdownMenuItem(
                                  value: 'Principiante',
                                  child: Text('Principiante')),
                              DropdownMenuItem(
                                  value: 'Intermedio',
                                  child: Text('Intermedio')),
                              DropdownMenuItem(
                                  value: 'Avanzado',
                                  child: Text('Avanzado / Pro')),
                            ],
                            onChanged: (value) {
                              if (value != null) {
                                setState(() => _experienceLevel = value);
                              }
                            },
                          ),
                        ],
                        if (_step == 1) ...[
                          const SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.amber.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: Colors.amber.withValues(alpha: 0.3),
                              ),
                            ),
                            child: const Text(
                              'La verificación por SMS aún no está conectada. Este paso es una demostración: ingresa cualquier código de 6 dígitos.',
                              style: TextStyle(
                                color: Colors.amber,
                                fontSize: 12,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                        if (_errorMessage != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            _errorMessage!,
                            style: const TextStyle(color: Colors.redAccent),
                          ),
                        ],
                        const SizedBox(height: 20),
                        SizedBox(
                          height: 52,
                          child: FilledButton.icon(
                            onPressed: _isSaving ? null : _continue,
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFFF97316),
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            icon: _isSaving
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.black,
                                    ),
                                  )
                                : Icon(_step == 2
                                    ? Icons.directions_bike
                                    : Icons.arrow_forward),
                            label: Text(
                              _isSaving
                                  ? 'Guardando…'
                                  : _step == 2
                                      ? 'Comenzar a rodar'
                                      : 'Continuar',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        if (_step > 0) ...[
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: _isSaving
                                ? null
                                : () => setState(() {
                                      _step--;
                                      _errorMessage = null;
                                    }),
                            child: const Text('Volver'),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPhoneField() {
    return TextFormField(
      controller: _phoneController,
      keyboardType: TextInputType.phone,
      textInputAction: TextInputAction.done,
      decoration: _inputDecoration(
        label: 'Teléfono',
        icon: Icons.phone_outlined,
      ).copyWith(hintText: '+54 11 1234-5678'),
      validator: (value) {
        final phone = value?.trim() ?? '';
        final digits = phone.replaceAll(RegExp(r'\D'), '');
        return digits.length < 7
            ? 'Ingresa un número de teléfono válido.'
            : null;
      },
    );
  }

  Widget _buildCodeField() {
    return TextFormField(
      controller: _codeController,
      keyboardType: TextInputType.number,
      textInputAction: TextInputAction.done,
      textAlign: TextAlign.center,
      maxLength: 6,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      decoration: _inputDecoration(
        label: 'Código de 6 dígitos',
        icon: Icons.verified_user_outlined,
      ).copyWith(counterText: ''),
      validator: (value) => value == null || !RegExp(r'^\d{6}$').hasMatch(value)
          ? 'Ingresa los 6 dígitos del código.'
          : null,
    );
  }
}
