/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  KeyRound, 
  Bike, 
  Mountain, 
  Compass, 
  Clock, 
  Zap, 
  Check, 
  ChevronRight,
  Flame,
  ArrowRight
} from 'lucide-react';
import { 
  GroupDiscipline, 
  PublicGroupSummary 
} from '../services/groupRideService';

interface GroupRideModalProps {
  userName: string;
  userCoords: { lat: number; lng: number };
  publicGroups: PublicGroupSummary[];
  onClose: () => void;
  onCreateGroup: (params: {
    name: string;
    discipline: GroupDiscipline;
    userName: string;
    userCoords: { lat: number; lng: number };
    durationHours: number;
  }) => void;
  onJoinGroup: (code: string) => void;
}

export default function GroupRideModal({
  userName,
  userCoords,
  publicGroups,
  onClose,
  onCreateGroup,
  onJoinGroup
}: GroupRideModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [groupName, setGroupName] = useState('');
  const [discipline, setDiscipline] = useState<GroupDiscipline>('ruta');
  const [durationHours, setDurationHours] = useState(4);
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const disciplinesConfig: { id: GroupDiscipline; label: string; icon: typeof Bike }[] = [
    { id: 'ruta', label: 'Ruta / Carretera', icon: Bike },
    { id: 'mtb', label: 'Montaña / MTB', icon: Mountain },
    { id: 'gravel', label: 'Gravel & Ripio', icon: Compass },
    { id: 'urbana', label: 'Urbana / Ciudad', icon: Zap },
    { id: 'recreativa', label: 'Paseo Recreativo', icon: Flame }
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = groupName.trim() || `Salida ${disciplinesConfig.find(d => d.id === discipline)?.label || 'Grupal'}`;
    onCreateGroup({
      name: finalName,
      discipline,
      userName,
      userCoords,
      durationHours
    });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setErrorMsg('Ingresa un código de grupo válido (ej. ROD-412)');
      return;
    }
    onJoinGroup(inputCode.trim().toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Grupos de Ruta</h3>
              <p className="text-xs text-zinc-400">Coordinación en vivo con amigos y pelotón</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-zinc-900/40 border-b border-zinc-800 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 rounded-2xl border border-zinc-800 text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab('create');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Crear Salida</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('join');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'join'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Unirme con Código</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: CREAR SALIDA */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Nombre de la Salida / Pelotón
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="ej. Pelotón Sabatino 50K"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  maxLength={50}
                />
              </div>

              {/* Disciplina */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                  Tipo de Modalidad
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {disciplinesConfig.map((item) => {
                    const Icon = item.icon;
                    const isSelected = discipline === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDiscipline(item.id)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-500 text-white shadow-sm'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duración de la Salida */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                  Duración Temporal Activa
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 4, 8].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setDurationHours(hours)}
                      className={`h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        durationHours === hours
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{hours} horas</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  El grupo se cierra automáticamente después de este período o cuando finalices la salida.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                >
                  <Users className="w-4 h-4" />
                  <span>Crear Grupo y Generar Código</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: UNIRME CON CÓDIGO & SALIDAS COMUNITARIAS */}
          {activeTab === 'join' && (
            <div className="space-y-5">
              <form onSubmit={handleJoinSubmit} className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Ingresa el Código de tus Amigos
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="ej. ROD-412"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold tracking-widest text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 uppercase"
                    maxLength={10}
                  />
                  <button
                    type="submit"
                    className="h-11 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <span>Unirme</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Salidas Públicas de la Comunidad */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
                  O súmate a una salida de la comunidad hoy
                </span>

                <div className="space-y-2">
                  {publicGroups.map((pub) => (
                    <div
                      key={pub.code}
                      className="bg-zinc-900/80 hover:bg-zinc-800/80 p-3 rounded-2xl border border-zinc-800/80 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            {pub.discipline}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono font-bold">
                            #{pub.code}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1 truncate">{pub.name}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                          <span>{pub.membersCount} ciclistas</span>
                          <span>· Ritmo: {pub.pace}</span>
                          <span>· {pub.distanceKm}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onJoinGroup(pub.code)}
                        className="h-9 px-3 rounded-xl bg-zinc-800 hover:bg-orange-500 text-zinc-300 hover:text-white border border-zinc-700 hover:border-orange-500 text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                      >
                        <span>Unirme</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
