/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  AlertTriangle, 
  Send, 
  Sparkles, 
  Crosshair, 
  Check, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { 
  HazardType, 
  HazardSeverity, 
  HAZARD_TYPES_CONFIG 
} from '../services/hazardsService';
import HazardIcon from './HazardIcon';

interface ReportHazardModalProps {
  userLocation: { lat: number; lng: number } | null;
  mapCenter: { lat: number; lng: number };
  cyclistName?: string;
  onClose: () => void;
  onSubmit: (data: {
    type: HazardType;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    reportedBy: string;
    severity: HazardSeverity;
  }) => void;
  onStartMapPick?: () => void;
}

export default function ReportHazardModal({
  userLocation,
  mapCenter,
  cyclistName = 'Ciclista en Ruta',
  onClose,
  onSubmit,
  onStartMapPick
}: ReportHazardModalProps) {
  const [selectedType, setSelectedType] = useState<HazardType>('obras');
  const [selectedSeverity, setSelectedSeverity] = useState<HazardSeverity>('media');
  const [locationMode, setLocationMode] = useState<'gps' | 'mapCenter'>(
    userLocation ? 'gps' : 'mapCenter'
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reporter, setReporter] = useState(cyclistName);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeConfig = HAZARD_TYPES_CONFIG[selectedType];

  const handleTypeSelect = (type: HazardType) => {
    setSelectedType(type);
    if (!title || Object.values(HAZARD_TYPES_CONFIG).some(cfg => cfg.label === title)) {
      setTitle(HAZARD_TYPES_CONFIG[type].label);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetCoords = 
      locationMode === 'gps' && userLocation 
        ? { lat: userLocation.lat, lng: userLocation.lng }
        : { lat: mapCenter.lat, lng: mapCenter.lng };

    if (!targetCoords.lat || !targetCoords.lng) {
      setErrorMsg('No se pudo determinar las coordenadas del reporte.');
      return;
    }

    const finalTitle = title.trim() || activeConfig.label;
    const finalDesc = description.trim() || activeConfig.descriptionPlaceholder;

    onSubmit({
      type: selectedType,
      title: finalTitle,
      description: finalDesc,
      latitude: targetCoords.lat,
      longitude: targetCoords.lng,
      reportedBy: reporter.trim() || 'Ciclista Anónimo',
      severity: selectedSeverity
    });
  };

  const severityOptions: { id: HazardSeverity; label: string; color: string }[] = [
    { id: 'baja', label: 'Baja', color: 'hover:border-emerald-500/50' },
    { id: 'media', label: 'Media', color: 'hover:border-yellow-500/50' },
    { id: 'alta', label: 'Alta', color: 'hover:border-orange-500/50' },
    { id: 'critica', label: 'Crítica', color: 'hover:border-red-500/50' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Marcar Peligro o Hito</h3>
              <p className="text-xs text-zinc-400">Se compartirá con la comunidad en tiempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Categoría de Hito / Peligro */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              1. Selecciona el Tipo de Hito
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(HAZARD_TYPES_CONFIG) as HazardType[]).map((typeKey) => {
                const cfg = HAZARD_TYPES_CONFIG[typeKey];
                const isSelected = selectedType === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => handleTypeSelect(typeKey)}
                    className={`min-h-[52px] p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? `bg-orange-500/20 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]`
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isSelected ? cfg.markerBg : 'bg-zinc-800'} text-white shrink-0`}>
                      <HazardIcon type={typeKey} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold block truncate">{cfg.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Ubicación del Hito */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              2. Ubicación en el Mapa
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocationMode('gps')}
                disabled={!userLocation}
                className={`min-h-[44px] p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                  locationMode === 'gps'
                    ? 'bg-orange-500/20 border-orange-500 text-white'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                } ${!userLocation ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Crosshair className="w-4 h-4 text-orange-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block">Mi GPS Actual</span>
                  <span className="text-[10px] text-zinc-400 truncate block">
                    {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Sin señal GPS'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLocationMode('mapCenter')}
                className={`min-h-[44px] p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                  locationMode === 'mapCenter'
                    ? 'bg-orange-500/20 border-orange-500 text-white'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block">Centro del Mapa</span>
                  <span className="text-[10px] text-zinc-400 truncate block">
                    {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Nivel de Gravedad / Severidad */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              3. Nivel de Severidad
            </label>
            <div className="grid grid-cols-4 gap-2">
              {severityOptions.map((opt) => {
                const isSelected = selectedSeverity === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedSeverity(opt.id)}
                    className={`h-11 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? opt.id === 'critica'
                          ? 'bg-red-500/20 border-red-500 text-red-400 shadow-sm'
                          : opt.id === 'alta'
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-sm'
                          : opt.id === 'media'
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-sm'
                          : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    } ${opt.color}`}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Título & Descripción */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Título del Hito o Alerta
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={activeConfig.label}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                maxLength={60}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Descripción / Detalle para la comunidad
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={activeConfig.descriptionPlaceholder}
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                maxLength={180}
              />
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>Publicar Hito en Tiempo Real</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
