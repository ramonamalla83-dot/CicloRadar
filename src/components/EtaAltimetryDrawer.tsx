/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Clock, 
  Mountain, 
  TrendingUp, 
  TrendingDown, 
  Navigation, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Zap, 
  Bike, 
  MapPin, 
  Compass, 
  Sparkles,
  Info,
  CheckCircle2,
  Gauge
} from 'lucide-react';
import { EtaCalculationResult, PaceMode } from '../services/etaRoutingService';

interface EtaAltimetryDrawerProps {
  calculation: EtaCalculationResult;
  isOpen: boolean;
  onClose: () => void;
  onToggleOpen: () => void;
  onChangeDestination: () => void;
  onPaceModeChange: (mode: PaceMode) => void;
  onCustomSpeedChange?: (speed: number | null) => void;
  onStartNavigation?: () => void;
}

export default function EtaAltimetryDrawer({
  calculation,
  isOpen,
  onClose,
  onToggleOpen,
  onChangeDestination,
  onPaceModeChange,
  onStartNavigation
}: EtaAltimetryDrawerProps) {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const {
    destination,
    profile,
    baseHistoricalSpeedKmh,
    effectiveSpeedKmh,
    formattedDuration,
    estimatedArrivalTime,
    elevationTimePenaltyMinutes,
    paceMode
  } = calculation;

  const points = profile.elevationPoints;
  const minElev = profile.minElevationMeters;
  const maxElev = profile.maxElevationMeters;
  const elevRange = Math.max(20, maxElev - minElev);
  const totalDist = profile.totalDistanceKm;

  // Dimensiones del gráfico SVG
  const svgWidth = 500;
  const svgHeight = 120;
  const paddingX = 10;
  const paddingY = 16;
  const graphW = svgWidth - paddingX * 2;
  const graphH = svgHeight - paddingY * 2;

  // Generar coordenadas SVG para la línea y el área
  const svgPoints = points.map((pt, i) => {
    const x = paddingX + (pt.distanceKm / (totalDist || 1)) * graphW;
    const y = paddingY + graphH - ((pt.elevationMeters - minElev) / elevRange) * graphH;
    return { x, y, pt, i };
  });

  const pathD = svgPoints.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${paddingX + graphW} ${paddingY + graphH} L ${paddingX} ${paddingY + graphH} Z`;

  const hoveredPoint = activePointIndex !== null ? points[activePointIndex] : points[Math.floor(points.length / 2)];

  return (
    <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-[460px] z-20 pointer-events-auto">
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* TOP TOGGLE HEADER */}
        <div 
          onClick={onToggleOpen}
          className="p-3.5 px-4 flex items-center justify-between cursor-pointer border-b border-zinc-800/80 hover:bg-zinc-900/60 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                <span>Ruta y Altimetría a Destino</span>
                <span className="text-[10px] text-orange-400 px-1.5 py-0.2 rounded bg-orange-500/10 font-mono">
                  {totalDist} km
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate">
                Llegada: <strong className="text-white font-mono">{estimatedArrivalTime}</strong> ({formattedDuration})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleOpen();
              }}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title={isOpen ? 'Minimizar panel' : 'Expandir panel'}
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
              title="Borrar destino"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* EXPANDED CONTENT */}
        {isOpen && (
          <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
            
            {/* HERO ETA CARD */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-4 rounded-2xl border border-zinc-800/90 shadow-inner relative overflow-hidden">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Tiempo Estimado (ETA)
                  </span>
                  <div className="text-3xl font-black text-white font-mono tracking-tight mt-0.5">
                    {formattedDuration}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-semibold text-zinc-400 block">Hora de Llegada</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {estimatedArrivalTime}
                  </div>
                </div>
              </div>

              {/* Sub-info banner */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300">
                <span className="flex items-center gap-1.5 font-mono">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vel. en ruta: <strong className="text-white">{effectiveSpeedKmh} km/h</strong></span>
                </span>
                {elevationTimePenaltyMinutes > 0 && (
                  <span className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    +{elevationTimePenaltyMinutes} min por desnivel
                  </span>
                )}
              </div>
            </div>

            {/* ALTIMETRY STATS 4-GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> Desnivel D+
                </span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  +{profile.elevationGainMeters} m
                </span>
              </div>

              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
                  <TrendingDown className="w-3 h-3 text-cyan-400" /> Desnivel D-
                </span>
                <span className="text-sm font-bold text-cyan-400 font-mono">
                  -{profile.elevationLossMeters} m
                </span>
              </div>

              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
                  <Mountain className="w-3 h-3 text-amber-400" /> Pend. Media
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  {profile.avgGradientPercent}%
                </span>
              </div>

              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
                  <Zap className="w-3 h-3 text-orange-400" /> Pend. Máx.
                </span>
                <span className="text-sm font-bold text-orange-400 font-mono">
                  {profile.maxGradientPercent}%
                </span>
              </div>
            </div>

            {/* INTERACTIVE ALTIMETRY PROFILE CHART */}
            <div className="bg-zinc-900/90 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                  <Mountain className="w-4 h-4 text-orange-500" />
                  <span>Perfil Altimétrico del Terreno</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  {minElev} m - {maxElev} m s.n.m.
                </span>
              </div>

              {/* Scrubber detail bar */}
              {hoveredPoint && (
                <div className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">
                    Km <strong className="text-white">{hoveredPoint.distanceKm}</strong>
                  </span>
                  <span className="text-emerald-400">
                    Alt: <strong className="text-white">{hoveredPoint.elevationMeters}m</strong>
                  </span>
                  <span className={`${hoveredPoint.gradientPercent > 4 ? 'text-orange-400' : hoveredPoint.gradientPercent < -2 ? 'text-cyan-400' : 'text-zinc-300'}`}>
                    Pend: <strong>{hoveredPoint.gradientPercent > 0 ? `+${hoveredPoint.gradientPercent}%` : `${hoveredPoint.gradientPercent}%`}</strong>
                  </span>
                  <span className="text-zinc-300">
                    Vel: <strong className="text-white">{hoveredPoint.estimatedSpeedKmh} km/h</strong>
                  </span>
                </div>
              )}

              {/* SVG Curve */}
              <div className="w-full overflow-hidden relative select-none">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-28 touch-none"
                  onMouseLeave={() => setActivePointIndex(null)}
                >
                  <defs>
                    <linearGradient id="altimetryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#27272a" strokeDasharray="3 3" />
                  <line x1={paddingX} y1={paddingY + graphH / 2} x2={svgWidth - paddingX} y2={paddingY + graphH / 2} stroke="#27272a" strokeDasharray="3 3" />
                  <line x1={paddingX} y1={paddingY + graphH} x2={svgWidth - paddingX} y2={paddingY + graphH} stroke="#3f3f46" />

                  {/* Altimetry filled area */}
                  <path d={areaD} fill="url(#altimetryGradient)" />

                  {/* Altimetry line */}
                  <path d={pathD} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Interactive points & hover regions */}
                  {svgPoints.map((sp) => {
                    const isHovered = activePointIndex === sp.i;
                    const isSteep = sp.pt.gradientPercent >= 6;
                    return (
                      <g 
                        key={sp.i}
                        onMouseEnter={() => setActivePointIndex(sp.i)}
                        onTouchStart={() => setActivePointIndex(sp.i)}
                        className="cursor-pointer"
                      >
                        {/* Invisible touch target */}
                        <circle cx={sp.x} cy={sp.y} r="14" fill="transparent" />

                        {/* Visual point */}
                        {isHovered && (
                          <>
                            <line x1={sp.x} y1={paddingY} x2={sp.x} y2={paddingY + graphH} stroke="#f97316" strokeWidth="1" strokeDasharray="2 2" />
                            <circle cx={sp.x} cy={sp.y} r="5" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
                          </>
                        )}
                        {!isHovered && isSteep && (
                          <circle cx={sp.x} cy={sp.y} r="2.5" fill="#ef4444" />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* X-Axis labels */}
                <div className="flex justify-between text-[10px] font-mono text-zinc-500 pt-1">
                  <span>0 km (Salida)</span>
                  <span>{(totalDist / 2).toFixed(1)} km</span>
                  <span>{totalDist} km (Destino)</span>
                </div>
              </div>
            </div>

            {/* HISTORICAL BENCHMARK & PACE MODES */}
            <div className="bg-zinc-900/70 p-3 rounded-2xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-orange-400" />
                  <span>Velocidad Base del Ciclista</span>
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Promedio histórico: <strong className="text-white">{baseHistoricalSpeedKmh} km/h</strong>
                </span>
              </div>

              {/* Pace Mode Selector */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => onPaceModeChange('historic')}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    paceMode === 'historic'
                      ? 'bg-orange-500 text-white border-orange-400 font-bold shadow-md shadow-orange-500/20'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  <span className="text-[11px] block leading-tight">Histórico</span>
                  <span className="text-[10px] opacity-80 font-mono">100%</span>
                </button>

                <button
                  type="button"
                  onClick={() => onPaceModeChange('relaxed')}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    paceMode === 'relaxed'
                      ? 'bg-cyan-500 text-white border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  <span className="text-[11px] block leading-tight">Paseo</span>
                  <span className="text-[10px] opacity-80 font-mono">80%</span>
                </button>

                <button
                  type="button"
                  onClick={() => onPaceModeChange('fast')}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    paceMode === 'fast'
                      ? 'bg-red-500 text-white border-red-400 font-bold shadow-md shadow-red-500/20'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  <span className="text-[11px] block leading-tight">Intenso</span>
                  <span className="text-[10px] opacity-80 font-mono">118%</span>
                </button>

                <button
                  type="button"
                  onClick={() => onPaceModeChange('ebike')}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    paceMode === 'ebike'
                      ? 'bg-emerald-500 text-white border-emerald-400 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  <span className="text-[11px] block leading-tight">e-Bike</span>
                  <span className="text-[10px] opacity-80 font-mono">Asistida</span>
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onChangeDestination}
                className="flex-1 h-11 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span>Cambiar Destino</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsNavigating(!isNavigating);
                  onStartNavigation?.();
                }}
                className={`flex-1 h-11 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isNavigating
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 active:scale-95'
                }`}
              >
                {isNavigating ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>En Ruta Hacia Destino</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>Iniciar Navegación</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
