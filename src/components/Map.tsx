import { useEffect, useState, useRef } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Navigation, AlertCircle, X, ShieldAlert, EyeOff, Sun, Moon } from 'lucide-react';

const lightMapStyle = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxzoom: 19
    }
  },
  layers: [
    {
      id: 'carto',
      type: 'raster',
      source: 'carto'
    }
  ]
};

const darkMapStyle = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxzoom: 19
    }
  },
  layers: [
    {
      id: 'carto',
      type: 'raster',
      source: 'carto'
    }
  ]
};

export default function CyclingMap({ trackingEnabled = true }: { trackingEnabled?: boolean }) {
  const [viewState, setViewState] = useState({
    longitude: -66.3369,
    latitude: -33.2994,
    zoom: 13
  });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapMode, setMapMode] = useState<'light' | 'dark'>('light');

  const [sosStatus, setSosStatus] = useState<'idle' | 'countdown' | 'active'>('idle');
  const [countdown, setCountdown] = useState(5);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setViewState(prev => ({
            ...prev,
            longitude,
            latitude,
            zoom: 14
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (sosStatus === 'countdown') {
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current!);
            setSosStatus('active');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [sosStatus]);

  const handleSosClick = () => {
    if (sosStatus === 'idle') {
      setSosStatus('countdown');
      setCountdown(5);
    }
  };

  const handleCancelSos = () => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    setSosStatus('idle');
  };

  return (
    <div className="relative w-full h-full bg-gray-100">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={(mapMode === 'light' ? lightMapStyle : darkMapStyle) as any}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" />
        
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="relative flex items-center justify-center">
              <div className={`absolute w-12 h-12 rounded-full opacity-40 animate-ping ${sosStatus === 'active' ? 'bg-red-600 w-24 h-24' : 'bg-orange-500'}`}></div>
              <div className={`bg-zinc-900 p-1.5 rounded-full shadow-md z-10 border-2 ${sosStatus === 'active' ? 'border-red-600' : trackingEnabled ? 'border-orange-500' : 'border-zinc-700'}`}>
                {trackingEnabled ? (
                  <Navigation className={`w-5 h-5 ${sosStatus === 'active' ? 'text-red-500 fill-red-500' : 'text-orange-500 fill-orange-500'}`} />
                ) : (
                  <EyeOff className="w-5 h-5 text-zinc-500" />
                )}
              </div>
            </div>
          </Marker>
        )}
      </Map>

      {/* Map Mode Toggle */}
      <button 
        onClick={() => setMapMode(prev => prev === 'light' ? 'dark' : 'light')}
        className="absolute top-20 right-4 bg-zinc-900/90 text-white p-3 rounded-full shadow-lg border border-zinc-700 z-10 hover:bg-zinc-800 transition-colors"
      >
        {mapMode === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-orange-500" />}
      </button>

      {/* SOS Active Banner */}
      {sosStatus === 'active' && (
        <div className="absolute top-0 left-0 w-full bg-red-600 text-white p-4 flex flex-col items-center justify-center shadow-lg z-20 animate-pulse">
          <div className="flex items-center gap-2 font-bold text-lg">
            <ShieldAlert className="w-6 h-6" />
            <span>SOS ACTIVO</span>
          </div>
          <p className="text-sm font-medium opacity-90 text-center">
            Transmitiendo tu ubicación a ciclistas cercanos y contactos de emergencia...
          </p>
        </div>
      )}

      {/* Tracking Disabled Banner */}
      {!trackingEnabled && sosStatus !== 'active' && (
        <div className="absolute top-4 left-4 right-4 bg-zinc-900/90 border border-zinc-800 backdrop-blur-sm text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-lg z-10">
          <EyeOff className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium">Modo incógnito: No ves ni te ven</span>
        </div>
      )}

      {/* Action Overlays */}
      <div className="absolute bottom-8 left-4 flex flex-col gap-4 z-20">
        {sosStatus === 'active' ? (
          <button
            className="bg-zinc-900 text-red-500 border-2 border-red-500 hover:bg-zinc-800 px-6 py-4 rounded-full shadow-lg font-bold flex items-center justify-center gap-2 transition-colors"
            onClick={handleCancelSos}
          >
            <X className="w-6 h-6" />
            CANCELAR SOS
          </button>
        ) : (
          <button
            className={`${sosStatus === 'countdown' ? 'hidden' : 'flex'} bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all hover:scale-105 items-center justify-center border border-red-500`}
            onClick={handleSosClick}
          >
            <AlertCircle className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* SOS Countdown Overlay */}
      {sosStatus === 'countdown' && (
        <div className="absolute inset-0 bg-red-950/95 backdrop-blur-md z-30 flex flex-col items-center justify-center text-white p-6">
          <ShieldAlert className="w-20 h-20 mb-6 text-red-500 animate-pulse" />
          <h2 className="text-3xl font-black mb-2 text-center text-red-500">ALERTA DE EMERGENCIA</h2>
          <p className="text-xl mb-12 text-center text-red-300">Activando protocolo SOS en...</p>
          
          <div className="text-9xl font-black mb-12 tabular-nums text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">
            {countdown}
          </div>

          <button
            onClick={handleCancelSos}
            className="bg-white text-red-600 px-10 py-5 rounded-full font-bold text-xl shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform"
          >
            <X className="w-8 h-8" />
            CANCELAR
          </button>
          <p className="mt-6 text-sm text-red-300 text-center max-w-xs">
            Si no cancelas, se notificará a los ciclistas cercanos y contactos predefinidos con tu ubicación exacta.
          </p>
        </div>
      )}
    </div>
  );
}
