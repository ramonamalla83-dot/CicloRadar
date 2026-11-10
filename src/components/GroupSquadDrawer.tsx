/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Compass, 
  Radio, 
  Coffee, 
  Wrench, 
  AlertTriangle, 
  LogOut, 
  Zap, 
  Crown,
  ChevronRight,
  Send
} from 'lucide-react';
import { 
  RideGroup, 
  RideGroupMember, 
  PingType, 
  GroupPing 
} from '../services/groupRideService';

interface GroupSquadDrawerProps {
  group: RideGroup;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onLeaveGroup: () => void;
  onSendPing: (type: PingType, message?: string) => void;
  onCenterOnMember: (lat: number, lng: number) => void;
  onFitSquadBounds?: () => void;
}

export default function GroupSquadDrawer({
  group,
  userLocation,
  onClose,
  onLeaveGroup,
  onSendPing,
  onCenterOnMember,
  onFitSquadBounds
}: GroupSquadDrawerProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'pings'>('members');
  const [customMsg, setCustomMsg] = useState('');

  const handleCopyCode = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(group.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Calcular distancias desde el usuario a cada miembro
  const membersWithDistance = React.useMemo(() => {
    if (!userLocation) return group.members.map(m => ({ ...m, distMeters: 0, distText: '' }));

    const R = 6371000; // metros
    return group.members.map(m => {
      const dLat = ((m.latitude - userLocation.lat) * Math.PI) / 180;
      const dLon = ((m.longitude - userLocation.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLocation.lat * Math.PI) / 180) *
          Math.cos((m.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distMeters = Math.round(R * c);
      const distText = distMeters < 1000 ? `${distMeters} m` : `${(distMeters / 1000).toFixed(1)} km`;
      return { ...m, distMeters, distText };
    }).sort((a, b) => a.distMeters - b.distMeters);
  }, [group.members, userLocation]);

  // Velocidad media del pelotón
  const avgSpeed = React.useMemo(() => {
    if (group.members.length === 0) return 0;
    const total = group.members.reduce((acc, m) => acc + m.speedKmh, 0);
    return Math.round(total / group.members.length);
  }, [group.members]);

  // Compañero más rezagado
  const delayedMember = React.useMemo(() => {
    const others = membersWithDistance.filter(m => !m.isCurrentUser);
    if (others.length === 0) return null;
    const max = others[others.length - 1];
    return max.distMeters > 300 ? max : null;
  }, [membersWithDistance]);

  const handleCustomPingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;
    onSendPing('caution', customMsg.trim());
    setCustomMsg('');
  };

  return (
    <div className="absolute top-20 left-4 right-18 sm:left-auto sm:right-20 sm:w-92 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 text-white rounded-3xl p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-top-4 duration-200 max-h-[80vh] flex flex-col">
      {/* Drawer Header */}
      <div className="flex items-start justify-between pb-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Users className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {group.discipline}
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">
                {group.members.length} ciclistas
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-white mt-0.5 truncate max-w-[190px]">
              {group.name}
            </h3>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Code Share Bar */}
      <div className="my-3 p-2.5 bg-zinc-900/80 rounded-2xl border border-zinc-800/80 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Código del Grupo</span>
          <span className="text-base font-black tracking-widest text-orange-400 font-mono">
            {group.code}
          </span>
        </div>
        <button
          onClick={handleCopyCode}
          className="h-8 px-3 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
          title="Copiar código para amigos"
        >
          {copiedCode ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedCode ? '¡Copiado!' : 'Compartir'}</span>
        </button>
      </div>

      {/* Alerta de Pelotón si hay rezagado */}
      {delayedMember && (
        <div className="mb-3 p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="truncate">
              <strong>{delayedMember.name}</strong> quedó a {delayedMember.distText}
            </span>
          </div>
          <button
            onClick={() => onSendPing('regroup')}
            className="text-[10px] font-black bg-amber-500 text-zinc-950 px-2 py-1 rounded-lg shrink-0 hover:bg-amber-400"
          >
            Reagrupar
          </button>
        </div>
      )}

      {/* Tabs Switcher: Miembros vs Pings de Pelotón */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-bold mb-3 shrink-0">
        <button
          onClick={() => setActiveTab('members')}
          className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'members'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pelotón ({group.members.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pings')}
          className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'pings'
              ? 'bg-zinc-800 text-orange-400 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Avisos ({group.pings.length})</span>
        </button>
      </div>

      {/* TAB 1: LISTA DE MIEMBROS EN TIEMPO REAL */}
      {activeTab === 'members' && (
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-center">
              <span className="text-[10px] text-zinc-400 block font-medium">Velocidad Pelotón</span>
              <span className="text-base font-black text-white">{avgSpeed} km/h</span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-center">
              <span className="text-[10px] text-zinc-400 block font-medium">Líder de Ruta</span>
              <span className="text-xs font-bold text-orange-400 truncate block mt-0.5">{group.leaderName}</span>
            </div>
          </div>

          {membersWithDistance.map((member) => (
            <div
              key={member.id}
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                member.isCurrentUser
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 border ${member.avatarColor}`}>
                  <span>{member.initials}</span>
                  {member.isLeader && (
                    <Crown className="w-3 h-3 text-amber-400 fill-amber-400 absolute -top-1.5 -right-1" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">
                      {member.name}
                    </span>
                    {member.isCurrentUser && (
                      <span className="text-[9px] font-bold text-orange-400 bg-orange-500/20 px-1 rounded">
                        Tú
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                    <span className="font-semibold text-zinc-200">{member.speedKmh} km/h</span>
                    {!member.isCurrentUser && member.distText && (
                      <span>· {member.distText}</span>
                    )}
                  </div>
                </div>
              </div>

              {!member.isCurrentUser && (
                <button
                  onClick={() => onCenterOnMember(member.latitude, member.longitude)}
                  className="p-2 text-zinc-400 hover:text-orange-400 hover:bg-zinc-800 rounded-xl transition-colors shrink-0"
                  title={`Centrar mapa en ${member.name}`}
                >
                  <Compass className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: PINGS & AVISOS DE PELOTÓN */}
      {activeTab === 'pings' && (
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {/* Quick Ping Action Buttons */}
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            <button
              onClick={() => onSendPing('regroup')}
              className="p-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 flex flex-col items-center gap-1 transition-colors"
              title="Solicitar Reagrupamiento"
            >
              <Radio className="w-4 h-4" />
              <span className="text-[9px] font-bold">Reagrupar</span>
            </button>
            <button
              onClick={() => onSendPing('caution')}
              className="p-2 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-400 flex flex-col items-center gap-1 transition-colors"
              title="Avisar de peligro u obstáculo"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[9px] font-bold">Peligro</span>
            </button>
            <button
              onClick={() => onSendPing('puncture')}
              className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 flex flex-col items-center gap-1 transition-colors"
              title="Notificar Pinchazo"
            >
              <Wrench className="w-4 h-4" />
              <span className="text-[9px] font-bold">Pinchazo</span>
            </button>
            <button
              onClick={() => onSendPing('coffee')}
              className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 flex flex-col items-center gap-1 transition-colors"
              title="Parada de Agua / Café"
            >
              <Coffee className="w-4 h-4" />
              <span className="text-[9px] font-bold">Parada</span>
            </button>
          </div>

          {/* Form de Mensaje Personalizado */}
          <form onSubmit={handleCustomPingSubmit} className="flex gap-1.5 mb-2">
            <input
              type="text"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              placeholder="Mensaje rápido al pelotón..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              maxLength={60}
            />
            <button
              type="submit"
              disabled={!customMsg.trim()}
              className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Feed de Mensajes */}
          <div className="space-y-1.5">
            {group.pings.map((ping) => (
              <div 
                key={ping.id} 
                className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs flex items-start gap-2"
              >
                <div className="p-1 rounded-lg bg-zinc-800 text-orange-400 shrink-0 mt-0.5">
                  {ping.type === 'regroup' ? (
                    <Radio className="w-3.5 h-3.5" />
                  ) : ping.type === 'puncture' ? (
                    <Wrench className="w-3.5 h-3.5 text-red-400" />
                  ) : ping.type === 'coffee' ? (
                    <Coffee className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="font-bold text-zinc-300">{ping.senderName}</span>
                    <span>hace unos instantes</span>
                  </div>
                  <p className="text-[11px] text-zinc-200 mt-0.5">{ping.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drawer Footer Actions */}
      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2 shrink-0">
        {onFitSquadBounds && (
          <button
            onClick={onFitSquadBounds}
            className="h-9 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Ajustar zoom para ver a todos los miembros"
          >
            <Compass className="w-3.5 h-3.5 text-orange-400" />
            <span>Ver Pelotón</span>
          </button>
        )}

        <button
          onClick={onLeaveGroup}
          className="h-9 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors ml-auto"
          title="Salir del grupo de ruta"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Finalizar / Salir</span>
        </button>
      </div>
    </div>
  );
}
