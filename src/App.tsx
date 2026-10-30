/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import CyclingMap from './components/Map';
import Auth from './components/Auth';
import HomeMenu from './components/HomeMenu';
import Community from './components/Community';
import SosConfig from './components/SosConfig';
import ProfileSettings from './components/ProfileSettings';
import { ArrowLeft, Home, Bike, ShieldAlert, MapPin, Check, Users, User, Map as MapIcon, LogOut, ShieldCheck, Volume2, Smartphone } from 'lucide-react';
import { audioEngine, ALARM_PRESETS } from './utils/audio';
import { useAppPermissions } from './hooks/useAppPermissions';
import PermissionsModal from './components/PermissionsModal';

type Screen = 'auth' | 'home' | 'map' | 'community' | 'sos' | 'profile';

type IncomingSos = {
  name: string;
  distance: string;
  lat: number;
  lng: number;
} | null;

export default function App() {
  const [user, setUser] = useState<{name: string, initials: string} | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [alarmSound, setAlarmSound] = useState('radar_ios');
  const [incomingSos, setIncomingSos] = useState<IncomingSos>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  const permissions = useAppPermissions();

  useEffect(() => {
    if (incomingSos) {
      audioEngine.play(alarmSound);
    } else {
      audioEngine.stop();
    }
  }, [incomingSos, alarmSound]);

  const handleLogin = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    setUser({ name, initials });
    setCurrentScreen('map');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('auth');
  };

  const handleAcceptSos = () => {
    setIncomingSos(null);
    setCurrentScreen('map');
  };

  const navItems: { id: Screen; label: string; icon: typeof MapIcon }[] = [
    { id: 'map', label: 'Mapa', icon: MapIcon },
    { id: 'community', label: 'Comunidad', icon: Users },
    { id: 'sos', label: 'SOS', icon: ShieldAlert },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'home', label: 'Inicio', icon: Home },
  ];

  return (
    <div className="w-full h-screen bg-zinc-950 flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      {currentScreen !== 'auth' && (
        <header className="absolute top-0 z-10 w-full bg-zinc-900/90 backdrop-blur-md shadow-sm p-4 flex justify-between items-center border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {currentScreen !== 'map' ? (
              <button 
                onClick={() => setCurrentScreen('map')}
                className="w-10 h-10 flex items-center justify-center text-zinc-300 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
                title="Volver al Mapa"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10 flex items-center justify-center text-orange-500 bg-orange-500/20 rounded-full">
                <Bike className="w-5 h-5" />
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white leading-tight">CicloRadar</h1>
              <span className="text-xs text-orange-500 font-medium tracking-wide">BETA</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botón rápido de Instalación y Permisos SOS */}
            <button 
              onClick={() => setIsPermissionsModalOpen(true)}
              className="h-9 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-bold bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 transition-colors shadow-sm"
              title="Instalación de App y Permisos del Sistema"
            >
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">Permisos & PWA</span>
            </button>

            {user && (
              <button 
                onClick={() => setCurrentScreen('profile')}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors border ${
                  currentScreen === 'profile'
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                }`}
                title="Ver Mi Perfil"
              >
                {user.initials}
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 relative flex flex-col min-h-0">
        {currentScreen === 'auth' && <Auth onLogin={handleLogin} />}
        {currentScreen === 'home' && (
          <div className="flex-1 overflow-y-auto bg-zinc-950 flex flex-col">
            <HomeMenu onNavigate={(s) => setCurrentScreen(s as Screen)} />
            <div className="p-4 mt-auto">
              <button 
                onClick={() => setIncomingSos({ name: 'Carlos M.', distance: '0.8 km', lat: -33.3, lng: -66.3 })}
                className="w-full bg-red-500/20 text-red-500 py-3 rounded-xl font-bold border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                (Dev) Simular SOS Cercano
              </button>
            </div>
          </div>
        )}
        {currentScreen === 'map' && (
          <CyclingMap 
            trackingEnabled={trackingEnabled} 
            alarmSound={alarmSound}
            onOpenPermissions={() => setIsPermissionsModalOpen(true)}
          />
        )}
        {currentScreen === 'community' && <Community trackingEnabled={trackingEnabled} />}
        {currentScreen === 'sos' && <SosConfig />}
        {currentScreen === 'profile' && (
          <ProfileSettings 
            trackingEnabled={trackingEnabled} 
            setTrackingEnabled={setTrackingEnabled} 
            alarmSound={alarmSound}
            setAlarmSound={setAlarmSound}
            onOpenPermissions={() => setIsPermissionsModalOpen(true)}
          />
        )}
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR (BOTTOM NAV) */}
      {currentScreen !== 'auth' && (
        <nav 
          aria-label="Navegación principal"
          className="z-30 w-full bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 flex items-center justify-around px-2 py-1.5 shrink-0 shadow-[0_-4px_25px_rgba(0,0,0,0.6)]"
        >
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all min-h-[46px] group relative ${
                  isActive
                    ? 'text-orange-500 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                aria-current={isActive ? 'page' : undefined}
                title={item.label}
              >
                <div className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-orange-500/15' : 'group-hover:bg-zinc-900'
                }`}>
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-orange-500' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight leading-tight">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-0.5 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* INCOMING SOS OVERLAY */}
      {incomingSos && (() => {
        const activeAlarmPreset = ALARM_PRESETS.find(p => p.id === alarmSound) || ALARM_PRESETS[0];
        return (
          <div className="absolute inset-0 z-50 bg-red-600/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-in fade-in zoom-in duration-300">
            <ShieldAlert className="w-24 h-24 mb-4 animate-pulse" />
            <h2 className="text-3xl font-black text-center mb-1">¡SOS RECIBIDO!</h2>
            <p className="text-lg text-center mb-4 opacity-90">Ciclista en peligro cerca de ti</p>
            
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <span className="text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-yellow-300" />
                Alarma: {activeAlarmPreset.name} ({activeAlarmPreset.brand})
              </span>
              <span className="text-xs font-bold bg-green-950/80 text-green-300 px-3 py-1.5 rounded-full border border-green-400/40">
                🔊 Auto-Boost +240% Forzado
              </span>
            </div>

            <div className="bg-white/10 p-6 rounded-2xl w-full max-w-sm mb-8 border border-white/20">
              <p className="font-bold text-2xl mb-1 text-center">{incomingSos.name}</p>
              <p className="text-lg flex items-center justify-center gap-2">
                <MapPin className="w-5 h-5 text-orange-300" /> A {incomingSos.distance} de distancia
              </p>
            </div>

            <button 
              onClick={handleAcceptSos}
              className="w-full max-w-sm bg-white text-red-600 font-black text-xl py-5 rounded-full shadow-2xl flex items-center justify-center gap-3 hover:scale-105 transition-transform"
            >
              <Check className="w-8 h-8 stroke-[3]" />
              IR A AYUDAR
            </button>
          </div>
        );
      })()}

      {/* MODAL DE PERMISOS E INSTALACIÓN PWA */}
      <PermissionsModal 
        isOpen={isPermissionsModalOpen} 
        onClose={() => setIsPermissionsModalOpen(false)}
        alarmSound={alarmSound}
        permissions={permissions}
      />
    </div>
  );
}
