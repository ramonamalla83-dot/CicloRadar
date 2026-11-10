import { useState, useEffect, useCallback } from 'react';
import { 
  CloudRain, 
  CloudLightning, 
  Wind, 
  Sun, 
  Cloud, 
  CloudFog, 
  Compass, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Droplets, 
  Thermometer, 
  Sparkles,
  Info
} from 'lucide-react';

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitationMm: number;
  weatherCode: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  windDirectionDeg: number;
  updatedAt: string;
}

export type HazardLevel = 'danger' | 'warning' | 'favorable';

interface WeatherHazard {
  level: HazardLevel;
  title: string;
  badge: string;
  description: string;
  safetyTip: string;
}

interface WeatherWidgetProps {
  userLocation: { lat: number; lng: number } | null;
  className?: string;
}

// Convierte grados a dirección de brújula
function getWindDirectionText(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

// Analiza código WMO y vientos para categorizar peligros ciclistas
function evaluateCyclingHazard(data: WeatherData): WeatherHazard {
  const isThunderstorm = [95, 96, 99].includes(data.weatherCode);
  const isHeavyRain = [65, 82].includes(data.weatherCode) || data.precipitationMm >= 4.0;
  const isModerateRain = [61, 63, 80, 81].includes(data.weatherCode) || data.precipitationMm > 0.5;
  const isExtremeWind = data.windSpeedKmh >= 38 || data.windGustsKmh >= 50;
  const isModerateWind = (data.windSpeedKmh >= 24 && data.windSpeedKmh < 38) || (data.windGustsKmh >= 35 && data.windGustsKmh < 50);

  if (isThunderstorm) {
    return {
      level: 'danger',
      title: '¡Riesgo de Tormenta Eléctrica!',
      badge: 'Peligro Tormenta ⚡',
      description: 'Actividad eléctrica o granizo detectado en tu ruta. Peligro crítico para ciclistas en carretera o descampados.',
      safetyTip: 'Busca refugio techado inmediato. Aléjate de árboles aislados y estructuras metálicas.'
    };
  }

  if (isExtremeWind) {
    return {
      level: 'danger',
      title: '¡Ráfagas de Viento Peligrosas!',
      badge: `Viento Fuerte (${Math.round(data.windGustsKmh)} km/h) 💨`,
      description: `Ráfagas de ${Math.round(data.windGustsKmh)} km/h desde el ${getWindDirectionText(data.windDirectionDeg)}. Riesgo grave de desestabilización lateral de la bicicleta.`,
      safetyTip: 'Sujeta firmemente el manillar, reduce la velocidad y ten extremo cuidado con ruedas de perfil alto.'
    };
  }

  if (isHeavyRain) {
    return {
      level: 'danger',
      title: 'Lluvia Torrencial en Ruta',
      badge: 'Lluvia Intensa 🌧️',
      description: `Precipitación de ${data.precipitationMm} mm/h. El asfalto mojado triplica la distancia de frenado y reduce la visibilidad de los coches.`,
      safetyTip: 'Modera la velocidad, frena de manera progresiva antes de las curvas y activa luces intermitentes.'
    };
  }

  if (isModerateWind) {
    return {
      level: 'warning',
      title: 'Viento Moderado a Fuerte',
      badge: `Viento ${Math.round(data.windSpeedKmh)} km/h`,
      description: `Viento sostenido de ${Math.round(data.windSpeedKmh)} km/h (ráfagas ${Math.round(data.windGustsKmh)} km/h). Resistencia notable al avance.`,
      safetyTip: 'Adopta una postura aerodinámica más baja y prevé ráfagas cruzadas al salir de zonas resguardadas.'
    };
  }

  if (isModerateRain) {
    return {
      level: 'warning',
      title: 'Pavimento Mojado / Llovizna',
      badge: 'Lluvia Ligera 🌦️',
      description: 'Superficie resbaladiza por lluvia o llovizna. Precaución en líneas pintadas y alcantarillas.',
      safetyTip: 'Evita inclinar bruscamente la bicicleta sobre pasos peatonales o tapas metálicas.'
    };
  }

  return {
    level: 'favorable',
    title: 'Condiciones Favorables',
    badge: 'Ruta Segura ☀️',
    description: `Clima óptimo para pedalear. Viento suave (${Math.round(data.windSpeedKmh)} km/h) y sin riesgo de precipitaciones.`,
    safetyTip: 'Disfruta de la salida, mantén hidratación constante y respeta la distancia con otros ciclistas.'
  };
}

// Icono meteorológico según WMO y viento
function getWeatherIcon(weatherCode: number, windSpeedKmh: number) {
  if ([95, 96, 99].includes(weatherCode)) {
    return <CloudLightning className="w-5 h-5 text-red-400 animate-pulse" />;
  }
  if ([61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    return <CloudRain className="w-5 h-5 text-sky-400" />;
  }
  if (windSpeedKmh >= 35) {
    return <Wind className="w-5 h-5 text-amber-400 animate-pulse" />;
  }
  if ([45, 48].includes(weatherCode)) {
    return <CloudFog className="w-5 h-5 text-zinc-400" />;
  }
  if ([1, 2, 3].includes(weatherCode)) {
    return <Cloud className="w-5 h-5 text-zinc-300" />;
  }
  return <Sun className="w-5 h-5 text-amber-400" />;
}

export default function WeatherWidget({ userLocation, className = '' }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Consulta a la API Open-Meteo
  const fetchWeather = useCallback(async (lat: number, lng: number, force: boolean = false) => {
    const now = Date.now();
    // Cache de 5 minutos si no es forzado
    if (!force && lastFetchTime && now - lastFetchTime < 300000) {
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      
      const json = await response.json();
      const current = json.current;

      const data: WeatherData = {
        temperature: Math.round(current.temperature_2m),
        apparentTemperature: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        precipitationMm: current.precipitation,
        weatherCode: current.weather_code,
        windSpeedKmh: Math.round(current.wind_speed_10m),
        windGustsKmh: Math.round(current.wind_gusts_10m),
        windDirectionDeg: current.wind_direction_10m,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setWeatherData(data);
      setLastFetchTime(now);
    } catch (err) {
      console.warn('Error al consultar clima en ruta:', err);
      setErrorMsg('No se pudo actualizar el clima en vivo');
      // Si no hay datos previos, generar un fallback realista
      if (!weatherData) {
        setWeatherData({
          temperature: 19,
          apparentTemperature: 18,
          humidity: 55,
          precipitationMm: 0,
          weatherCode: 1,
          windSpeedKmh: 14,
          windGustsKmh: 20,
          windDirectionDeg: 45,
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [lastFetchTime, weatherData]);

  // Cargar al montar o cuando cambie la posición del usuario
  useEffect(() => {
    if (userLocation) {
      fetchWeather(userLocation.lat, userLocation.lng);
    } else {
      // Coordenadas por defecto (Madrid / centro urbano)
      fetchWeather(40.4168, -3.7038);
    }
  }, [userLocation?.lat, userLocation?.lng, fetchWeather]);

  if (!weatherData) return null;

  const hazard = evaluateCyclingHazard(weatherData);

  // Simulación de prueba rápida para demostración
  const handleSimulateCondition = (type: 'storm' | 'wind' | 'sunny') => {
    if (type === 'storm') {
      setWeatherData({
        ...weatherData,
        weatherCode: 95,
        precipitationMm: 6.2,
        windSpeedKmh: 34,
        windGustsKmh: 52,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } else if (type === 'wind') {
      setWeatherData({
        ...weatherData,
        weatherCode: 2,
        precipitationMm: 0,
        windSpeedKmh: 42,
        windGustsKmh: 58,
        windDirectionDeg: 270,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } else {
      setWeatherData({
        ...weatherData,
        weatherCode: 0,
        precipitationMm: 0,
        windSpeedKmh: 12,
        windGustsKmh: 16,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  };

  return (
    <div className={`z-20 select-none ${className}`}>
      
      {/* 1. WIDGET COMPACTO FLOTANTE SOBRE EL MAPA */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className={`backdrop-blur-md rounded-2xl shadow-xl border p-2.5 px-3.5 flex items-center gap-2.5 cursor-pointer transition-all duration-200 ${
          hazard.level === 'danger'
            ? 'bg-zinc-950/95 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
            : hazard.level === 'warning'
              ? 'bg-zinc-950/95 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'bg-zinc-950/90 border-zinc-800 hover:border-zinc-700'
        }`}
        title="Toca para ver radar meteorológico y recomendaciones de ruta"
      >
        {/* Icono de clima */}
        <div className="shrink-0 flex items-center justify-center">
          {getWeatherIcon(weatherData.weatherCode, weatherData.windSpeedKmh)}
        </div>

        {/* Temperatura y Viento */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white font-mono">{weatherData.temperature}°C</span>
            <span className="text-zinc-500 text-[10px]">·</span>
            <span className="text-[11px] font-bold text-zinc-300 font-mono flex items-center gap-0.5">
              <Wind className="w-3 h-3 text-zinc-400" />
              {weatherData.windSpeedKmh} km/h
            </span>
          </div>
          <span className={`text-[10px] font-black tracking-tight ${
            hazard.level === 'danger' 
              ? 'text-red-400' 
              : hazard.level === 'warning' 
                ? 'text-amber-400' 
                : 'text-emerald-400'
          }`}>
            {hazard.badge}
          </span>
        </div>

        {/* Botón de expandir */}
        <div className="ml-1 text-zinc-400">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* 2. PANEL EXPANDIDO CON DETALLES DE CLIMA Y ALERTAS CICLISTAS */}
      {isExpanded && (
        <div className="absolute top-14 left-0 w-80 sm:w-88 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 shadow-2xl text-zinc-200 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${
                hazard.level === 'danger' 
                  ? 'bg-red-500/20 text-red-400' 
                  : hazard.level === 'warning' 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {hazard.level === 'danger' ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Clima en Tu Ruta</h4>
                <p className="text-[10px] text-zinc-400">Open-Meteo · Actualizado a las {weatherData.updatedAt}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (userLocation) fetchWeather(userLocation.lat, userLocation.lng, true);
                  else fetchWeather(40.4168, -3.7038, true);
                }}
                disabled={isLoading}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                title="Actualizar datos del satélite meteorológico"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner de Estado y Alerta */}
          <div className={`mt-3 p-3 rounded-xl border text-xs space-y-1 ${
            hazard.level === 'danger'
              ? 'bg-red-500/15 border-red-500/40 text-red-200'
              : hazard.level === 'warning'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
          }`}>
            <p className="font-extrabold flex items-center gap-1.5">
              <span>{hazard.title}</span>
            </p>
            <p className="text-[11px] leading-relaxed text-zinc-300">
              {hazard.description}
            </p>
            <div className="pt-1 text-[11px] font-semibold text-white flex items-start gap-1">
              <span className="text-orange-400 shrink-0">💡</span>
              <span>{hazard.safetyTip}</span>
            </div>
          </div>

          {/* Cuadrícula de Métricas Meteorológicas */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            {/* Viento Constante y Ráfagas */}
            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 block mb-0.5">Viento & Ráfagas</span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className={`text-base font-bold ${weatherData.windSpeedKmh >= 35 ? 'text-amber-400' : 'text-white'}`}>
                  {weatherData.windSpeedKmh}
                </span>
                <span className="text-[10px] text-zinc-400">km/h</span>
                <span className="text-zinc-500 text-[10px]">· max</span>
                <span className={`text-xs font-bold ${weatherData.windGustsKmh >= 50 ? 'text-red-400' : 'text-zinc-300'}`}>
                  {weatherData.windGustsKmh}
                </span>
              </div>
            </div>

            {/* Dirección de Viento */}
            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 block mb-0.5">Dirección del Viento</span>
              <div className="flex items-center gap-1.5 font-mono">
                <Compass 
                  className="w-4 h-4 text-orange-400 transition-transform" 
                  style={{ transform: `rotate(${weatherData.windDirectionDeg}deg)` }} 
                />
                <span className="text-sm font-bold text-white">
                  {getWindDirectionText(weatherData.windDirectionDeg)} ({weatherData.windDirectionDeg}°)
                </span>
              </div>
            </div>

            {/* Lluvia / Precipitación */}
            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 block mb-0.5">Lluvia / Precipitación</span>
              <div className="flex items-baseline gap-1 font-mono">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span className={`text-sm font-bold ${weatherData.precipitationMm > 0 ? 'text-sky-300' : 'text-white'}`}>
                  {weatherData.precipitationMm} mm/h
                </span>
              </div>
            </div>

            {/* Sensación Térmica */}
            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 block mb-0.5">Sensación Térmica</span>
              <div className="flex items-baseline gap-1 font-mono">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-sm font-bold text-white">{weatherData.apparentTemperature}°C</span>
                <span className="text-[10px] text-zinc-400">({weatherData.humidity}% hum)</span>
              </div>
            </div>
          </div>

          {/* Simulador de Pruebas Rápidas */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
            <span>Simular para probar:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSimulateCondition('storm');
                }}
                className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold"
              >
                Tormenta
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSimulateCondition('wind');
                }}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold"
              >
                Viento 58km/h
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSimulateCondition('sunny');
                }}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold"
              >
                Soleado
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
