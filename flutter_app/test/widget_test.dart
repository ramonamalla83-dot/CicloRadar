import 'package:cicloradar/providers/app_state.dart';
import 'package:cicloradar/main.dart';
import 'package:cicloradar/screens/registration_screen.dart';
import 'package:cicloradar/screens/sos_contacts_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('a new profile opens on registration instead of the map',
      (tester) async {
    SharedPreferences.setMockInitialValues({});
    final appState = AppState.forTesting();

    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: appState,
        child: const CicloRadarFlutterApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Tu número'), findsOneWidget);
    expect(find.text('Radar Mapa'), findsNothing);
  });

  testWidgets('registration saves the rider profile after the demo code step',
      (tester) async {
    String? registeredPhone;
    String? registeredName;
    String? registeredBike;
    String? registeredLevel;

    await tester.pumpWidget(
      MaterialApp(
        home: RegistrationScreen(
          onComplete: ({
            required String phone,
            required String name,
            required String bikeType,
            required String experienceLevel,
          }) async {
            registeredPhone = phone;
            registeredName = name;
            registeredBike = bikeType;
            registeredLevel = experienceLevel;
          },
        ),
      ),
    );

    expect(find.text('Tu número'), findsOneWidget);
    await tester.enterText(find.byType(TextFormField), '+54 11 1234-5678');
    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();

    expect(find.textContaining('no está conectada'), findsOneWidget);
    await tester.enterText(find.byType(TextFormField), '123456');
    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField), 'Tatu Ciclista');
    await tester.tap(find.text('Comenzar a rodar'));
    await tester.pumpAndSettle();

    expect(registeredPhone, '+54 11 1234-5678');
    expect(registeredName, 'Tatu Ciclista');
    expect(registeredBike, 'MTB');
    expect(registeredLevel, 'Intermedio');
  });

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

    await tester.enterText(
        find.byType(TextFormField).at(0), 'Contacto de prueba');
    await tester.enterText(
        find.byType(TextFormField).at(1), '+54 11 1234 5678');
    await tester.tap(find.text('Añadir contacto'));
    await tester.pumpAndSettle();

    expect(find.text('Contacto de prueba'), findsOneWidget);
    expect(find.text('+54 11 1234 5678'), findsOneWidget);

    await tester.tap(find.byTooltip('Eliminar contacto'));
    await tester.pumpAndSettle();

    expect(find.text('Contacto de prueba'), findsNothing);
    expect(find.text('Todavía no agregaste contactos de emergencia.'),
        findsOneWidget);
  });
}
