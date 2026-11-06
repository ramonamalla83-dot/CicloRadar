class SosContact {
  final String id;
  final String name;
  final String phone;

  String? get normalizedPhone {
    final normalized = phone.replaceAll(RegExp(r'[\s().-]'), '');
    if (!RegExp(r'^\+[1-9]\d{7,14}$').hasMatch(normalized)) return null;
    return normalized;
  }

  const SosContact({
    required this.id,
    required this.name,
    required this.phone,
  });

  Map<String, String> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
      };

  factory SosContact.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final name = json['name'];
    final phone = json['phone'];
    if (id is! String || name is! String || phone is! String) {
      throw const FormatException(
          'Contacto SOS guardado con formato inválido.');
    }
    return SosContact(id: id, name: name, phone: phone);
  }
}

List<String> normalizeSosRecipientPhones(Iterable<SosContact> contacts) {
  return contacts
      .map((contact) => contact.normalizedPhone)
      .whereType<String>()
      .toSet()
      .toList(growable: false);
}
