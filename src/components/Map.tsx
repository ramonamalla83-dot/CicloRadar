import { useEffect, useState, useRef, useMemo } from 'react';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Navigation, 
  AlertCircle, 
  X, 
  ShieldAlert, 
  EyeOff, 
  Sun, 
  Moon, 
  Flame, 
  Layers, 
  TrendingUp, 
  Compass, 
  Globe, 
  Mountain, 
  LocateFixed, 
  Check, 
  Sparkles,
  Zap,
  Volume2,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Radio,
  Bell,
  Users,
  Flag
} from 'lucide-react';
import { generateHeatmapGeoJson, getCyclingCorridors } from '../utils/heatmapData';
import { audioEngine, ALARM_PRESETS } from '../utils/audio';
import WeatherWidget from './WeatherWidget';
import { useCyclingTheme } from '../hooks/useCyclingTheme';
import { useHazards } from '../hooks/useHazards';
import { SafetyHazard, HazardType, HazardSeverity } from '../services/hazardsService';
import HazardMarker from './HazardMarker';
import HazardDetailModal from './HazardDetailModal';
import ReportHazardModal from './ReportHazardModal';
import { useGroupRide } from '../hooks/useGroupRide';
import { RideGroupMember, PingType, GroupDiscipline } from '../services/groupRideService';
import GroupMemberMarker from './GroupMemberMarker';
import GroupSquadDrawer from './GroupSquadDrawer';
import GroupRideModal from './GroupRideModal';
import { useAltimetryEta } from '../hooks/useAltimetryEta';
import DestinationMarker from './DestinationMarker';
import EtaAltimetryDrawer from './EtaAltimetryDrawer';

export type MapLayerType = 'streets' | 'dark' | 'satellite' | 'relief';

// Estilo Calles (Día) - OpenStreetMap
const streetsMapStyle = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19
    }
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster',
      source: 'osm'
    }
  ]
};

// Estilo Oscuro (Noche) - Carto Dark
const darkMapStyle = {
  version: 8,
  sources: {
    carto_dark: {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; CARTO &copy; OpenStreetMap',
      maxzoom: 19
    }
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto_dark'
    }
  ]
};

// Estilo Satélite - Google Satellite tiles
const satelliteMapStyle = {
  version: 8,
  sources: {
    google_satellite: {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
      ],
      tileSize: 256,
      attribution: '&copy; Google Maps Satélite',
      maxzoom: 20
    }
  },
  layers: [
    {
      id: 'google-satellite-layer',
      type: 'raster',
      source: 'google_satellite'
    }
  ]
};

// Estilo Relieve / Terreno - Google Terrain / Relief tiles
const reliefMapStyle = {
  version: 8,
  sources: {
    google_relief: {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
      ],
      tileSize: 256,
      attribution: '&copy; Google Maps Relieve',
      maxzoom: 20
    }
  },
  layers: [
    {
      id: 'google-relief-layer',
      type: 'raster',
      source: 'google_relief'
    }
  ]
};

const heatmapLayer: LayerProps = {
  id: 'cycling-heatmap-layer',
  type: 'heatmap',
  paint: {
    'heatmap-weight': [
      'interpolate',
      ['linear'],
      ['get', 'intensity'],
      0, 0,
      1, 1
    ],
    'heatmap-intensity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      9, 0.8,
      13, 1.8,
      16, 3.2
    ],
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(0, 0, 0, 0)',
      0.15, 'rgba(34, 197, 94, 0.55)',
      0.35, 'rgba(56, 189, 248, 0.75)',
      0.6, 'rgba(250, 204, 21, 0.88)',
      0.8, 'rgba(249, 115, 22, 0.96)',
      1.0, 'rgba(239, 68, 68, 1)'
    ],
    'heatmap-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      9, 12,
      13, 24,
      16, 42
    ],
    'heatmap-opacity': 0.88
  }
};

const routeLineLayer: LayerProps = {
  id: 'cycling-routes-layer',
  type: 'line',
  paint: {
    'line-color': '#f97316',
    'line-width': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 2.5,
      13, 4,
      16, 5.5
    ],
    'line-opacity': 0.75,
    'line-dasharray': [2, 1]
  }
};

const squadLineLayer: LayerProps = {
  id: 'squad-line-layer',
  type: 'line',
  paint: {
    'line-color': '#06b6d4',
    'line-width': 3,
    'line-opacity': 0.7,
    'line-dasharray': [2, 2]
  }
};

const destinationRouteGlowLayer: LayerProps = {
  id: 'destination-route-glow-layer',
  type: 'line',
  paint: {
    'line-color': '#fdba74',
    'line-width': 8,
    'line-opacity': 0.35
  }
};

const destinationRouteLineLayer: LayerProps = {
  id: 'destination-route-line-layer',
  type: 'line',
  paint: {
    'line-color': '#f97316',
    'line-width': 4,
    'line-opacity': 0.95,
    'line-dasharray': [2, 1.5]
  }
};

interface LayerOption {
  id: MapLayerType;
  title: string;
  subtitle: string;
  tag: string;
  icon: typeof Sun;
  accent: string;
}

