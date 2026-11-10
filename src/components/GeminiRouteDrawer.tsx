import React, { useState } from 'react';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Navigation, 
  MapPin, 
  Clock, 
  Flame, 
  AlertTriangle, 
  ChevronRight, 
  X, 
  RefreshCw, 
  Check, 
  Lightbulb, 
  Car, 
  Eye, 
  Compass,
  Zap,
  Info
} from 'lucide-react';
import { GeminiCyclingRoute, RoutePreference } from '../services/geminiRoutingService';

interface GeminiRouteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  routes: GeminiCyclingRoute[];
  selectedRoute: GeminiCyclingRoute | null;
  isLoading: boolean;
  error: string | null;
  preference: RoutePreference;
  distanceKm: number;
  lastSource: string;
  onSelectRoute: (route: GeminiCyclingRoute) => void;
  onRefresh: (pref: RoutePreference, dist: number) => void;
  onCenterOnRoute: (route: GeminiCyclingRoute) => void;
}

export default function GeminiRouteDrawer({
  isOpen,
  onClose,
  routes,
  selectedRoute,
  isLoading,
  error,
  preference,
  distanceKm,
  lastSource,
  onSelectRoute,
  onRefresh,
  onCenterOnRoute,
}: GeminiRouteDrawerProps) {
  const [activePreference, setActivePreference] = useState<RoutePreference>(preference);
  const [activeDistance, setActiveDistance] = useState<number>(distanceKm);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyFilters = () => {
    onRefresh(activePreference, activeDistance);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 pb-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-emerald-500/20 text-orange-400 border border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              <Sparkles className="w-6 h-6 text-orange-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white leading-tight">Rutas Seguras con Gemini IA</h3>
                <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/40">
                  AI ASSIST
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Sugerencias inteligentes basadas en iluminación nocturna y calma de tráfico
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-zinc-300">

          {/* Selectores de Preferencia y Distancia */}
          <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl space-y-3">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                ¿Qué prioridad buscas para tu salida?
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActivePreference('lighting')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                    activePreference === 'lighting'
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Lightbulb className={`w-4 h-4 mb-1 ${activePreference === 'lighting' ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span className="text-xs font-bold leading-tight">Mayor Luz</span>
                  <span className="text-[9px] text-zinc-400 mt-0.5">Postes LED continuos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreference('traffic')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                    activePreference === 'traffic'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Car className={`w-4 h-4 mb-1 ${activePreference === 'traffic' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span className="text-xs font-bold leading-tight">Menor Tráfico</span>
                  <span className="text-[9px] text-zinc-400 mt-0.5">Zona 30 y parques</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreference('both')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                    activePreference === 'both'
                      ? 'bg-orange-500/20 border-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.25)]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Zap className={`w-4 h-4 mb-1 ${activePreference === 'both' ? 'text-orange-400' : 'text-zinc-500'}`} />
                  <span className="text-xs font-bold leading-tight">Equilibrada</span>
                  <span className="text-[9px] text-zinc-400 mt-0.5">Luz + tranquilidad</span>
                </button>
              </div>
            </div>

            {/* Selector de Distancia */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
              <span className="text-zinc-400 font-semibold">Distancia deseada:</span>
              <div className="flex items-center gap-1.5">
                {[5, 10, 18].map((dist) => (
                  <button
                    key={dist}
                    type="button"
                    onClick={() => setActiveDistance(dist)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                      activeDistance === dist
                        ? 'bg-orange-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    ~{dist} km
                  </button>
                ))}
              </div>
            </div>

            {/* Botón para Recalcular */}
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-500/20 transition-all active:scale-98 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analizando entorno con Gemini...' : 'Recalcular Rutas con IA'}</span>
            </button>
          </div>

          {/* Estado de Error si hubiera */}
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs flex items-start gap-2.5 text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-white">Aviso del Asistente:</p>
                <p className="text-[11px] mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Indicador de Origen / Modelo */}
          {lastSource && (
            <div className="flex items-center justify-between px-1 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                Motor: <strong className="text-zinc-200">{lastSource.includes('gemini') ? 'Gemini 3.8 Flash' : 'Optimizador Local'}</strong>
              </span>
              <span className="text-zinc-400">
                {routes.length} ruta{routes.length > 1 ? 's' : ''} disponible{routes.length > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Listado de Rutas Sugeridas */}
          <div className="space-y-3">
            {routes.map((route, index) => {
              const isSelected = selectedRoute?.id === route.id;
              const isExpanded = expandedRouteId === route.id;

              return (
                <div
                  key={route.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-zinc-900 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)] ring-1 ring-orange-500/50'
                      : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-zinc-800 text-zinc-300">
                          Opción {index + 1}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          route.category === 'lighting' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : route.category === 'traffic'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        }`}>
                          {route.category === 'lighting' ? <Lightbulb className="w-3 h-3 text-amber-400" /> : <Car className="w-3 h-3 text-emerald-400" />}
                          {route.category === 'lighting' ? 'Máx. Iluminación' : route.category === 'traffic' ? 'Mín. Tráfico' : 'Híbrida'}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base leading-snug">
                        {route.name}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-white font-mono block">
                        {route.distanceKm} km
                      </span>
                      <span className="text-[11px] text-zinc-400 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-orange-400" /> {route.estimatedMinutes} min
                      </span>
                    </div>
                  </div>

                  {/* Resumen */}
                  <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                    {route.summary}
                  </p>

                  {/* Barras de Puntuación */}
                  <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 mb-3 text-xs">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> Iluminación
                        </span>
                        <span className="font-mono font-bold text-white">{route.lightingScore} / 10</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                          style={{ width: `${(route.lightingScore / 10) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Car className="w-3 h-3" /> Calma Tráfico
                        </span>
                        <span className="font-mono font-bold text-white">{route.trafficCalmScore} / 10</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                          style={{ width: `${(route.trafficCalmScore / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detalles Expandibles */}
                  {isExpanded && (
                    <div className="space-y-2.5 pt-2 border-t border-zinc-800/80 text-xs animate-in fade-in duration-150">
                      <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
                        <span className="font-bold text-amber-300 text-[11px] block mb-0.5">💡 Luminarias y Visibilidad:</span>
                        <p className="text-[11px] text-zinc-300">{route.streetLightingType}</p>
                      </div>

                      <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
                        <span className="font-bold text-emerald-300 text-[11px] block mb-0.5">🛡️ Tránsito y Convivencia:</span>
                        <p className="text-[11px] text-zinc-300">{route.trafficConditions}</p>
                      </div>

                      {route.safetyHighlights && route.safetyHighlights.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-zinc-400 block mb-1">Puntos fuertes de seguridad:</span>
                          <ul className="space-y-1 text-[11px] text-zinc-300 list-disc pl-4">
                            {route.safetyHighlights.map((hl, i) => (
                              <li key={i}>{hl}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {route.cautions && route.cautions.length > 0 && (
                        <div className="p-2.5 bg-orange-500/10 border border-orange-500/25 rounded-xl">
                          <span className="font-bold text-orange-400 text-[11px] flex items-center gap-1 mb-0.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Precauciones en ruta:
                          </span>
                          <ul className="space-y-0.5 text-[11px] text-zinc-300 list-disc pl-4">
                            {route.cautions.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Acciones de la Tarjeta */}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => setExpandedRouteId(isExpanded ? null : route.id)}
                      className="text-[11px] text-zinc-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Menos detalles' : 'Más detalles'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    <div className="flex-1 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRoute(route);
                          onCenterOnRoute(route);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Compass className="w-3.5 h-3.5 text-orange-400" />}
                        <span>{isSelected ? 'Trazada en Mapa' : 'Trazar en Mapa'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectRoute(route);
                          onCenterOnRoute(route);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20"
                        title="Activar esta ruta y volver al mapa"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Navegar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-orange-400" />
            Las rutas se actualizan en base a tu GPS
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
