import 'package:cicloradar/models/sos_contact.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('normalizes E.164 contacts and excludes invalid or duplicate phones',
      () {
    final phones = normalizeSosRecipientPhones([
      const SosContact(
        id: 'one',
        name: 'Contacto uno',
        phone: '+54 (11) 1234-5678',
      ),
      const SosContact(
        id: 'two',
        name: 'Contacto repetido',
        phone: '+54 11 1234 5678',
      ),
      const SosContact(
        id: 'three',
        name: 'Teléfono sin código de país',
        phone: '11 1234-5678',
      ),
      const SosContact(
        id: 'four',
        name: 'Prefijo inválido',
        phone: '+0 11 1234-5678',
      ),
    ]);

    expect(phones, ['+541112345678']);
  });
}
