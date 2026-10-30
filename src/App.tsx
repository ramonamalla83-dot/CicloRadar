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
import { ArrowLeft, Home, Bike, ShieldAlert, MapPin, Check } from 'lucide-react';
import { audioEngine } from './utils/audio';

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
  const [alarmSound, setAlarmSound] = useState('sirena');
  const [incomingSos, setIncomingSos] = useState<IncomingSos>(null);

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
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('auth');
  };

  const handleAcceptSos = () => {
    setIncomingSos(null);
    setCurrentScreen('map');
  };

  return (
    <div className="w-full h-screen bg-zinc-950 flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      {currentScreen !== 'auth' && (
        <header className="absolute top-0 z-10 w-full bg-zinc-900/90 backdrop-blur-md shadow-sm p-4 flex justify-between items-center border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {currentScreen !== 'home' ? (
              <button 
                onClick={() => setCurrentScreen('home')}
                className="w-10 h-10 flex items-center justify-center text-zinc-300 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
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
            {currentScreen !== 'home' && (
              <button 
                onClick={() => setCurrentScreen('home')}
                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-orange-500 transition-colors"
                title="Inicio"
              >
                <Home className="w-5 h-5" />
              </button>
            )}
            {user && (
              <button 
                onClick={handleLogout}
                className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-semibold text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                title="Cerrar Sesión"
              >
                {user.initials}
              </button>
            )}
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
        {currentScreen === 'map' && <CyclingMap trackingEnabled={trackingEnabled} />}
        {currentScreen === 'community' && <Community trackingEnabled={trackingEnabled} />}
        {currentScreen === 'sos' && <SosConfig />}
        {currentScreen === 'profile' && (
          <ProfileSettings 
            trackingEnabled={trackingEnabled} 
            setTrackingEnabled={setTrackingEnabled} 
            alarmSound={alarmSound}
            setAlarmSound={setAlarmSound}
          />
        )}
      </main>

      {/* INCOMING SOS OVERLAY */}
      {incomingSos && (
        <div className="absolute inset-0 z-50 bg-red-600/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-in fade-in zoom-in duration-300">
          <ShieldAlert className="w-24 h-24 mb-6 animate-pulse" />
          <h2 className="text-3xl font-black text-center mb-2">¡SOS RECIBIDO!</h2>
          <p className="text-xl text-center mb-8 opacity-90">Ciclista en peligro cerca de ti</p>
          
          <div className="bg-white/10 p-6 rounded-2xl w-full max-w-sm mb-12 border border-white/20">
            <p className="font-bold text-2xl mb-1 text-center">{incomingSos.name}</p>
            <p className="text-lg flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5" /> A {incomingSos.distance} de distancia
            </p>
          </div>

          <button 
            onClick={handleAcceptSos}
            className="w-full max-w-sm bg-white text-red-600 font-black text-xl py-5 rounded-full shadow-2xl flex items-center justify-center gap-3 hover:scale-105 transition-transform"
          >
            <Check className="w-8 h-8" />
            IR A AYUDAR
          </button>
        </div>
      )}
    </div>
  );
}
