/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { RideGroupMember } from '../services/groupRideService';
import { Crown, Navigation2 } from 'lucide-react';

interface GroupMemberMarkerProps {
  key?: React.Key;
  member: RideGroupMember;
  distanceFromUser?: string;
  isSelected?: boolean;
  onClick: (member: RideGroupMember) => void;
}

export default function GroupMemberMarker({
  member,
  distanceFromUser,
  isSelected = false,
  onClick
}: GroupMemberMarkerProps) {
  // Estado visual
  const isMoving = member.speedKmh > 3;

  return (
    <Marker
      longitude={member.longitude}
      latitude={member.latitude}
      anchor="center"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick(member);
      }}
    >
      <div 
        className="group relative flex flex-col items-center cursor-pointer select-none transition-transform hover:scale-110 active:scale-95"
        title={`${member.name} (${member.speedKmh} km/h)`}
      >
        {/* Halo pulsante si está seleccionado o en alerta */}
        {(isSelected || member.status === 'sos') && (
          <span className={`absolute -inset-2 rounded-full opacity-60 animate-ping ${
            member.status === 'sos' ? 'bg-red-500' : 'bg-orange-500'
          }`} />
        )}

        {/* Badge superior de Líder o Corona */}
        {member.isLeader && (
          <span className="absolute -top-3 bg-amber-400 text-zinc-950 p-0.5 rounded-full shadow-md z-20">
            <Crown className="w-2.5 h-2.5 fill-zinc-950 stroke-[3]" />
          </span>
        )}

        {/* Contenedor del Avatar */}
        <div className={`relative z-10 w-11 h-11 rounded-full border-2 flex items-center justify-center font-black text-xs text-white shadow-xl transition-all ${
          isSelected 
            ? 'ring-4 ring-orange-500 ring-offset-2 ring-offset-zinc-950 scale-110 border-white' 
            : 'border-zinc-900'
        } ${member.avatarColor}`}>
          <span>{member.initials}</span>

          {/* Indicador de estado de pedaleo (punto verde/amarillo/rojo) */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${
            member.status === 'sos'
              ? 'bg-red-500 animate-pulse'
              : member.status === 'delayed'
              ? 'bg-amber-400'
              : isMoving
              ? 'bg-green-400'
              : 'bg-zinc-400'
          }`} />
        </div>

        {/* Pill de Velocidad actual */}
        <div className="relative -mt-1 z-10 bg-zinc-950/95 border border-zinc-700 text-white px-1.5 py-0.2 rounded-full text-[9px] font-bold shadow-md flex items-center gap-0.5">
          <Navigation2 className="w-2.5 h-2.5 text-orange-400 rotate-45" />
          <span>{member.speedKmh}k</span>
        </div>

        {/* Etiqueta flotante con nombre y distancia */}
        <div className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg backdrop-blur-md border border-zinc-800 transition-opacity whitespace-nowrap ${
          isSelected 
            ? 'opacity-100 bg-zinc-950 text-white border-orange-500' 
            : 'opacity-0 group-hover:opacity-100 bg-zinc-950/90 text-zinc-200 pointer-events-none'
        }`}>
          <span>{member.name}</span>
          {distanceFromUser && (
            <span className="text-orange-400 ml-1">· {distanceFromUser}</span>
          )}
        </div>
      </div>
    </Marker>
  );
}
