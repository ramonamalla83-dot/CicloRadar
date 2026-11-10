/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { SafetyHazard, HAZARD_TYPES_CONFIG } from '../services/hazardsService';
import HazardIcon from './HazardIcon';

interface HazardMarkerProps {
  key?: React.Key;
  hazard: SafetyHazard;
  isSelected?: boolean;
  onClick: (hazard: SafetyHazard) => void;
}

export default function HazardMarker({ hazard, isSelected = false, onClick }: HazardMarkerProps) {
  const config = HAZARD_TYPES_CONFIG[hazard.type] || HAZARD_TYPES_CONFIG.obras;
  const isCritical = hazard.severity === 'critica';
  const isHigh = hazard.severity === 'alta';

  return (
    <Marker
      longitude={hazard.longitude}
      latitude={hazard.latitude}
      anchor="bottom"
      onClick={(e) => {
        // Evitar que el clic se propague al mapa
        e.originalEvent.stopPropagation();
        onClick(hazard);
      }}
    >
      <div 
        className="group relative flex flex-col items-center cursor-pointer select-none transition-transform hover:scale-110 active:scale-95"
        title={`${config.label}: ${hazard.title}`}
      >
        {/* Halo o pulsación de advertencia para peligros críticos o altos */}
        {(isCritical || isHigh) && (
          <span 
            className={`absolute -top-1 w-9 h-9 rounded-full opacity-60 animate-ping ${
              isCritical ? 'bg-red-500' : 'bg-amber-500'
            }`} 
          />
        )}

        {/* Cuerpo del marcador */}
        <div 
          className={`relative z-10 p-2 rounded-2xl shadow-xl border-2 flex items-center justify-center transition-all ${
            isSelected 
              ? 'ring-4 ring-orange-500 ring-offset-2 ring-offset-zinc-950 scale-110 border-white' 
              : 'border-zinc-900'
          } ${config.markerBg} text-white`}
        >
          <HazardIcon type={hazard.type} className="w-5 h-5 drop-shadow-sm" />

          {/* Badge de confirmaciones comunitarias */}
          {hazard.confirmations > 1 && (
            <span className="absolute -top-1.5 -right-1.5 bg-zinc-950 border border-zinc-700 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
              {hazard.confirmations > 9 ? '9+' : hazard.confirmations}
            </span>
          )}
        </div>

        {/* Punta de aguja del pin */}
        <div 
          className={`w-2 h-2 rotate-45 -mt-1 shadow-sm border-r-2 border-b-2 border-zinc-900 ${config.markerBg}`}
        />

        {/* Etiqueta flotante pequeña en hover o cuando está seleccionado */}
        <div className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg backdrop-blur-md border border-zinc-800 transition-opacity whitespace-nowrap ${
          isSelected 
            ? 'opacity-100 bg-zinc-950 text-white border-orange-500' 
            : 'opacity-0 group-hover:opacity-100 bg-zinc-950/90 text-zinc-300 pointer-events-none'
        }`}>
          {hazard.title}
        </div>
      </div>
    </Marker>
  );
}
