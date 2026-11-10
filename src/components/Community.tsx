/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { 
  MessageCircle, 
  User, 
  MapPin, 
  EyeOff, 
  AlertTriangle, 
  Users, 
  Clock, 
  ThumbsUp, 
  Compass, 
  ShieldAlert,
  Bike,
  Plus,
  KeyRound,
  LogOut,
  ArrowRight,
  Radio,
  Crown
} from 'lucide-react';
import { useHazards } from '../hooks/useHazards';
import { HAZARD_TYPES_CONFIG } from '../services/hazardsService';
import { useGroupRide } from '../hooks/useGroupRide';
import HazardIcon from './HazardIcon';

interface CommunityProps {
  trackingEnabled?: boolean;
  onNavigateToMap?: () => void;
}

export default function Community({ 
  trackingEnabled = true, 
  onNavigateToMap 
}: CommunityProps) {
  const [activeTab, setActiveTab] = useState<'cyclists' | 'groups' | 'hazards'>('cyclists');
  const { hazards, confirmHazard } = useHazards();
  const groupRide = useGroupRide();
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const nearbyCyclists = [
    { id: 1, name: 'Carlos M.', distance: '0.5 km', active: true, message: '¡Rodando por la montaña!' },
    { id: 2, name: 'Ana G.', distance: '1.2 km', active: false, message: 'Descansando en el mirador.' },
    { id: 3, name: 'Juan P.', distance: '2.0 km', active: true, message: 'Entrenamiento de ruta.' },
  ];

  const publicGroups = groupRide.getPublicGroups();

  const handleJoinWithCode = (e: FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    groupRide.joinGroup(joinCodeInput.trim().toUpperCase(), 'Ciclista', { lat: -33.2994, lng: -66.3369 });
    setJoinCodeInput('');
    if (onNavigateToMap) onNavigateToMap();
  };

  const handleJoinPublic = (code: string) => {
    groupRide.joinGroup(code, 'Ciclista', { lat: -33.2994, lng: -66.3369 });
    if (onNavigateToMap) onNavigateToMap();
  };

  return (
    <div className="flex-1 bg-zinc-950 p-4 pt-24 pb-24 overflow-y-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Comunidad CicloRadar</h2>
          <p className="text-xs text-zinc-400">Red colaborativa de ciclistas, pelotones y seguridad</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-zinc-900 p-1 rounded-2xl border border-zinc-800 flex items-center shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cyclists')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cyclists'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Ciclistas ({nearbyCyclists.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'groups'
                ? 'bg-cyan-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Grupos {groupRide.isInGroup ? '(1 activo)' : `(${publicGroups.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('hazards')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'hazards'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Peligros ({hazards.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CICLISTAS CERCANOS */}
      {activeTab === 'cyclists' && (
        <>
          {!trackingEnabled ? (
            <div className="bg-orange-500/10 border border-orange-500/30 p-6 rounded-2xl flex flex-col items-center text-center text-orange-400">
              <EyeOff className="w-12 h-12 mb-4 text-orange-500" />
              <h3 className="font-bold text-lg mb-2 text-orange-400">Rastreo Desactivado</h3>
              <p className="text-sm text-orange-500/80">
                No puedes ver a otros ciclistas porque has ocultado tu ubicación. Activa el rastreo en tu perfil para unirte a la comunidad.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {nearbyCyclists.map(cyclist => (
                <div key={cyclist.id} className="bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-zinc-500" />
                    </div>
                    {cyclist.active && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white">{cyclist.name}</h3>
                      <span className="text-xs text-orange-500 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3" /> {cyclist.distance}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 truncate">{cyclist.message}</p>
                  </div>
                  <button 
                    className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-orange-500 hover:bg-orange-500/20 transition-colors"
                    title="Enviar mensaje"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: GRUPOS DE RUTA / PELOTONES */}
      {activeTab === 'groups' && (
        <div className="space-y-5">
          {/* Si ya tiene un grupo activo */}
          {groupRide.activeGroup ? (
            <div className="bg-gradient-to-br from-cyan-950/60 to-zinc-900 border border-cyan-500/40 p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                    <Users className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {groupRide.activeGroup.discipline}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-zinc-300">
                        #{groupRide.activeGroup.code}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      {groupRide.activeGroup.name}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => groupRide.leaveGroup()}
                  className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Salir del grupo"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Miembros del grupo activo */}
              <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80 space-y-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Miembros en la salida ({groupRide.activeGroup.members.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {groupRide.activeGroup.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-800 text-xs"
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${m.avatarColor}`}>
                        {m.initials}
                      </span>
                      <span className="text-zinc-200 font-medium">{m.name}</span>
                      <span className="text-[10px] text-cyan-400 font-bold">{m.speedKmh}k</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón para verlos en el mapa */}
              {onNavigateToMap && (
                <button
                  onClick={onNavigateToMap}
                  className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-zinc-950 font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                >
                  <Compass className="w-4 h-4" />
                  <span>Ver Amigos en Tiempo Real sobre el Mapa</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Formulario rápido para unirse con código */}
              <form onSubmit={handleJoinWithCode} className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  ¿Tienes el código de un amigo?
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="ej. ROD-412"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold tracking-widest text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 uppercase"
                    maxLength={10}
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-zinc-950 font-black text-xs flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <span>Unirme</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Botón para crear nueva salida */}
              {onNavigateToMap && (
                <button
                  onClick={onNavigateToMap}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Nuevo Grupo de Ruta y Obtener Código</span>
                </button>
              )}
            </>
          )}

          {/* Salidas comunitarias abiertas */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
              Pelotones y Salidas Abiertas Hoy
            </span>

            <div className="space-y-2.5">
              {publicGroups.map((group) => (
                <div
                  key={group.code}
                  className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {group.discipline}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 font-bold">
                        #{group.code}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1 truncate">{group.name}</h4>
                    <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 mt-0.5">
                      <span>{group.membersCount} ciclistas</span>
                      <span>· Ritmo {group.pace}</span>
                      <span>· {group.distanceKm}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinPublic(group.code)}
                    className="h-9 px-3.5 rounded-xl bg-zinc-800 hover:bg-cyan-500 text-zinc-200 hover:text-zinc-950 font-black text-xs border border-zinc-700 hover:border-cyan-500 transition-colors shrink-0"
                  >
                    Unirme
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PELIGROS E HITOS REPORTADOS EN TIEMPO REAL */}
      {activeTab === 'hazards' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Alertas Colaborativas en Tiempo Real
            </span>
            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Ver en Mapa</span>
              </button>
            )}
          </div>

          {hazards.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-zinc-400">
              <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
              <p className="font-semibold text-sm">No hay peligros reportados actualmente.</p>
              <p className="text-xs text-zinc-500 mt-1">¡Rutas comunitarias 100% transitables!</p>
            </div>
          ) : (
            hazards.map((hazard) => {
              const cfg = HAZARD_TYPES_CONFIG[hazard.type] || HAZARD_TYPES_CONFIG.obras;
              return (
                <div
                  key={hazard.id}
                  className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl ${cfg.markerBg} text-white shrink-0`}>
                        <HazardIcon type={hazard.type} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${cfg.badgeBg} ${cfg.textColor} ${cfg.borderColor}`}>
                            {cfg.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            hazard.severity === 'critica'
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : hazard.severity === 'alta'
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                          }`}>
                            {hazard.severity}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-1">{hazard.title}</h4>
                      </div>
                    </div>

                    <button
                      onClick={() => confirmHazard(hazard.id)}
                      disabled={hazard.userVoted}
                      className={`h-8 px-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors shrink-0 ${
                        hazard.userVoted
                          ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                          : 'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25'
                      }`}
                      title="Confirmar vigencia del peligro"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{hazard.confirmations}</span>
                    </button>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                    {hazard.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-orange-400" />
                      <span>Por <strong>{hazard.reportedBy}</strong></span>
                    </div>

                    {onNavigateToMap && (
                      <button
                        onClick={onNavigateToMap}
                        className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 text-[11px]"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Ver en Radar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
