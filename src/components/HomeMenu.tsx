import { useState, FormEvent, useMemo } from 'react';
import { 
  Bike, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Flame, 
  Mountain, 
  Route, 
  Calendar, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Navigation, 
  Map as MapIcon, 
  Users, 
  ShieldAlert, 
  Settings,
  Share2,
  RefreshCw,
  ExternalLink,
  Zap,
  Heart,
  Radio,
  Sparkles,
  Link2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useExternalSync } from '../hooks/useExternalSync';
import { PROVIDERS_CONFIG, SyncProvider } from '../services/externalSyncService';
import SyncAccountsModal from './SyncAccountsModal';

interface SavedRoute {
  id: string;
  name: string;
  distanceKm: number;
  durationMinutes: number;
  elevationMeters: number;
  date: string;
  type: 'urbana' | 'ruta' | 'gravel';
  avgSpeedKmh: number;
  safetyScore: number;
  favorite?: boolean;
  provider?: SyncProvider | 'cicloradar';
  deviceModel?: string;
  avgPowerWatts?: number;
  avgHeartRateBpm?: number;
}

type Period = '7d' | '4w' | '12m';
type ChartMetric = 'distance' | 'time' | 'elevation';

const WEEKLY_DATA = [
  { label: 'Lun', distance: 18.4, time: 52, elevation: 120, speed: 21.2 },
  { label: 'Mar', distance: 24.1, time: 68, elevation: 210, speed: 21.3 },
  { label: 'Mié', distance: 15.0, time: 44, elevation: 95, speed: 20.5 },
  { label: 'Jue', distance: 31.8, time: 86, elevation: 340, speed: 22.2 },
  { label: 'Vie', distance: 22.5, time: 61, elevation: 180, speed: 22.1 },
  { label: 'Sáb', distance: 48.2, time: 134, elevation: 580, speed: 21.6 },
  { label: 'Dom', distance: 24.2, time: 70, elevation: 265, speed: 20.7 },
];

const MONTHLY_DATA = [
  { label: 'Sem 1', distance: 142.5, time: 395, elevation: 1420, speed: 21.6 },
  { label: 'Sem 2', distance: 168.0, time: 462, elevation: 1780, speed: 21.8 },
  { label: 'Sem 3', distance: 155.4, time: 430, elevation: 1590, speed: 21.7 },
  { label: 'Sem 4', distance: 184.2, time: 515, elevation: 1890, speed: 21.5 },
];

const YEARLY_DATA = [
  { label: 'Ene', distance: 410, time: 1140, elevation: 4200, speed: 21.6 },
  { label: 'Feb', distance: 460, time: 1280, elevation: 4900, speed: 21.6 },
  { label: 'Mar', distance: 530, time: 1470, elevation: 5600, speed: 21.6 },
  { label: 'Abr', distance: 590, time: 1620, elevation: 6200, speed: 21.9 },
  { label: 'May', distance: 680, time: 1880, elevation: 7100, speed: 21.7 },
  { label: 'Jun', distance: 740, time: 2040, elevation: 7800, speed: 21.8 },
  { label: 'Jul', distance: 820, time: 2260, elevation: 8600, speed: 21.8 },
  { label: 'Ago', distance: 790, time: 2180, elevation: 8300, speed: 21.7 },
  { label: 'Sep', distance: 690, time: 1910, elevation: 7200, speed: 21.7 },
  { label: 'Oct', distance: 620, time: 1720, elevation: 6500, speed: 21.6 },
  { label: 'Nov', distance: 580, time: 1610, elevation: 6100, speed: 21.6 },
  { label: 'Dic', distance: 520, time: 1450, elevation: 5400, speed: 21.5 },
];

