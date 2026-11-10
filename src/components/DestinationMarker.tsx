/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { Flag, Navigation, Clock, Mountain } from 'lucide-react';
import { EtaCalculationResult } from '../services/etaRoutingService';

interface DestinationMarkerProps {
  calculation: EtaCalculationResult;
  onClick?: () => void;
}

export default function DestinationMarker({ calculation, onClick }: DestinationMarkerProps) {
  const { destination, formattedDuration, profile, estimatedArrivalTime } = calculation;

  return (
    <Marker
      longitude={destination.lng}
      latitude={destination.lat}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick?.();
      }}
    >
      <div className="relative flex flex-col items-center group cursor-pointer animate-in fade-in zoom-in-90 duration-300">
        {/* Floating ETA Badge */}
        <div className="mb-1.5 px-2.5 py-1 rounded-xl bg-zinc-950/95 border border-orange-500/80 shadow-2xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold text-white group-hover:scale-105 transition-transform">
          <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="text-orange-400 font-mono">{formattedDuration}</span>
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-300 font-mono">{estimatedArrivalTime}</span>
          <span className="text-zinc-500">·</span>
          <span className="text-emerald-400 font-mono">+{profile.elevationGainMeters}m</span>
        </div>

        {/* Pulse Ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-12 h-12 rounded-full bg-orange-500/30 animate-ping"></div>
          <div className="absolute w-8 h-8 rounded-full bg-orange-500/20"></div>

          {/* Marker Pin Base */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 border-2 border-white shadow-xl flex items-center justify-center text-white transform group-hover:-translate-y-1 transition-transform">
            <Flag className="w-5 h-5 fill-white" />
          </div>
        </div>

        {/* Pin Needle Tail */}
        <div className="w-2 h-2 bg-orange-600 rotate-45 -mt-1 shadow-sm"></div>
      </div>
    </Marker>
  );
}
