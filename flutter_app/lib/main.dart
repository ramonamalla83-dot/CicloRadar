import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/app_state.dart';
import 'screens/main_shell.dart';
import 'screens/registration_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Bloqueo de orientación o barra de estado en modo oscuro
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF09090B),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppState()),
      ],
      child: const CicloRadarFlutterApp(),
    ),
  );
}

class CicloRadarFlutterApp extends StatelessWidget {
  const CicloRadarFlutterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CicloRadar',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF09090B), // zinc-950
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFF97316), // orange-500
          brightness: Brightness.dark,
          surface: const Color(0xFF18181B), // zinc-900
          primary: const Color(0xFFF97316),
          error: Colors.redAccent,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF09090B),
          elevation: 0,
          titleTextStyle: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        cardTheme: CardThemeData(
          color: const Color(0xFF18181B),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      home: Consumer<AppState>(
        builder: (context, appState, _) {
          if (!appState.isReady) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          if (!appState.isRegistered) {
            return RegistrationScreen(
              onComplete: ({
                required String phone,
                required String name,
                required String bikeType,
                required String experienceLevel,
              }) {
                return appState.completeRegistration(
                  phone: phone,
                  name: name,
                  bikeType: bikeType,
                  experienceLevel: experienceLevel,
                );
              },
            );
          }
          return const MainShell();
        },
      ),
    );
  }
}
