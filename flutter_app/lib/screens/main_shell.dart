import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../widgets/advanced_night_mode_filter.dart';
import 'community_screen.dart';
import 'home_screen.dart';
import 'map_screen.dart';
import 'profile_screen.dart';
import 'sos_contacts_screen.dart';
import 'sos_dialog.dart';

class MainShell extends StatelessWidget {
  const MainShell({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    final screens = [
      AdvancedNightModeFilter(
        enabled: appState.advancedNightModeEnabled,
        child: const HomeScreen(),
      ),
      const MapScreen(),
      AdvancedNightModeFilter(
        enabled: appState.advancedNightModeEnabled,
        child: const CommunityScreen(),
      ),
      AdvancedNightModeFilter(
        enabled: appState.advancedNightModeEnabled,
        child: const SosContactsScreen(),
      ),
      AdvancedNightModeFilter(
        enabled: appState.advancedNightModeEnabled,
        child: const ProfileScreen(),
      ),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF09090B), // zinc-950
      body: Stack(
        children: [
          IndexedStack(index: appState.currentScreenIndex, children: screens),

          // Overlay modal de cuenta regresiva SOS de 5 segundos
          const SosDialog(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF09090B),
          border: Border(
            top: BorderSide(color: Color(0xFF27272A), width: 1.0),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: appState.currentScreenIndex,
          onTap: appState.setScreenIndex,
          backgroundColor: const Color(0xFF09090B),
          selectedItemColor: appState.advancedNightModeEnabled
              ? const Color(0xFFC17A3A)
              : const Color(0xFFF97316), // orange-500
          unselectedItemColor: Colors.grey.shade500,
          selectedFontSize: 12,
          unselectedFontSize: 12,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Inicio',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.map_outlined),
              activeIcon: Icon(Icons.map),
              label: 'Mapa',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.group_outlined),
              activeIcon: Icon(Icons.group),
              label: 'Comunidad',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.sos_outlined),
              activeIcon: Icon(Icons.sos),
              label: 'Contactos SOS',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Perfil',
            ),
          ],
        ),
      ),
    );
  }
}
