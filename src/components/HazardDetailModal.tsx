/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  ThumbsUp, 
  CheckCircle2, 
  Trash2, 
  MapPin, 
  Clock, 
  User, 
  Compass, 
  Share2, 
  AlertTriangle 
} from 'lucide-react';
import { SafetyHazard, HAZARD_TYPES_CONFIG } from '../services/hazardsService';
import HazardIcon from './HazardIcon';

interface HazardDetailModalProps {
  hazard: SafetyHazard;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onCenterOnMap: (lat: number, lng: number) => void;
}

export default function HazardDetailModal({
  hazard,
  userLocation,
  onClose,
  onConfirm,
  onResolve,
  onDelete,
  onCenterOnMap
}: HazardDetailModalProps) {
  const config = HAZARD_TYPES_CONFIG[hazard.type] || HAZARD_TYPES_CONFIG.obras;

  // Calcular distancia si hay ubicación GPS
  const distanceText = React.useMemo(() => {
    if (!userLocation) return null;
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((hazard.latitude - userLocation.lat) * Math.PI) / 180;
    const dLon = ((hazard.longitude - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((hazard.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;

    if (distKm < 1) {
      return `a ${(distKm * 1000).toFixed(0)} m de ti`;
    }
    return `a ${distKm.toFixed(1)} km de ti`;
  }, [userLocation, hazard.latitude, hazard.longitude]);

  // Formatear tiempo transcurrido
  const timeElapsed = React.useMemo(() => {
    const diffMs = Date.now() - hazard.reportedAt;
    const diffMin = Math.floor(diffMs / (60 * 1000));
    if (diffMin < 1) return 'Hace instantes';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return `Hace ${Math.floor(diffHours / 24)} d`;
  }, [hazard.reportedAt]);

  const severityBadge = React.useMemo(() => {
    switch (hazard.severity) {
      case 'critica':
        return { label: 'Peligro Crítico', bg: 'bg-red-500/20 text-red-400 border-red-500/40' };
      case 'alta':
        return { label: 'Riesgo Alto', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/40' };
      case 'media':
        return { label: 'Precaución Media', bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' };
      default:
        return { label: 'Informativo', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    }
  }, [hazard.severity]);

  return (
    <div className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-24 sm:w-96 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 text-white rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-30 animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${config.markerBg} text-white shadow-lg shrink-0`}>
            <HazardIcon type={hazard.type} className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeBg} ${config.textColor} ${config.borderColor}`}>
                {config.label}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityBadge.bg}`}>
                {severityBadge.label}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-1 leading-snug">
              {hazard.title}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors shrink-0"
          title="Cerrar detalle"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Descripción y Detalles */}
      <div className="my-3.5 space-y-2.5">
        <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
          {hazard.description}
        </p>

        {/* Metadatos */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/60 flex items-center gap-2 text-zinc-400">
            <User className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="truncate">Por: <strong className="text-zinc-200">{hazard.reportedBy}</strong></span>
          </div>
          <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/60 flex items-center gap-2 text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>{timeElapsed}</span>
          </div>
          {distanceText && (
            <div className="col-span-2 bg-orange-500/10 border border-orange-500/25 p-2.5 rounded-xl flex items-center justify-between text-orange-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400" />
                <span className="font-semibold">{distanceText}</span>
              </div>
              <button
                onClick={() => onCenterOnMap(hazard.latitude, hazard.longitude)}
                className="text-[11px] font-bold text-orange-400 hover:text-orange-200 flex items-center gap-1 underline underline-offset-2"
              >
                <Compass className="w-3 h-3" />
                Centrar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Botones de Acción Comunitaria */}
      <div className="pt-2 border-t border-zinc-800/80 space-y-2">
        <div className="flex items-center gap-2">
          {/* Botón de Confirmar que sigue ahí */}
          <button
            onClick={() => onConfirm(hazard.id)}
            disabled={hazard.userVoted}
            className={`flex-1 h-11 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
              hazard.userVoted
                ? 'bg-zinc-800 text-zinc-400 border-zinc-700 cursor-not-allowed opacity-80'
                : 'bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border-orange-500/40 hover:border-orange-500'
            }`}
            title="Confirmar que el peligro o hito continúa en este lugar"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{hazard.userVoted ? 'Confirmado' : 'Sigue ahí'}</span>
            <span className="bg-orange-500/20 text-orange-300 px-1.5 py-0.2 rounded-full text-[10px]">
              {hazard.confirmations}
            </span>
          </button>

          {/* Botón de Resolver / Despejado */}
          <button
            onClick={() => onResolve(hazard.id)}
            className="flex-1 h-11 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 hover:border-emerald-500 transition-all"
            title="Reportar que este peligro fue despejado o reparado"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Ya Despejado</span>
          </button>
        </div>

        {/* Si fue creado por el usuario, permitir eliminar */}
        {hazard.isUserCreated && (
          <button
            onClick={() => onDelete(hazard.id)}
            className="w-full h-9 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar mi reporte</span>
          </button>
        )}
      </div>
    </div>
  );
}
