import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import 'community_screen.dart';
import 'map_screen.dart';
import 'profile_screen.dart';
import 'sos_dialog.dart';

class MainShell extends StatelessWidget {
  const MainShell({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    final screens = [
      const MapScreen(),
      const CommunityScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF09090B), // zinc-950
      body: Stack(
        children: [
          // Pantalla activa indexada
          IndexedStack(
            index: appState.currentScreenIndex == 3 ? 2 : (appState.currentScreenIndex > 2 ? 0 : appState.currentScreenIndex),
            children: screens,
          ),

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
          currentIndex: appState.currentScreenIndex == 3 ? 2 : (appState.currentScreenIndex > 2 ? 0 : appState.currentScreenIndex),
          onTap: (index) {
            if (index == 2) {
              appState.setScreenIndex(3); // Perfil
            } else {
              appState.setScreenIndex(index);
            }
          },
          backgroundColor: const Color(0xFF09090B),
          selectedItemColor: const Color(0xFFF97316), // orange-500
          unselectedItemColor: Colors.grey.shade500,
          selectedFontSize: 12,
          unselectedFontSize: 12,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.map_outlined),
              activeIcon: Icon(Icons.map),
              label: 'Radar Mapa',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.group_outlined),
              activeIcon: Icon(Icons.group),
              label: 'Comunidad',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Ajustes',
            ),
          ],
        ),
      ),
    );
  }
}