const INITIAL_SAVED_ROUTES: SavedRoute[] = [
  {
    id: 'route-1',
    name: 'Corredor Costanera & Mirador del Río',
    distanceKm: 34.6,
    durationMinutes: 94,
    elevationMeters: 310,
    date: 'Ayer, 18:30',
    type: 'ruta',
    avgSpeedKmh: 22.1,
    safetyScore: 4.8,
    favorite: true,
  },
  {
    id: 'route-2',
    name: 'Ciclovía Expresa Norte Urbana',
    distanceKm: 18.2,
    durationMinutes: 48,
    elevationMeters: 85,
    date: '3 Nov 2026',
    type: 'urbana',
    avgSpeedKmh: 22.7,
    safetyScore: 4.9,
    favorite: true,
  },
  {
    id: 'route-3',
    name: 'Circuito Serranías & Senda Gravel',
    distanceKm: 48.2,
    durationMinutes: 134,
    elevationMeters: 580,
    date: '1 Nov 2026',
    type: 'gravel',
    avgSpeedKmh: 21.6,
    safetyScore: 4.5,
    favorite: false,
  },
  {
    id: 'route-4',
    name: 'Travesía Parque Central & Bosque',
    distanceKm: 24.1,
    durationMinutes: 68,
    elevationMeters: 210,
    date: '28 Oct 2026',
    type: 'ruta',
    avgSpeedKmh: 21.3,
    safetyScore: 4.7,
    favorite: false,
  },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      label: string;
      distance: number;
      time: number;
      elevation: number;
      speed: number;
    };
  }>;
  metric: ChartMetric;
}

