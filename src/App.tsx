/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef } from 'react';
import CyclingMap from './components/Map';
import Auth from './components/Auth';
import HomeMenu from './components/HomeMenu';
import Community from './components/Community';
import SosConfig from './components/SosConfig';
import ProfileSettings from './components/ProfileSettings';
import { 
  ArrowLeft, Home, Bike, ShieldAlert, MapPin, Check, Users, User, 
  Map as MapIcon, LogOut, ShieldCheck, Volume2, Smartphone, 
  HelpCircle, Sun, Moon, Mic, MicOff, X, Sparkles, AlertOctagon 
} from 'lucide-react';
import { audioEngine, ALARM_PRESETS } from './utils/audio';
import { useAppPermissions } from './hooks/useAppPermissions';
import PermissionsModal from './components/PermissionsModal';
import { notificationService } from './utils/notifications';
import Tutorial, { TUTORIAL_STORAGE_KEY } from './components/Tutorial';
import { useCyclingTheme } from './hooks/useCyclingTheme';
import { useVoiceSos } from './hooks/useVoiceSos';

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
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Estados para comando de voz 'CicloRadar SOS'
  const [voiceSosCountdown, setVoiceSosCountdown] = useState<number | null>(null);
  const [voiceSosPhrase, setVoiceSosPhrase] = useState<string>('CicloRadar SOS');
  const [activeLocalSos, setActiveLocalSos] = useState<boolean>(false);
  const voiceCountdownInterval = useRef<any>(null);

  const permissions = useAppPermissions();
  const theme = useCyclingTheme();

  const handleVoiceSosTrigger = (detectedPhrase: string) => {
    // Si ya hay alarma activa o cuenta regresiva, evitar solapamiento
    if (voiceSosCountdown !== null || activeLocalSos) return;

    setVoiceSosPhrase(detectedPhrase || 'CicloRadar SOS');
    setVoiceSosCountdown(5);

    if (voiceCountdownInterval.current) clearInterval(voiceCountdownInterval.current);
    voiceCountdownInterval.current = setInterval(() => {
      setVoiceSosCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(voiceCountdownInterval.current);
          voiceCountdownInterval.current = null;
          setVoiceSosCountdown(null);
          setActiveLocalSos(true);
          audioEngine.play(alarmSound);
          setCurrentScreen('map');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelVoiceSos = () => {
    if (voiceCountdownInterval.current) {
      clearInterval(voiceCountdownInterval.current);
      voiceCountdownInterval.current = null;
    }
    setVoiceSosCountdown(null);
    audioEngine.stop();
  };

  const handleStopLocalSos = () => {
    setActiveLocalSos(false);
    audioEngine.stop();
  };

  const voiceSos = useVoiceSos(handleVoiceSosTrigger);

  // Iniciar reconocimiento de voz automáticamente cuando el ciclista inicia sesión
  useEffect(() => {
    if (user && voiceSos.isEnabled && !voiceSos.isListening) {
      voiceSos.startListening();
    }
  }, [user, voiceSos.isEnabled]);

  useEffect(() => {
    if (incomingSos) {
      audioEngine.play(alarmSound);
      // Disparar Notificación Push / Service Worker en segundo plano
      notificationService.triggerSosAlert(incomingSos);
    } else {
      audioEngine.stop();
    }
  }, [incomingSos, alarmSound]);

  // Manejar clics en notificaciones del Service Worker (apertura y enfoque de la app)
  useEffect(() => {
    // 1. Escuchar mensajes del Service Worker activo
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NAVIGATE_TO_SOS') {
          const payload = event.data.payload;
          if (payload) {
            setIncomingSos({
              name: payload.name || 'Ciclista en Peligro',
              distance: payload.distance || '0.5 km',
              lat: payload.lat || -33.3,
              lng: payload.lng || -66.3,
            });
            setCurrentScreen('map');
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSwMessage);

      // 2. Comprobar si se abrió en frío con el query param de la notificación
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('sos') === 'true') {
          setIncomingSos({
            name: 'Alerta SOS Recibida',
            distance: '0.6 km',
            lat: -33.3,
            lng: -66.3,
          });
          setCurrentScreen('map');
        }
      }

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, []);

  // Detectar primer inicio para mostrar tutorial guiado
  useEffect(() => {
    if (user && currentScreen === 'map') {
      try {
        const isCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
        if (!isCompleted) {
          const timer = setTimeout(() => setIsTutorialOpen(true), 600);
          return () => clearTimeout(timer);
        }
      } catch (_) {}
    }
  }, [user, currentScreen]);

  const handleLogin = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    setUser({ name, initials });
    setCurrentScreen('map');

    // Mostrar tutorial si nunca se ha completado
    try {
      const isCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (!isCompleted) {
        setTimeout(() => setIsTutorialOpen(true), 600);
      }
    } catch (_) {}
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

            {/* Botón de Guía y Tutorial */}
            <button 
              onClick={() => {
                setCurrentScreen('map');
                setIsTutorialOpen(true);
              }}
              className="h-9 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors shadow-sm"
              title="Ver Guía Interactiva y Tutorial"
            >
              <HelpCircle className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">Guía</span>
            </button>

            {/* Selector rápido de Tema / Confort Nocturno */}
            <button
              onClick={() => theme.cycleMode()}
              className={`h-9 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-bold border transition-colors shadow-sm ${
                theme.isNightActive
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/40'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-900/30'
              }`}
              title={`Tema: ${theme.mode === 'auto' ? `Auto (${theme.reason})` : theme.mode === 'night' ? 'Noche OLED fija' : 'Día Claro fijo'}. Toca para cambiar.`}
            >
              {theme.isNightActive ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <span className="hidden md:inline font-mono text-[11px]">
                {theme.mode === 'auto' ? `Auto` : theme.mode === 'night' ? 'Noche' : 'Día'}
              </span>
            </button>

            {/* Indicador y control de Comando de Voz 'CicloRadar SOS' */}
            <button
              onClick={() => {
                if (!voiceSos.isSupported) {
                  alert('El reconocimiento de voz Web Speech API no está soportado en este navegador.');
                  return;
                }
                voiceSos.toggleEnabled();
              }}
              className={`h-9 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-bold border transition-colors shadow-sm ${
                !voiceSos.isSupported
                  ? 'opacity-40 border-zinc-800 bg-zinc-900 text-zinc-500 cursor-not-allowed'
                  : voiceSos.isEnabled && voiceSos.isListening
                  ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
                  : voiceSos.isEnabled
                  ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
              title={
                !voiceSos.isSupported
                  ? 'Comando de voz no soportado'
                  : voiceSos.isEnabled
                  ? "Comando de voz activo: Di 'CicloRadar SOS' para activar emergencia"
                  : 'Comando de voz desactivado. Toca para activar'
              }
            >
              <Mic className={`w-3.5 h-3.5 ${voiceSos.isEnabled && voiceSos.isListening ? 'animate-pulse text-red-400' : ''}`} />
              <span className="hidden lg:inline text-[11px]">
                {voiceSos.isEnabled && voiceSos.isListening ? 'Voz SOS' : voiceSos.isEnabled ? 'Voz On' : 'Voz Off'}
              </span>
              {voiceSos.isEnabled && voiceSos.isListening && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              )}
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
          <HomeMenu 
            onNavigate={(s) => setCurrentScreen(s as Screen)} 
            onSimulateSos={() => setIncomingSos({ name: 'Carlos M.', distance: '0.8 km', lat: -33.3, lng: -66.3 })}
          />
        )}
        {currentScreen === 'map' && (
          <CyclingMap 
            trackingEnabled={trackingEnabled} 
            alarmSound={alarmSound}
            onOpenPermissions={() => setIsPermissionsModalOpen(true)}
            userName={user?.name || 'Ciclista'}
          />
        )}
        {currentScreen === 'community' && (
          <Community 
            trackingEnabled={trackingEnabled} 
            onNavigateToMap={() => setCurrentScreen('map')} 
          />
        )}
        {currentScreen === 'sos' && <SosConfig />}
        {currentScreen === 'profile' && (
          <ProfileSettings 
            trackingEnabled={trackingEnabled} 
            setTrackingEnabled={setTrackingEnabled} 
            alarmSound={alarmSound}
            setAlarmSound={setAlarmSound}
            onOpenPermissions={() => setIsPermissionsModalOpen(true)}
            onRestartTutorial={() => {
              setCurrentScreen('map');
              setIsTutorialOpen(true);
            }}
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

      {/* COMPONENTE TUTORIAL SUPERPUESTO */}
      <Tutorial 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
      />

      {/* MODAL DE CUENTA REGRESIVA - COMANDO DE VOZ DETECTADO */}
      {voiceSosCountdown !== null && (
        <div className="fixed inset-0 z-50 bg-red-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-in zoom-in-95 duration-200">
          <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-4 animate-bounce">
            <Mic className="w-12 h-12 text-red-400" />
          </div>

          <div className="text-center space-y-3 mb-8 max-w-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-xs font-bold uppercase tracking-wider text-orange-400">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-spin" />
              <span>Comando de voz detectado</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              "{voiceSosPhrase}"
            </h2>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Activando alarma acústica máxima y alerta de emergencia en:
            </p>

            <div className="text-7xl font-black text-white font-mono my-4 tracking-tighter drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]">
              {voiceSosCountdown}
            </div>

            <p className="text-xs text-red-200/80">
              Toca el botón abajo para cancelar si fue una falsa alarma o prueba.
            </p>
          </div>

          <button
            onClick={handleCancelVoiceSos}
            className="w-full max-w-xs py-4 px-6 rounded-2xl bg-white text-red-600 font-extrabold text-base shadow-2xl hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center gap-2 border border-white"
          >
            <X className="w-5 h-5 stroke-[3]" /> Cancelar (Falsa Alarma)
          </button>
        </div>
      )}

      {/* BANNER HUD - ALERTA SOS LOCAL ACTIVA DISPARADA POR VOZ */}
      {activeLocalSos && (
        <div className="fixed top-20 left-4 right-4 z-40 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 rounded-2xl shadow-2xl border-2 border-white/40 flex items-center justify-between gap-3 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center shrink-0 animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm uppercase tracking-wide truncate">¡ALERTA SOS ACTIVA!</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-yellow-300 border border-yellow-300/30">
                  Activada por Voz
                </span>
              </div>
              <p className="text-xs text-red-100 truncate">
                Sirena acústica de máxima potencia emitiéndose.
              </p>
            </div>
          </div>

          <button
            onClick={handleStopLocalSos}
            className="px-4 py-2.5 bg-white text-red-700 font-black rounded-xl text-xs hover:bg-zinc-100 active:scale-95 transition-all shadow-md shrink-0 flex items-center gap-1.5"
          >
            <X className="w-4 h-4" /> Detener Alarma
          </button>
        </div>
      )}
    </div>
  );
}