const LAYER_OPTIONS: LayerOption[] = [
  {
    id: 'streets',
    title: 'Calles (Día)',
    subtitle: 'OpenStreetMap claro',
    tag: 'Día',
    icon: Sun,
    accent: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/40'
  },
  {
    id: 'dark',
    title: 'Oscuro (Noche)',
    subtitle: 'Carto Dark de alto contraste',
    tag: 'Noche',
    icon: Moon,
    accent: 'from-indigo-500/20 to-zinc-900 text-indigo-400 border-indigo-500/40'
  },
  {
    id: 'satellite',
    title: 'Satélite',
    subtitle: 'Google Satélite en alta definición',
    tag: 'Satélite',
    icon: Globe,
    accent: 'from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/40'
  },
  {
    id: 'relief',
    title: 'Relieve',
    subtitle: 'Google Terreno con curvas y elevación',
    tag: 'Relieve',
    icon: Mountain,
    accent: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/40'
  }
];

export default function CyclingMap({ 
  trackingEnabled = true,
  alarmSound = 'radar_ios',
  onOpenPermissions,
  userName = 'Ciclista'
}: { 
  trackingEnabled?: boolean;
  alarmSound?: string;
  onOpenPermissions?: () => void;
  userName?: string;
}) {
  const [viewState, setViewState] = useState({
    longitude: -66.3369,
    latitude: -33.2994,
    zoom: 13
  });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Capa activa (Modo día por defecto como exige la directriz)
  const theme = useCyclingTheme();
  const userManualLayerRef = useRef<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<MapLayerType>(() => theme.recommendedMapLayer);
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState(false);

  // Sincronizar capa base del mapa automáticamente con la hora local y SO
  useEffect(() => {
    if (theme.mode === 'auto' && !userManualLayerRef.current) {
      setActiveLayer(theme.recommendedMapLayer);
    } else if (theme.mode === 'night' && !userManualLayerRef.current) {
      setActiveLayer('dark');
    } else if (theme.mode === 'day' && !userManualLayerRef.current) {
      setActiveLayer('streets');
    }
  }, [theme.mode, theme.recommendedMapLayer]);

  // Estado del mapa de calor y rutas en tiempo real
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [isHeatmapPanelOpen, setIsHeatmapPanelOpen] = useState(false);
  const [pulseSeed, setPulseSeed] = useState(0);

  // Mensaje flotante de feedback temporal
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [sosStatus, setSosStatus] = useState<'idle' | 'countdown' | 'active'>('idle');
  const [countdown, setCountdown] = useState(5);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Simulación en tiempo real de tráfico ciclista: pulso dinámico cada 3 segundos
  useEffect(() => {
    if (!showHeatmap) return;
    const interval = setInterval(() => {
      setPulseSeed(prev => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [showHeatmap]);

  const centerLng = userLocation ? userLocation.lng : -66.3369;
  const centerLat = userLocation ? userLocation.lat : -33.2994;

  // Hitos de Seguridad y Peligros Comunitarios en Tiempo Real
  const {
    hazards,
    liveAlert,
    clearLiveAlert,
    reportHazard,
    confirmHazard,
    resolveHazard,
    deleteHazard
  } = useHazards(centerLng, centerLat);

  const [showHazards, setShowHazards] = useState(true);
  const [selectedHazard, setSelectedHazard] = useState<SafetyHazard | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAlertsListOpen, setIsAlertsListOpen] = useState(false);

  // Alerta comunitaria entrante en tiempo real
  useEffect(() => {
    if (liveAlert) {
      showToast(`🚨 Alerta en vivo: ${liveAlert.reportedBy} reportó "${liveAlert.title}"`);
    }
  }, [liveAlert]);

  const handleReportHazardSubmit = (data: {
    type: HazardType;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    reportedBy: string;
    severity: HazardSeverity;
  }) => {
    const created = reportHazard(data);
    setIsReportModalOpen(false);
    setSelectedHazard(created);
    showToast(`¡Hito publicado en la red comunitaria!`);
    
    // Centrar mapa suavemente en el nuevo hito
    setViewState(prev => ({
      ...prev,
      longitude: data.longitude,
      latitude: data.latitude,
      zoom: 15
    }));
  };

  const handleConfirmHazard = (id: string) => {
    const success = confirmHazard(id);
    if (success) {
      showToast('Confirmaste que el peligro sigue ahí (+1)');
      // Actualizar el hito seleccionado si está abierto
      setSelectedHazard(prev => prev && prev.id === id ? { ...prev, confirmations: prev.confirmations + 1, userVoted: true } : prev);
    }
  };

  const handleResolveHazard = (id: string) => {
    resolveHazard(id);
    setSelectedHazard(null);
    showToast('Hito marcado como despejado. ¡Gracias!');
  };

  const handleDeleteHazard = (id: string) => {
    deleteHazard(id);
    setSelectedHazard(null);
    showToast('Hito eliminado correctamente');
  };

  const handleCenterOnCoords = (lat: number, lng: number) => {
    setViewState(prev => ({
      ...prev,
      longitude: lng,
      latitude: lat,
      zoom: 15
    }));
    showToast('Mapa centrado en el hito');
  };

  // Gestión de Grupo de Ruta / Pelotón en Tiempo Real
  const groupRide = useGroupRide();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isSquadDrawerOpen, setIsSquadDrawerOpen] = useState(false);
  const [selectedGroupMember, setSelectedGroupMember] = useState<RideGroupMember | null>(null);

  // Estimación de Tiempo de Llegada (ETA) & Altimetría a Destino Seleccionado
  const altimetryEta = useAltimetryEta(userLocation?.lat, userLocation?.lng);

  const handleMapClick = (e: any) => {
    if (altimetryEta.isDestinationMode) {
      const { lng, lat } = e.lngLat;
      altimetryEta.setDestination(lat, lng);
      showToast('🎯 Destino fijado. Calculando altimetría y tiempo estimado...');
    }
  };

  // Sincronizar posición del usuario con el grupo de ruta cuando cambia
  useEffect(() => {
    if (userLocation && groupRide.isInGroup) {
      groupRide.updateUserLocation(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, groupRide.isInGroup]);

  // Línea conectora del Pelotón (LineString GeoJSON que une a los amigos en ruta)
  const squadGeoJson = useMemo(() => {
    if (!groupRide.activeGroup || groupRide.activeGroup.members.length < 2) return null;
    const coords = groupRide.activeGroup.members.map(m => [m.longitude, m.latitude]);
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: coords
      }
    };
  }, [groupRide.activeGroup]);

  // Helper para distancia entre dos coordenadas
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.round(R * c);
    return dist < 1000 ? `${dist} m` : `${(dist / 1000).toFixed(1)} km`;
  };

  const handleFitSquadBounds = () => {
    if (!groupRide.activeGroup || groupRide.activeGroup.members.length === 0) return;
    const lats = groupRide.activeGroup.members.map(m => m.latitude);
    const lngs = groupRide.activeGroup.members.map(m => m.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    setViewState(prev => ({
      ...prev,
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      zoom: 14
    }));
    showToast('Visualizando a todo el pelotón');
  };

  const corridors = useMemo(() => {
    return getCyclingCorridors(centerLng, centerLat);
  }, [centerLng, centerLat]);

  const { heatmapData, routesData, totalCyclists } = useMemo(() => {
    return generateHeatmapGeoJson(centerLng, centerLat, pulseSeed);
  }, [centerLng, centerLat, pulseSeed]);

  // Reproducir alarma con maximizador de volumen cuando SOS está activo
  useEffect(() => {
    if (sosStatus === 'active') {
      audioEngine.play(alarmSound);
    } else {
      audioEngine.stop();
    }
    return () => {
      audioEngine.stop();
    };
  }, [sosStatus, alarmSound]);

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
    audioEngine.stop();
  };

  const handleCenterOnCorridor = (coords: [number, number][]) => {
    if (coords && coords.length > 0) {
      const mid = coords[Math.floor(coords.length / 2)];
      setViewState(prev => ({
        ...prev,
        longitude: mid[0],
        latitude: mid[1],
        zoom: 14
      }));
    }
  };

  const handleRecenterUser = () => {
    if (userLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: userLocation.lng,
        latitude: userLocation.lat,
        zoom: 15
      }));
      showToast('Ubicación centrada en GPS');
    } else {
      showToast('Obteniendo señal GPS...');
    }
  };

  // Función mejorada del botón de mapa de calor
  const handleToggleHeatmap = () => {
    const nextState = !showHeatmap;
    setShowHeatmap(nextState);
    if (nextState) {
      showToast('Mapa de calor activado: rutas comunitarias en vivo');
    } else {
      showToast('Mapa de calor desactivado');
    }
  };

  const handleSelectLayer = (layerId: MapLayerType) => {
    userManualLayerRef.current = true;
    setActiveLayer(layerId);
    setIsLayersMenuOpen(false);
    const selected = LAYER_OPTIONS.find(l => l.id === layerId);
    showToast(`Capa activada: ${selected ? selected.title : layerId}`);
  };

  // Determinar el estilo actual según la capa seleccionada
  const currentMapStyle = useMemo(() => {
    switch (activeLayer) {
      case 'dark':
        return darkMapStyle;
      case 'satellite':
        return satelliteMapStyle;
      case 'relief':
        return reliefMapStyle;
      case 'streets':
      default:
        return streetsMapStyle;
    }
  }, [activeLayer]);

  return (
    <div className="relative w-full h-full bg-zinc-950 overflow-hidden">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={currentMapStyle as any}
        style={{ width: '100%', height: '100%' }}
        cursor={altimetryEta.isDestinationMode ? 'crosshair' : 'grab'}
      >
        <NavigationControl position="bottom-right" />

        {/* Capa de Corredores de Rutas (LineString) */}
        {showCorridors && showHeatmap && (
          <Source id="routes-source" type="geojson" data={routesData}>
            <Layer {...routeLineLayer} />
          </Source>
        )}

        {/* Capa de Mapa de Calor en Tiempo Real (Heatmap) */}
        {showHeatmap && (
          <Source id="heatmap-source" type="geojson" data={heatmapData}>
            <Layer {...heatmapLayer} />
          </Source>
        )}

        {/* Capa de Ruta y Altimetría a Destino Seleccionado */}
        {altimetryEta.calculationResult && (
          <Source id="destination-route-source" type="geojson" data={altimetryEta.calculationResult.routeGeoJson}>
            <Layer {...destinationRouteGlowLayer} />
            <Layer {...destinationRouteLineLayer} />
          </Source>
        )}
        
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

        {/* Marcador de Destino Seleccionado con Altimetría y ETA */}
        {altimetryEta.calculationResult && (
          <DestinationMarker
            calculation={altimetryEta.calculationResult}
            onClick={() => altimetryEta.setIsDrawerOpen(true)}
          />
        )}

        {/* Capa de Conexión del Pelotón (Línea de Grupo de Ruta) */}
        {squadGeoJson && (
          <Source id="squad-source" type="geojson" data={squadGeoJson}>
            <Layer {...squadLineLayer} />
          </Source>
        )}

        {/* Hitos de Seguridad y Peligros Comunitarios con Iconos Personalizados */}
        {showHazards && hazards.map((hazard) => (
          <HazardMarker
            key={hazard.id}
            hazard={hazard}
            isSelected={selectedHazard?.id === hazard.id}
            onClick={(h) => setSelectedHazard(h)}
          />
        ))}

        {/* Marcadores en Tiempo Real de Amigos en Grupo de Ruta */}
        {groupRide.activeGroup && groupRide.activeGroup.members
          .filter(m => !m.isCurrentUser)
          .map((member) => (
            <GroupMemberMarker
              key={member.id}
              member={member}
              distanceFromUser={userLocation ? calculateDistance(userLocation.lat, userLocation.lng, member.latitude, member.longitude) : undefined}
              isSelected={selectedGroupMember?.id === member.id}
              onClick={(m) => {
                setSelectedGroupMember(m);
                setIsSquadDrawerOpen(true);
              }}
            />
          ))}
      </Map>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-zinc-900/95 border border-orange-500/50 text-white px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Floating Destination Mode Guide Banner */}
      {altimetryEta.isDestinationMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-orange-500 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0"></span>
          <span className="text-xs font-bold whitespace-nowrap">Toca el mapa para fijar tu destino ciclista</span>
          <button
            onClick={() => altimetryEta.setIsDestinationMode(false)}
            className="p-1 rounded-full hover:bg-orange-600 transition-colors ml-1"
            title="Cancelar selección de destino"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Controls Toolbar (Esquina Superior Derecha) */}
      <div className="absolute top-20 right-4 flex flex-col gap-2.5 z-20">
        {/* 1. Botón de Capas (Satelite, Relieve, Calles, Noche) */}
        <div className="relative">
          <button 
            onClick={() => {
              setIsLayersMenuOpen(prev => !prev);
              if (isHeatmapPanelOpen) setIsHeatmapPanelOpen(false);
            }}
            className={`p-3 rounded-full shadow-lg border transition-all flex items-center justify-center w-12 h-12 ${
              isLayersMenuOpen || activeLayer === 'satellite' || activeLayer === 'relief'
                ? 'bg-zinc-800 text-orange-400 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.35)]' 
                : 'bg-zinc-900/90 text-zinc-200 border-zinc-700 hover:bg-zinc-800 hover:text-white'
            }`}
            title="Capas del mapa (Satélite, Relieve, Calles, Oscuro)"
            aria-label="Seleccionar capa del mapa"
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* Menú Flotante de Selección de Capas */}
          {isLayersMenuOpen && (
            <div className="absolute right-0 top-14 w-72 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-3 shadow-2xl z-30 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-zinc-200 font-bold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-orange-500" />
                  <span>Capas de Mapa</span>
                </div>
                <button 
                  onClick={() => setIsLayersMenuOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Control de Tema Automático Día/Noche */}
              <div className="p-2 mb-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  {theme.isNightActive ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  <span className="text-[11px]">Tema: <strong className="text-white">{theme.mode === 'auto' ? `Auto (${theme.isNightActive ? 'Noche' : 'Día'})` : theme.mode === 'night' ? 'Noche OLED' : 'Día Claro'}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    theme.cycleMode();
                    userManualLayerRef.current = false;
                    showToast(`Tema cambiado`);
                  }}
                  className="text-[10px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded transition-colors"
                >
                  Cambiar
                </button>
              </div>

              <div className="space-y-1.5">
                {LAYER_OPTIONS.map((layer) => {
                  const Icon = layer.icon;
                  const isSelected = activeLayer === layer.id;
                  return (
                    <button
                      key={layer.id}
                      onClick={() => handleSelectLayer(layer.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected 
                          ? `bg-gradient-to-r ${layer.accent} border-orange-500/80 shadow-md` 
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{layer.title}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-orange-500/30 text-orange-300' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {layer.tag}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">{layer.subtitle}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400 flex items-center justify-between">
                <span>Teselas de alta precisión</span>
                <span className="text-orange-400 font-medium">Google & OSM</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Botón Rediseñado de Mapa de Calor (Toggle directo con estado visual claro) */}
        <div className="relative group">
          <button 
            onClick={handleToggleHeatmap}
            className={`p-3 rounded-full shadow-lg border transition-all flex items-center justify-center w-12 h-12 relative ${
              showHeatmap 
                ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white border-orange-400 shadow-[0_0_18px_rgba(249,115,22,0.6)] animate-pulse' 
                : 'bg-zinc-900/90 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
            title={showHeatmap ? 'Desactivar mapa de calor' : 'Activar mapa de calor comunitario'}
            aria-label="Alternar mapa de calor"
          >
            <Flame className={`w-5 h-5 ${showHeatmap ? 'fill-white text-white drop-shadow' : 'text-zinc-400'}`} />
            
            {/* Indicador de estado ON/OFF en miniatura */}
            <span className={`absolute -top-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-full border shadow-sm ${
              showHeatmap 
                ? 'bg-green-500 text-zinc-950 border-green-300' 
                : 'bg-zinc-700 text-zinc-300 border-zinc-600'
            }`}>
              {showHeatmap ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* 3. Botón de Hitos de Seguridad y Peligros Comunitarios */}
        <div className="relative group">
          <button 
            onClick={() => {
              const next = !showHazards;
              setShowHazards(next);
              showToast(next ? 'Hitos y peligros comunitarios visibles' : 'Hitos ocultos');
            }}
            className={`p-3 rounded-full shadow-lg border transition-all flex items-center justify-center w-12 h-12 relative ${
              showHazards 
                ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.5)]' 
                : 'bg-zinc-900/90 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
            title={showHazards ? 'Ocultar hitos y alertas de seguridad' : 'Mostrar hitos y peligros comunitarios'}
            aria-label="Alternar hitos de seguridad"
          >
            <AlertTriangle className={`w-5 h-5 ${showHazards ? 'fill-white text-white drop-shadow' : 'text-zinc-400'}`} />
            
            {/* Badge con cantidad de alertas activas */}
            <span className={`absolute -top-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-full border shadow-sm ${
              showHazards 
                ? 'bg-amber-400 text-zinc-950 border-amber-200' 
                : 'bg-zinc-700 text-zinc-300 border-zinc-600'
            }`}>
              {hazards.length}
            </span>
          </button>
        </div>

        {/* 4. Botón de Grupo de Ruta / Pelotón con Amigos */}
        <div className="relative group">
          <button
            onClick={() => {
              if (groupRide.isInGroup) {
                setIsSquadDrawerOpen(prev => !prev);
                if (isHeatmapPanelOpen) setIsHeatmapPanelOpen(false);
                if (isAlertsListOpen) setIsAlertsListOpen(false);
              } else {
                setIsGroupModalOpen(true);
              }
            }}
            className={`p-3 rounded-full shadow-lg border transition-all flex items-center justify-center w-12 h-12 relative ${
              groupRide.isInGroup
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.55)]'
                : 'bg-zinc-900/90 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
            title={groupRide.isInGroup ? 'Ver pelotón y amigos en tiempo real' : 'Crear o unirme a grupo de ruta'}
            aria-label="Grupo de Ruta"
          >
            <Users className={`w-5 h-5 ${groupRide.isInGroup ? 'text-white' : 'text-zinc-400'}`} />

            <span className={`absolute -top-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-full border shadow-sm ${
              groupRide.isInGroup
                ? 'bg-cyan-400 text-zinc-950 border-cyan-200 animate-pulse'
                : 'bg-zinc-700 text-zinc-300 border-zinc-600'
            }`}>
              {groupRide.isInGroup ? groupRide.activeGroup?.members.length : '+'}
            </span>
          </button>
        </div>

        {/* 5. Botón de Estimación de Llegada (ETA) & Altimetría a Destino */}
        <div className="relative group">
          <button
            onClick={() => {
              if (altimetryEta.destination) {
                altimetryEta.setIsDrawerOpen(true);
              } else {
                const next = !altimetryEta.isDestinationMode;
                altimetryEta.setIsDestinationMode(next);
                if (next) {
                  showToast('🎯 Toca cualquier punto del mapa para estimar tiempo y altimetría');
                }
              }
            }}
            className={`p-3 rounded-full shadow-lg border transition-all flex items-center justify-center w-12 h-12 relative ${
              altimetryEta.destination || altimetryEta.isDestinationMode
                ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white border-orange-400 shadow-[0_0_18px_rgba(249,115,22,0.55)]'
                : 'bg-zinc-900/90 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
            title={altimetryEta.destination ? 'Ver tiempo estimado (ETA) y altimetría' : 'Calcular ETA a destino y perfil de elevación'}
            aria-label="Calcular ETA y Altimetría"
          >
            <Flag className={`w-5 h-5 ${altimetryEta.destination || altimetryEta.isDestinationMode ? 'fill-white text-white' : 'text-zinc-400'}`} />

            <span className={`absolute -top-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-full border shadow-sm ${
              altimetryEta.destination
                ? 'bg-orange-400 text-zinc-950 border-orange-200 animate-pulse'
                : altimetryEta.isDestinationMode
                  ? 'bg-amber-300 text-zinc-950 border-amber-200 animate-ping'
                  : 'bg-zinc-700 text-zinc-300 border-zinc-600'
            }`}>
              {altimetryEta.destination ? 'ETA' : 'GO'}
            </span>
          </button>
        </div>

        {/* 6. Botón de Corredores y Telemetría de Rutas */}
        <button 
          onClick={() => {
            setIsHeatmapPanelOpen(prev => !prev);
            if (isLayersMenuOpen) setIsLayersMenuOpen(false);
            if (isAlertsListOpen) setIsAlertsListOpen(false);
            if (isSquadDrawerOpen) setIsSquadDrawerOpen(false);
          }}
          className={`p-3 rounded-full shadow-lg border transition-all flex items-center justify-center w-12 h-12 ${
            isHeatmapPanelOpen 
              ? 'bg-zinc-800 text-orange-400 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.35)]' 
              : 'bg-zinc-900/90 text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-white'
          }`}
          title="Ver rutas populares y estadísticas"
          aria-label="Ver rutas y estadísticas"
        >
          <TrendingUp className="w-5 h-5" />
        </button>

        {/* 6. Botón de Recentrado GPS */}
        <button 
          onClick={handleRecenterUser}
          className="bg-zinc-900/90 text-zinc-200 hover:text-white p-3 rounded-full shadow-lg border border-zinc-700 hover:bg-zinc-800 transition-all flex items-center justify-center w-12 h-12"
          title="Centrar mapa en mi ubicación"
          aria-label="Centrar en mi ubicación"
        >
          <LocateFixed className="w-5 h-5" />
        </button>

        {/* 7. Botón de Permisos e Instalación SOS */}
        {onOpenPermissions && (
          <button 
            onClick={onOpenPermissions}
            className="bg-zinc-900/90 text-orange-400 hover:text-white p-3 rounded-full shadow-lg border border-zinc-700 hover:border-orange-500/50 hover:bg-zinc-800 transition-all flex items-center justify-center w-12 h-12"
            title="Instalación y permisos de emergencia"
            aria-label="Permisos e Instalación"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Top Left Floating Area: Weather Widget & Live Community Cyclists */}
      <div className="absolute top-20 left-4 z-20 flex flex-col gap-2 items-start pointer-events-auto max-w-[calc(100vw-5rem)]">
        {/* Widget de Clima, Riesgo de Tormenta y Vientos Fuertes */}
        <WeatherWidget userLocation={userLocation} />

        {/* Live Group Ride Squad Pill (Si hay grupo de ruta activo) */}
        {groupRide.activeGroup && !isSquadDrawerOpen ? (
          <button
            onClick={() => {
              setIsSquadDrawerOpen(true);
              if (isHeatmapPanelOpen) setIsHeatmapPanelOpen(false);
              if (isAlertsListOpen) setIsAlertsListOpen(false);
            }}
            className="bg-zinc-900/95 backdrop-blur-md border border-cyan-500/60 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-zinc-800 hover:border-cyan-400 transition-all text-xs"
            title="Ver amigos y pelotón en tiempo real"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-extrabold text-cyan-200 text-[11px] truncate max-w-[130px]">
              {groupRide.activeGroup.name}
            </span>
            <span className="text-[9px] font-black text-zinc-950 bg-cyan-400 px-1.5 py-0.5 rounded-full">
              {groupRide.activeGroup.members.length} EN RUTA
            </span>
          </button>
        ) : !groupRide.activeGroup && (
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 text-zinc-300 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-zinc-800 hover:border-cyan-500/50 hover:text-white transition-all text-xs"
            title="Crear o unirse a salida grupal con amigos"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-[11px]">Salida Grupal</span>
            <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/20 px-1.5 py-0.5 rounded-full">
              + UNIRSE
            </span>
          </button>
        )}

        {/* Live Community Heatmap Status Pill */}
        {showHeatmap && !isHeatmapPanelOpen && (
          <button 
            onClick={() => {
              setIsHeatmapPanelOpen(true);
              if (isAlertsListOpen) setIsAlertsListOpen(false);
              if (isSquadDrawerOpen) setIsSquadDrawerOpen(false);
            }}
            className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-zinc-800 hover:border-orange-500/50 transition-all text-xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="font-semibold text-zinc-200 text-[11px]">
              {totalCyclists} ciclistas en ruta
            </span>
            <span className="text-[9px] font-bold text-orange-400 bg-orange-500/20 px-1.5 py-0.5 rounded-full">
              EN VIVO
            </span>
          </button>
        )}

        {/* Live Community Hazards Radar Pill */}
        {hazards.length > 0 && !isAlertsListOpen && (
          <button 
            onClick={() => {
              setIsAlertsListOpen(true);
              if (isHeatmapPanelOpen) setIsHeatmapPanelOpen(false);
              if (isSquadDrawerOpen) setIsSquadDrawerOpen(false);
            }}
            className="bg-zinc-900/90 backdrop-blur-md border border-amber-500/40 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-zinc-800 hover:border-amber-400 transition-all text-xs"
            title="Ver peligros e hitos reportados en la zona"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-zinc-200 text-[11px]">
              {hazards.length} hitos de seguridad
            </span>
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded-full">
              RADAR
            </span>
          </button>
        )}
      </div>

      {/* Heatmap Drawer / Detailed Information Panel */}
      {isHeatmapPanelOpen && (
        <div className="absolute top-20 left-4 right-18 sm:left-auto sm:right-20 sm:w-84 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 text-white rounded-2xl p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-top-4 duration-200 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-500/20 text-orange-500 rounded-lg">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Rutas Frecuentadas</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[11px] text-zinc-400 font-medium">Comunidad en tiempo real</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsHeatmapPanelOpen(false)}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 my-3">
            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">Ciclistas Activos</span>
              <span className="text-xl font-black text-orange-400">{totalCyclists}</span>
            </div>
            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">Corredores</span>
              <span className="text-xl font-black text-zinc-100">{corridors.length} zonas</span>
            </div>
          </div>

          {/* Heatmap Legend */}
          <div className="mb-3 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
            <span className="text-[11px] font-semibold text-zinc-300 block mb-1.5">Intensidad de Tránsito</span>
            <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-400 via-yellow-400 via-orange-500 to-red-600 mb-1 shadow-inner"></div>
            <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
              <span>Tranquilo</span>
              <span>Moderado</span>
              <span className="text-red-400 font-semibold">Muy Frecuentado</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 mb-3">
            <label className="flex items-center justify-between text-xs text-zinc-300 bg-zinc-900/50 p-2.5 rounded-xl cursor-pointer hover:bg-zinc-900 transition-colors">
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                Mapa de calor térmico
              </span>
              <input 
                type="checkbox" 
                checked={showHeatmap} 
                onChange={(e) => {
                  setShowHeatmap(e.target.checked);
                  showToast(e.target.checked ? 'Mapa de calor activado' : 'Mapa de calor desactivado');
                }}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between text-xs text-zinc-300 bg-zinc-900/50 p-2.5 rounded-xl cursor-pointer hover:bg-zinc-900 transition-colors">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                Trazas de ciclovías
              </span>
              <input 
                type="checkbox" 
                checked={showCorridors} 
                onChange={(e) => setShowCorridors(e.target.checked)}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Popular Routes List */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Top Corredores de Hoy
            </span>
            <div className="space-y-1.5">
              {corridors.slice(0, 3).map((corridor) => (
                <div 
                  key={corridor.id}
                  className="bg-zinc-900/70 hover:bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-200 truncate">{corridor.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        corridor.trafficLevel === 'Muy Alto' 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      }`}>
                        {corridor.trafficLevel}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {corridor.activeCyclists} ciclistas
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCenterOnCorridor(corridor.coordinates)}
                    className="p-1.5 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                    title="Ver en el mapa"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Ver</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Community Hazards List Drawer */}
      {isAlertsListOpen && (
        <div className="absolute top-20 left-4 right-18 sm:left-auto sm:right-20 sm:w-88 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 text-white rounded-2xl p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-top-4 duration-200 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Alertas Comunitarias</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-[11px] text-zinc-400 font-medium">Hitos de seguridad en vivo</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsAlertsListOpen(false)}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Botón rápido para reportar desde el panel */}
          <div className="my-3">
            <button
              onClick={() => {
                setIsAlertsListOpen(false);
                setIsReportModalOpen(true);
              }}
              className="w-full h-10 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>Reportar Peligro en mi Ruta</span>
            </button>
          </div>

          {/* Lista de alertas comunitarias activas */}
          <div className="space-y-2">
            {hazards.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs">
                No hay peligros reportados en esta zona. ¡Ruta despejada!
              </div>
            ) : (
              hazards.map((hazard) => (
                <div
                  key={hazard.id}
                  onClick={() => {
                    setSelectedHazard(hazard);
                    handleCenterOnCoords(hazard.latitude, hazard.longitude);
                  }}
                  className="bg-zinc-900/80 hover:bg-zinc-800/90 p-3 rounded-xl border border-zinc-800/80 cursor-pointer transition-colors flex items-start gap-2.5"
                >
                  <div className="p-2 rounded-xl bg-zinc-800 text-orange-400 shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">{hazard.title}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                        hazard.severity === 'critica'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : hazard.severity === 'alta'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {hazard.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">{hazard.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1.5">
                      <span>Por: {hazard.reportedBy}</span>
                      <span className="text-orange-400 font-semibold flex items-center gap-1">
                        <Compass className="w-3 h-3" /> Ver en mapa
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SOS Active Banner */}
      {sosStatus === 'active' && (() => {
        const activeAlarmPreset = ALARM_PRESETS.find(p => p.id === alarmSound) || ALARM_PRESETS[0];
        return (
          <div className="absolute top-0 left-0 w-full bg-red-600 text-white p-4 flex flex-col items-center justify-center shadow-2xl z-30 animate-pulse">
            <div className="flex items-center gap-2 font-black text-lg tracking-wide">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
              <span>¡ALARMA SOS EMITIENDO A VOLUMEN MÁXIMO!</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              <span className="text-xs font-bold bg-black/40 px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-yellow-300" />
                Tono: {activeAlarmPreset.name} ({activeAlarmPreset.brand})
              </span>
              <span className="text-xs font-bold bg-black/40 text-green-300 px-3 py-1 rounded-full border border-green-400/40 flex items-center gap-1">
                <Zap className="w-3 h-3 text-green-400" /> Auto-Boost Acústico +240%
              </span>
            </div>
            <p className="text-xs font-medium opacity-90 text-center mt-1.5 max-w-md">
              Transmitiendo tu ubicación satelital a ciclistas de la comunidad y contactos de emergencia con pantalla activa.
            </p>
          </div>
        );
      })()}

      {/* Tracking Disabled Banner */}
      {!trackingEnabled && sosStatus !== 'active' && (
        <div className="absolute top-4 left-4 right-4 bg-zinc-900/90 border border-zinc-800 backdrop-blur-sm text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-lg z-10">
          <EyeOff className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium">Modo incógnito: No ves ni te ven</span>
        </div>
      )}

      {/* Action Overlays - Botón de Reportar Peligro y Botón SOS Flotante */}
      <div className="absolute bottom-8 left-4 flex flex-col gap-3 z-20">
        {sosStatus === 'idle' && (
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="h-12 px-4 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(249,115,22,0.5)] border border-orange-300/40 flex items-center gap-2 transition-transform active:scale-95 hover:scale-105"
            title="Marcar un hito de seguridad, obras o peligro en el mapa"
          >
            <AlertTriangle className="w-4 h-4 fill-white shrink-0" />
            <span className="whitespace-nowrap">Reportar Peligro</span>
            <span className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-[10px] shrink-0">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          </button>
        )}

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
            className={`${sosStatus === 'countdown' ? 'hidden' : 'flex'} bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all hover:scale-105 items-center justify-center border border-red-500 w-14 h-14`}
            onClick={handleSosClick}
            title="Activar SOS de Emergencia"
            aria-label="Activar SOS"
          >
            <AlertCircle className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* SOS Countdown Overlay */}
      {sosStatus === 'countdown' && (() => {
        const activeAlarmPreset = ALARM_PRESETS.find(p => p.id === alarmSound) || ALARM_PRESETS[0];
        return (
          <div className="absolute inset-0 bg-red-950/95 backdrop-blur-md z-30 flex flex-col items-center justify-center text-white p-6">
            <ShieldAlert className="w-20 h-20 mb-4 text-red-500 animate-pulse" />
            <h2 className="text-3xl font-black mb-1 text-center text-red-500">ALERTA DE EMERGENCIA</h2>
            <p className="text-lg mb-4 text-center text-red-300">Activando protocolo SOS y alarma sonora en...</p>
            
            <div className="text-9xl font-black mb-6 tabular-nums text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">
              {countdown}
            </div>

            <div className="mb-8 flex flex-col items-center gap-1.5 text-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-white bg-black/40 border border-red-500/40 px-3.5 py-1.5 rounded-full">
                <Volume2 className="w-4 h-4 text-orange-400" />
                <span>Tono: <strong>{activeAlarmPreset.name}</strong> ({activeAlarmPreset.brand})</span>
              </div>
              <span className="text-[11px] text-red-300/90">
                🔊 El volumen acústico aumentará automáticamente al nivel más alto
              </span>
            </div>

            <button
              onClick={handleCancelSos}
              className="bg-white text-red-600 px-10 py-5 rounded-full font-bold text-xl shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform"
            >
              <X className="w-8 h-8" />
              CANCELAR
            </button>
            <p className="mt-6 text-sm text-red-300 text-center max-w-xs">
              Si no cancelas, sonará la alarma a volumen forzado y se notificará a los ciclistas cercanos con tu posición satelital.
            </p>
          </div>
        );
      })()}

      {/* Modal de Detalle de Hito de Seguridad Seleccionado */}
      {selectedHazard && (
        <HazardDetailModal
          hazard={selectedHazard}
          userLocation={userLocation}
          onClose={() => setSelectedHazard(null)}
          onConfirm={handleConfirmHazard}
          onResolve={handleResolveHazard}
          onDelete={handleDeleteHazard}
          onCenterOnMap={handleCenterOnCoords}
        />
      )}

      {/* Modal de Creación / Reporte de Hito Comunitario */}
      {isReportModalOpen && (
        <ReportHazardModal
          userLocation={userLocation}
          mapCenter={{ lat: viewState.latitude, lng: viewState.longitude }}
          cyclistName={userName}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleReportHazardSubmit}
        />
      )}

      {/* Drawer / HUD de Escuadrón de Grupo de Ruta */}
      {isSquadDrawerOpen && groupRide.activeGroup && (
        <GroupSquadDrawer
          group={groupRide.activeGroup}
          userLocation={userLocation}
          onClose={() => setIsSquadDrawerOpen(false)}
          onLeaveGroup={() => {
            groupRide.leaveGroup();
            setIsSquadDrawerOpen(false);
            showToast('Saliste del grupo de ruta');
          }}
          onSendPing={(type, msg) => {
            groupRide.sendPing(type, msg);
            showToast('Aviso transmitido al pelotón');
          }}
          onCenterOnMember={(lat, lng) => {
            setViewState(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              zoom: 15
            }));
            showToast('Mapa centrado en compañero');
          }}
          onFitSquadBounds={handleFitSquadBounds}
        />
      )}

      {/* Modal para Crear o Unirse a Grupo de Ruta */}
      {isGroupModalOpen && (
        <GroupRideModal
          userName={userName}
          userCoords={{
            lat: userLocation ? userLocation.lat : viewState.latitude,
            lng: userLocation ? userLocation.lng : viewState.longitude
          }}
          publicGroups={groupRide.getPublicGroups()}
          onClose={() => setIsGroupModalOpen(false)}
          onCreateGroup={(params) => {
            const grp = groupRide.createGroup(params);
            setIsGroupModalOpen(false);
            setIsSquadDrawerOpen(true);
            showToast(`¡Grupo "${grp.name}" creado! Código: ${grp.code}`);
          }}
          onJoinGroup={(code) => {
            const grp = groupRide.joinGroup(code, userName, {
              lat: userLocation ? userLocation.lat : viewState.latitude,
              lng: userLocation ? userLocation.lng : viewState.longitude
            });
            if (grp) {
              setIsGroupModalOpen(false);
              setIsSquadDrawerOpen(true);
              showToast(`¡Conectado a ${grp.name}!`);
            }
          }}
        />
      )}

      {/* Drawer de Estimación de Llegada (ETA) & Altimetría a Destino */}
      {altimetryEta.calculationResult && (
        <EtaAltimetryDrawer
          calculation={altimetryEta.calculationResult}
          isOpen={altimetryEta.isDrawerOpen}
          onClose={altimetryEta.clearDestination}
          onToggleOpen={() => altimetryEta.setIsDrawerOpen(!altimetryEta.isDrawerOpen)}
          onChangeDestination={() => {
            altimetryEta.setIsDestinationMode(true);
            showToast('🎯 Toca un nuevo punto en el mapa para actualizar el destino');
          }}
          onPaceModeChange={(mode) => altimetryEta.setPaceMode(mode)}
          onStartNavigation={() => {
            showToast(`Navegación iniciada: ETA ${altimetryEta.calculationResult?.estimatedArrivalTime}`);
          }}
        />
      )}
    </div>
  );
}