function CustomTooltip({ active, payload, metric }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hours = Math.floor(data.time / 60);
    const minutes = data.time % 60;
    const timeFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;

    return (
      <div className="bg-zinc-900/95 backdrop-blur-md p-3 rounded-xl border border-zinc-700 shadow-2xl text-xs space-y-1.5 min-w-[150px]">
        <p className="font-bold text-white text-sm border-b border-zinc-800 pb-1 flex items-center justify-between">
          <span>{data.label}</span>
          <span className="text-orange-400 font-mono">{data.distance.toFixed(1)} km</span>
        </p>
        <div className="space-y-1 text-zinc-300">
          <div className="flex justify-between">
            <span className="text-zinc-400">Tiempo:</span>
            <span className="font-mono text-white">{timeFormatted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Elevación:</span>
            <span className="font-mono text-emerald-400">+{data.elevation} m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Vel. Media:</span>
            <span className="font-mono text-white">{data.speed} km/h</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function HomeMenu({ 
  onNavigate, 
  onSimulateSos 
}: { 
  onNavigate: (screen: string) => void;
  onSimulateSos?: () => void;
}) {
  const sync = useExternalSync();
  const [period, setPeriod] = useState<Period>('7d');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('distance');
  const [routeFilter, setRouteFilter] = useState<'todas' | 'ruta' | 'urbana' | 'gravel'>('todas');
  const [sourceFilter, setSourceFilter] = useState<'todas' | SyncProvider | 'manual'>('todas');
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(INITIAL_SAVED_ROUTES);
  const [isNewRouteModalOpen, setIsNewRouteModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [newRouteForm, setNewRouteForm] = useState({
    name: '',
    distanceKm: '25.0',
    durationMinutes: '65',
    elevationMeters: '180',
    type: 'ruta' as 'urbana' | 'ruta' | 'gravel',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Convertir actividades sincronizadas a rutas unificadas
  const syncedRoutes: SavedRoute[] = useMemo(() => {
    return sync.activities.map((act) => ({
      id: act.id,
      name: act.name,
      distanceKm: act.distanceKm,
      durationMinutes: act.durationMinutes,
      elevationMeters: act.elevationMeters,
      date: act.date,
      type: act.type,
      avgSpeedKmh: act.avgSpeedKmh,
      safetyScore: act.safetyScore,
      favorite: act.favorite,
      provider: act.provider,
      deviceModel: act.deviceModel,
      avgPowerWatts: act.avgPowerWatts,
      avgHeartRateBpm: act.avgHeartRateBpm,
    }));
  }, [sync.activities]);

  const allRoutes = useMemo(() => {
    const manualRoutes = savedRoutes.map((r) => ({
      ...r,
      provider: ('cicloradar' as const)
    }));
    return [...syncedRoutes, ...manualRoutes];
  }, [syncedRoutes, savedRoutes]);

  const currentChartData = period === '7d' 
    ? WEEKLY_DATA 
    : period === '4w' 
      ? MONTHLY_DATA 
      : YEARLY_DATA;

  // Totales acumulados sumando telemetría de Strava, Garmin Connect e iGPSPORT
  const syncedTotalKm = useMemo(() => {
    return sync.activities.reduce((acc, a) => acc + a.distanceKm, 0);
  }, [sync.activities]);

  const syncedTotalMinutes = useMemo(() => {
    return sync.activities.reduce((acc, a) => acc + a.durationMinutes, 0);
  }, [sync.activities]);

  const syncedTotalElevation = useMemo(() => {
    return sync.activities.reduce((acc, a) => acc + a.elevationMeters, 0);
  }, [sync.activities]);

  const baseKm = currentChartData.reduce((acc, curr) => acc + curr.distance, 0);
  const totalKm = baseKm + syncedTotalKm;
  const baseMinutes = currentChartData.reduce((acc, curr) => acc + curr.time, 0);
  const totalMinutes = baseMinutes + syncedTotalMinutes;
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const baseElevation = currentChartData.reduce((acc, curr) => acc + curr.elevation, 0);
  const totalElevation = baseElevation + syncedTotalElevation;
  const avgSpeed = totalMinutes > 0 ? (totalKm / (totalMinutes / 60)).toFixed(1) : '21.5';
  const estimatedCalories = Math.round(totalKm * 28);

  const filteredRoutes = allRoutes.filter((route) => {
    if (routeFilter !== 'todas' && route.type !== routeFilter) return false;
    if (sourceFilter === 'strava' && route.provider !== 'strava') return false;
    if (sourceFilter === 'garmin' && route.provider !== 'garmin') return false;
    if (sourceFilter === 'igsport' && route.provider !== 'igsport') return false;
    if (sourceFilter === 'manual' && route.provider !== 'cicloradar') return false;
    return true;
  });

  const handleToggleFavorite = (id: string) => {
    setSavedRoutes((prev) => prev.map((r) => r.id === id ? { ...r, favorite: !r.favorite } : r));
    showToast('Lista de favoritos actualizada');
  };

  const handleSyncAllClick = async () => {
    const count = await sync.syncAll();
    showToast(`¡Telemetría sincronizada! ${count} actividades actualizadas.`);
  };

  const handleCreateRoute = (e: FormEvent) => {
    e.preventDefault();
    if (!newRouteForm.name.trim()) return;

    const newRoute: SavedRoute = {
      id: `route-${Date.now()}`,
      name: newRouteForm.name.trim(),
      distanceKm: parseFloat(newRouteForm.distanceKm) || 20,
      durationMinutes: parseInt(newRouteForm.durationMinutes) || 60,
      elevationMeters: parseInt(newRouteForm.elevationMeters) || 150,
      date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: newRouteForm.type,
      avgSpeedKmh: parseFloat(((parseFloat(newRouteForm.distanceKm) || 20) / ((parseInt(newRouteForm.durationMinutes) || 60) / 60)).toFixed(1)),
      safetyScore: 4.8,
      favorite: false,
    };

    setSavedRoutes([newRoute, ...savedRoutes]);
    setIsNewRouteModalOpen(false);
    setNewRouteForm({
      name: '',
      distanceKm: '25.0',
      durationMinutes: '65',
      elevationMeters: '180',
      type: 'ruta',
    });
    showToast(`Ruta "${newRoute.name}" guardada con éxito`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 md:p-6 pb-24 text-zinc-100">
      <div className="max-w-5xl mx-auto space-y-6 mt-16 md:mt-20">
        
        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed top-20 right-4 z-50 bg-orange-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg border border-orange-400/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-orange-500 font-semibold tracking-wide">
              <span>PANEL DE TELEMETRÍA</span>
              <span aria-hidden="true">·</span>
              <span>GPS EN VIVO</span>
              <span aria-hidden="true">·</span>
              <span>SINCRONIZACIÓN STRAVA & GARMIN</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Actividad Reciente del Ciclista
            </h2>
            <p className="text-sm text-zinc-400">
              Resumen unificado de tus entrenamientos, telemetría y rutas importadas automáticamente.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('map')}
              className="h-11 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              <span>Grabar en Radar</span>
            </button>
            <button
              onClick={() => setIsNewRouteModalOpen(true)}
              className="h-11 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-sm font-semibold flex items-center gap-1.5 transition-colors"
              title="Guardar Nueva Ruta"
            >
              <Plus className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">Guardar Ruta</span>
            </button>
          </div>
        </div>

        {/* EXTERNAL SYNC BANNER (STRAVA, GARMIN, IGSPORT) */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-950 p-4 md:p-5 rounded-2xl border border-zinc-800/90 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center">
                  <RefreshCw className={`w-3.5 h-3.5 ${sync.isSyncing ? 'animate-spin text-orange-400' : ''}`} />
                </div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Sincronización de Cuentas Deportivas</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {sync.connectedCount > 0 ? `${sync.connectedCount} Conectada${sync.connectedCount > 1 ? 's' : ''}` : 'Sin Vincular'}
                  </span>
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                Vincula tus cuentas de <strong className="text-[#FC6100]">Strava</strong>, <strong className="text-[#38bdf8]">Garmin Connect</strong> y <strong className="text-rose-400">iGPSPORT</strong> para importar automáticamente rutas, velocidad media, vatios de potencia y desnivel.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
              <button
                onClick={handleSyncAllClick}
                disabled={sync.isSyncing}
                className="h-9 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                title="Sincronizar telemetría ahora"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${sync.isSyncing ? 'animate-spin' : ''}`} />
                <span>{sync.isSyncing ? 'Sincronizando...' : 'Sincronizar Todo'}</span>
              </button>

              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="h-9 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all active:scale-95"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Vincular Cuentas</span>
              </button>
            </div>
          </div>

          {/* Provider status badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-zinc-800/80">
            {/* Strava */}
            <div 
              onClick={() => setIsSyncModalOpen(true)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                sync.accounts.strava.connected 
                  ? 'bg-[#FC6100]/10 border-[#FC6100]/30 hover:border-[#FC6100]/60' 
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0 bg-[#FC6100] animate-pulse"></span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                    <span className="text-[#FC6100]">Strava</span>
                    {sync.accounts.strava.connected && (
                      <span className="text-[10px] text-zinc-400 font-normal">({sync.accounts.strava.syncedActivitiesCount} act.)</span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {sync.accounts.strava.connected ? sync.accounts.strava.athleteName : 'Clic para conectar'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                sync.accounts.strava.connected 
                  ? 'bg-emerald-500/15 text-emerald-400' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {sync.accounts.strava.connected ? 'Activo' : 'Vincular'}
              </span>
            </div>

            {/* Garmin Connect */}
            <div 
              onClick={() => setIsSyncModalOpen(true)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                sync.accounts.garmin.connected 
                  ? 'bg-[#007CC3]/10 border-[#007CC3]/30 hover:border-[#007CC3]/60' 
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0 bg-[#38bdf8] animate-pulse"></span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                    <span className="text-[#38bdf8]">Garmin</span>
                    {sync.accounts.garmin.connected && (
                      <span className="text-[10px] text-zinc-400 font-normal">({sync.accounts.garmin.syncedActivitiesCount} act.)</span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {sync.accounts.garmin.connected ? sync.accounts.garmin.athleteName : 'Clic para conectar'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                sync.accounts.garmin.connected 
                  ? 'bg-emerald-500/15 text-emerald-400' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {sync.accounts.garmin.connected ? 'Activo' : 'Vincular'}
              </span>
            </div>

            {/* iGPSPORT */}
            <div 
              onClick={() => setIsSyncModalOpen(true)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                sync.accounts.igsport.connected 
                  ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/60' 
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0 bg-rose-500 animate-pulse"></span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                    <span className="text-rose-400">iGPSPORT</span>
                    {sync.accounts.igsport.connected && (
                      <span className="text-[10px] text-zinc-400 font-normal">({sync.accounts.igsport.syncedActivitiesCount} act.)</span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {sync.accounts.igsport.connected ? sync.accounts.igsport.athleteName : 'Clic para conectar'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                sync.accounts.igsport.connected 
                  ? 'bg-emerald-500/15 text-emerald-400' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {sync.accounts.igsport.connected ? 'Activo' : 'Vincular'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Kilómetros Recorridos */}
          <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800/90 shadow-sm relative overflow-hidden group hover:border-orange-500/40 transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium">Distancia Total</span>
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-white font-mono tabular-nums tracking-tight">
              {totalKm.toFixed(1)} <span className="text-sm font-sans font-bold text-orange-500">km</span>
            </div>
            <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1 truncate">
              {syncedTotalKm > 0 ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="text-orange-400 font-semibold font-mono tabular-nums">+{syncedTotalKm.toFixed(1)} km</span>
                  <span className="truncate">de Strava/Garmin</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 font-semibold font-mono tabular-nums">+14.2%</span>
                  <span>vs periodo anterior</span>
                </>
              )}
            </div>
          </div>

          {/* Tiempo Total */}
          <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800/90 shadow-sm relative overflow-hidden group hover:border-orange-500/40 transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium">Tiempo en Ruta</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-white font-mono tabular-nums tracking-tight">
              {totalHours}h {remainingMinutes}m
            </div>
            <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
              <span>Ritmo medio:</span>
              <span className="text-white font-mono font-semibold">{avgSpeed} km/h</span>
            </div>
          </div>

          {/* Desnivel Acumulado */}
          <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800/90 shadow-sm relative overflow-hidden group hover:border-orange-500/40 transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium">Desnivel Positivo</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Mountain className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-white font-mono tabular-nums tracking-tight">
              +{totalElevation.toLocaleString()} <span className="text-sm font-sans font-bold text-emerald-400">m</span>
            </div>
            <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="text-zinc-300 font-mono font-semibold">{estimatedCalories.toLocaleString()}</span>
              <span>kcal quemadas</span>
            </div>
          </div>

          {/* Rutas Guardadas */}
          <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800/90 shadow-sm relative overflow-hidden group hover:border-orange-500/40 transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium">Rutas Guardadas</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Route className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-white font-mono tabular-nums tracking-tight">
              {allRoutes.length} <span className="text-sm font-sans font-bold text-purple-400">rutas</span>
            </div>
            <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5 truncate">
              {sync.activities.length > 0 ? (
                <span className="text-orange-400 font-mono font-semibold truncate">
                  {sync.activities.length} sincronizadas · {savedRoutes.length} manuales
                </span>
              ) : (
                <>
                  <span>Favoritas marcadas:</span>
                  <span className="text-orange-400 font-mono font-semibold">
                    {allRoutes.filter(r => r.favorite).length}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RECHARTS VISUALIZATION SECTION */}
        <div className="bg-zinc-900/90 p-4 md:p-6 rounded-2xl border border-zinc-800 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Rendimiento y Volumen de Pedaleo</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Visualización interactiva con Recharts de tus entrenamientos ciclistas
              </p>
            </div>

            {/* Segmented Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Métrica Activa */}
              <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setChartMetric('distance')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    chartMetric === 'distance'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Km
                </button>
                <button
                  onClick={() => setChartMetric('time')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    chartMetric === 'time'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Minutos
                </button>
                <button
                  onClick={() => setChartMetric('elevation')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    chartMetric === 'elevation'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Elevación
                </button>
              </div>

              {/* Selector de Periodo */}
              <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setPeriod('7d')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    period === '7d'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  7 Días
                </button>
                <button
                  onClick={() => setPeriod('4w')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    period === '4w'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  4 Semanas
                </button>
                <button
                  onClick={() => setPeriod('12m')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    period === '12m'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Año 2026
                </button>
              </div>
            </div>
          </div>

          {/* Gráfico Recharts */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cyclingOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="cyclingCyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="cyclingEmeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#27272a' }}
                  tickFormatter={(val) => chartMetric === 'elevation' ? `+${val}m` : `${val}`}
                />
                <Tooltip content={<CustomTooltip metric={chartMetric} />} />
                {chartMetric === 'distance' && (
                  <Area
                    type="monotone"
                    dataKey="distance"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cyclingOrangeGradient)"
                  />
                )}
                {chartMetric === 'time' && (
                  <Area
                    type="monotone"
                    dataKey="time"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cyclingCyanGradient)"
                  />
                )}
                {chartMetric === 'elevation' && (
                  <Area
                    type="monotone"
                    dataKey="elevation"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cyclingEmeraldGradient)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 pt-3 border-t border-zinc-800/80">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span>Pico Máximo: <strong className="text-white font-mono">{Math.max(...currentChartData.map(d => d[chartMetric]))} {chartMetric === 'distance' ? 'km' : chartMetric === 'time' ? 'min' : 'm'}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600"></span>
                <span>Promedio diario: <strong className="text-white font-mono">{(currentChartData.reduce((a, b) => a + b[chartMetric], 0) / currentChartData.length).toFixed(1)}</strong></span>
              </span>
            </div>
            <span>Pasa el cursor o toca cada barra para ver desglose</span>
          </div>
        </div>

        {/* SAVED ROUTES SECTION */}
        <div className="bg-zinc-900/90 p-4 md:p-6 rounded-2xl border border-zinc-800 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Route className="w-5 h-5 text-orange-500" />
                <span>Rutas y Salidas ({filteredRoutes.length})</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Historial combinado de tracks guardados y telemetría de ciclocomputadores
              </p>
            </div>

            {/* Segmented Filter by Route Type */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto overflow-x-auto max-w-full">
              {(['todas', 'ruta', 'urbana', 'gravel'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setRouteFilter(type)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-all ${
                    routeFilter === type
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Source Filter Tabs: All, Strava, Garmin, iGPSPORT, CicloRadar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider mr-1 shrink-0">
              Fuente:
            </span>
            <button
              onClick={() => setSourceFilter('todas')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${
                sourceFilter === 'todas'
                  ? 'bg-zinc-200 text-zinc-950 font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Todas ({allRoutes.length})
            </button>
            <button
              onClick={() => setSourceFilter('strava')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                sourceFilter === 'strava'
                  ? 'bg-[#FC6100] text-white font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-[#FC6100] border border-zinc-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FC6100]"></span>
              <span>Strava ({allRoutes.filter(r => r.provider === 'strava').length})</span>
            </button>
            <button
              onClick={() => setSourceFilter('garmin')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                sourceFilter === 'garmin'
                  ? 'bg-[#007CC3] text-white font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-[#38bdf8] border border-zinc-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
              <span>Garmin ({allRoutes.filter(r => r.provider === 'garmin').length})</span>
            </button>
            <button
              onClick={() => setSourceFilter('igsport')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                sourceFilter === 'igsport'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-rose-400 border border-zinc-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>iGPSPORT ({allRoutes.filter(r => r.provider === 'igsport').length})</span>
            </button>
            <button
              onClick={() => setSourceFilter('manual')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                sourceFilter === 'manual'
                  ? 'bg-zinc-700 text-white font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <span>Manuales ({allRoutes.filter(r => r.provider === 'cicloradar').length})</span>
            </button>
          </div>

          {/* Route Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRoutes.map((route) => {
              const isStrava = route.provider === 'strava';
              const isGarmin = route.provider === 'garmin';
              const isIgsport = route.provider === 'igsport';

              return (
                <div 
                  key={route.id}
                  className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 hover:border-orange-500/50 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Header with Provider Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          {isStrava && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FC6100]/20 text-[#FC6100] border border-[#FC6100]/40 flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FC6100]"></span>
                              Strava
                            </span>
                          )}
                          {isGarmin && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#007CC3]/20 text-[#38bdf8] border border-[#007CC3]/40 flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
                              Garmin
                            </span>
                          )}
                          {isIgsport && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              iGPSPORT
                            </span>
                          )}
                          {(!route.provider || route.provider === 'cicloradar') && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 shrink-0">
                              CicloRadar
                            </span>
                          )}
                          {route.deviceModel && (
                            <span className="text-[10px] text-zinc-500 truncate font-mono">
                              {route.deviceModel}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-white group-hover:text-orange-400 transition-colors text-sm truncate">
                          {route.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                          <span>{route.date}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{route.type}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400 font-mono font-semibold">★ {route.safetyScore} seguridad</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleFavorite(route.id)}
                        className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                          route.favorite 
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' 
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                        title={route.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                      >
                        ★
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-800/60 text-center">
                      <div className="bg-zinc-900/60 p-2 rounded-lg">
                        <span className="text-[10px] text-zinc-400 block">Distancia</span>
                        <span className="font-mono font-bold text-white text-sm tabular-nums">
                          {route.distanceKm.toFixed(1)} <span className="text-[10px] text-orange-400">km</span>
                        </span>
                      </div>
                      <div className="bg-zinc-900/60 p-2 rounded-lg">
                        <span className="text-[10px] text-zinc-400 block">Duración</span>
                        <span className="font-mono font-bold text-white text-sm tabular-nums">
                          {Math.floor(route.durationMinutes / 60)}h {route.durationMinutes % 60}m
                        </span>
                      </div>
                      <div className="bg-zinc-900/60 p-2 rounded-lg">
                        <span className="text-[10px] text-zinc-400 block">Desnivel</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                          +{route.elevationMeters}m
                        </span>
                      </div>
                    </div>

                    {/* Advanced Telemetry Tags (Power, Cadence, Heart Rate) */}
                    {(route.avgPowerWatts || route.avgHeartRateBpm) && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800/40 text-[11px]">
                        {route.avgPowerWatts && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-semibold flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            <span>{route.avgPowerWatts} W</span>
                          </span>
                        )}
                        {route.avgHeartRateBpm && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-semibold flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            <span>{route.avgHeartRateBpm} bpm</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-mono">
                      Vel. Media: <strong className="text-white">{route.avgSpeedKmh} km/h</strong>
                    </span>
                    <button
                      onClick={() => onNavigate('map')}
                      className="h-8 px-3 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>Cargar en Mapa</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredRoutes.length === 0 && (
            <div className="text-center py-10 bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800 p-6">
              <Route className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">No hay rutas para este filtro</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Prueba a seleccionar otro proveedor o pulsa &ldquo;Vincular Cuentas&rdquo; para importar salidas de Strava, Garmin o iGPSPORT.
              </p>
              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
              >
                Vincular Cuentas Ahora
              </button>
            </div>
          )}
        </div>

        {/* QUICK SHORTCUTS & RADAR TOOLS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button 
            onClick={() => onNavigate('map')}
            className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 hover:border-cyan-500/50 transition-all text-left flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors truncate">
                Grupos de Ruta
              </h4>
              <p className="text-xs text-zinc-400 truncate">Pelotón y amigos en vivo</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 shrink-0" />
          </button>

          <button 
            onClick={() => onNavigate('community')}
            className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 hover:border-orange-500/50 transition-all text-left flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors truncate">
                Red Comunitaria
              </h4>
              <p className="text-xs text-zinc-400 truncate">Ciclistas activos en tu radio</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 shrink-0" />
          </button>

          <button 
            onClick={() => onNavigate('sos')}
            className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 hover:border-red-500/50 transition-all text-left flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm group-hover:text-red-400 transition-colors truncate">
                Protocolo SOS
              </h4>
              <p className="text-xs text-zinc-400 truncate">Contactos y alarma acústica</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-red-400 shrink-0" />
          </button>

          <button 
            onClick={() => onNavigate('profile')}
            className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 hover:border-orange-500/50 transition-all text-left flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors truncate">
                Perfil Ciclista
              </h4>
              <p className="text-xs text-zinc-400 truncate">Bici, tonos y modo sigilo</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 shrink-0" />
          </button>
        </div>

        {/* SIMULADOR DE EMERGENCIA (DEV/TESTING) */}
        {onSimulateSos && (
          <div className="pt-2">
            <button 
              onClick={onSimulateSos}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 px-4 rounded-xl font-bold border border-red-500/30 transition-all flex items-center justify-center gap-2 text-xs"
            >
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>(Prueba de Alarma) Simular Alerta SOS de Ciclista Cercano</span>
            </button>
          </div>
        )}

      </div>

      {/* MODAL: GUARDAR NUEVA RUTA */}
      {isNewRouteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1">Guardar Nueva Ruta</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Registra los datos de tu salida ciclista para sincronizarla en el radar.
            </p>

            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Nombre de la Ruta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Vuelta al Embalse y Mirador"
                  value={newRouteForm.name}
                  onChange={(e) => setNewRouteForm({ ...newRouteForm, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Distancia (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newRouteForm.distanceKm}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, distanceKm: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Duración (minutos)</label>
                  <input
                    type="number"
                    required
                    value={newRouteForm.durationMinutes}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, durationMinutes: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Desnivel (+m)</label>
                  <input
                    type="number"
                    required
                    value={newRouteForm.elevationMeters}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, elevationMeters: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Modalidad</label>
                  <select
                    value={newRouteForm.type}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, type: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="ruta">Ruta / Asfalto</option>
                    <option value="urbana">Urbana / Ciudad</option>
                    <option value="gravel">Gravel / Montaña</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewRouteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20"
                >
                  Guardar Ruta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GESTIÓN Y VINCULACIÓN DE CUENTAS (STRAVA, GARMIN, IGSPORT) */}
      {isSyncModalOpen && (
        <SyncAccountsModal
          onClose={() => setIsSyncModalOpen(false)}
          onSyncComplete={(count) => {
            showToast(`¡Sincronización completada! ${count} actividades importadas.`);
          }}
        />
      )}
    </div>
  );
}
