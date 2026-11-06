import 'package:cicloradar/providers/app_state.dart';
import 'package:cicloradar/screens/sos_contacts_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('SOS contacts can be added and removed', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final appState = AppState.forTesting();

    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: appState,
        child: const MaterialApp(home: SosContactsScreen()),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField).at(0), 'Contacto de prueba');
    await tester.enterText(find.byType(TextFormField).at(1), '+54 11 1234 5678');
    await tester.tap(find.text('Añadir contacto'));
    await tester.pumpAndSettle();

    expect(find.text('Contacto de prueba'), findsOneWidget);
    expect(find.text('+54 11 1234 5678'), findsOneWidget);

    await tester.tap(find.byTooltip('Eliminar contacto'));
    await tester.pumpAndSettle();

    expect(find.text('Contacto de prueba'), findsNothing);
    expect(find.text('Todavía no agregaste contactos de emergencia.'), findsOneWidget);
  });
}
