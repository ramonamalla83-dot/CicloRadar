/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  Check, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  LogOut, 
  Radio, 
  Layers, 
  Bike, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { 
  SyncProvider, 
  PROVIDERS_CONFIG 
} from '../services/externalSyncService';
import { useExternalSync } from '../hooks/useExternalSync';

interface SyncAccountsModalProps {
  onClose: () => void;
  onSyncComplete?: (newCount: number) => void;
}

export default function SyncAccountsModal({
  onClose,
  onSyncComplete
}: SyncAccountsModalProps) {
  const sync = useExternalSync();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [syncingProvider, setSyncingProvider] = useState<SyncProvider | null>(null);
  const [toastNote, setToastNote] = useState<string | null>(null);

  const redirectUri = sync.getRedirectUri();

  const handleCopyRedirect = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(redirectUri);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleConnectProvider = async (provider: SyncProvider) => {
    // 1. Intentar popup OAuth estándar
    const opened = await sync.startOAuthPopup(provider);
    if (!opened) {
      // Fallback a conexión directa si el navegador bloquea ventanas emergentes
      sync.connectAccount(provider);
      setToastNote(`¡Cuenta de ${PROVIDERS_CONFIG[provider].name} vinculada con éxito!`);
    } else {
      setToastNote(`Ventana de autorización de ${PROVIDERS_CONFIG[provider].name} abierta.`);
    }
  };

  const handleManualSync = async (provider: SyncProvider) => {
    setSyncingProvider(provider);
    const added = await sync.syncAccount(provider);
    setSyncingProvider(null);
    setToastNote(`Sincronizadas ${added.length} actividades de ${PROVIDERS_CONFIG[provider].name}`);
    if (onSyncComplete) onSyncComplete(added.length);
  };

  const handleSyncAll = async () => {
    const total = await sync.syncAll();
    setToastNote(`¡Sincronización completa! Se actualizaron ${total} rutas históricas.`);
    if (onSyncComplete) onSyncComplete(total);
  };

  const providersList: SyncProvider[] = ['strava', 'garmin', 'igsport'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Vincular Cuentas de Ciclismo</h3>
              <p className="text-xs text-zinc-400">Importa tus salidas de Strava, Garmin Connect e iGPSPORT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Toast */}
        {toastNote && (
          <div className="bg-orange-500/15 border-b border-orange-500/30 px-5 py-2.5 text-xs text-orange-300 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>{toastNote}</span>
            </div>
            <button onClick={() => setToastNote(null)} className="text-orange-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Global Sync Action Bar */}
          {sync.hasAnyConnected && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-sky-500/10 to-rose-500/15 border border-zinc-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">Sincronización Total</span>
                <span className="text-[11px] text-zinc-400">
                  {sync.connectedCount} de 3 cuentas vinculadas
                </span>
              </div>
              <button
                onClick={handleSyncAll}
                disabled={sync.isSyncing}
                className="h-10 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sync.isSyncing ? 'animate-spin' : ''}`} />
                <span>{sync.isSyncing ? 'Sincronizando...' : 'Sincronizar Todas'}</span>
              </button>
            </div>
          )}

          {/* List of Provider Cards */}
          <div className="space-y-3">
            {providersList.map((provider) => {
              const cfg = PROVIDERS_CONFIG[provider];
              const acc = sync.accounts[provider];
              const isBusy = syncingProvider === provider || sync.isSyncing;

              return (
                <div
                  key={provider}
                  className={`p-4 rounded-2xl border transition-all ${
                    acc.connected
                      ? 'bg-zinc-900/90 border-zinc-700/80 shadow-md'
                      : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Logo Badge */}
                      <div className={`w-11 h-11 rounded-2xl ${cfg.badgeBg} ${cfg.borderColor} border flex items-center justify-center shrink-0 shadow-sm`}>
                        {provider === 'strava' ? (
                          <span className="font-black text-sm text-[#FC6100]">STR</span>
                        ) : provider === 'garmin' ? (
                          <span className="font-black text-sm text-[#007CC3]">GAR</span>
                        ) : (
                          <span className="font-black text-sm text-[#E53935]">iGS</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-white">{cfg.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                            acc.connected
                              ? 'bg-green-500/20 text-green-400 border-green-500/40'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {acc.connected ? 'Conectado' : 'No Vinculado'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{cfg.tagline}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    {acc.connected ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleManualSync(provider)}
                          disabled={isBusy}
                          className="h-8 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title="Sincronizar ahora"
                        >
                          <RefreshCw className={`w-3 h-3 ${isBusy ? 'animate-spin text-orange-400' : ''}`} />
                          <span className="hidden sm:inline">Sincronizar</span>
                        </button>
                        <button
                          onClick={() => sync.disconnectAccount(provider)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Desvincular cuenta"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnectProvider(provider)}
                        className="h-9 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
                      >
                        <span>Vincular</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Detalle si está conectado */}
                  {acc.connected && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 text-zinc-400">
                        <span className="text-zinc-200 font-semibold truncate max-w-[170px]">
                          {acc.athleteName}
                        </span>
                        <span>·</span>
                        <span>{acc.syncedActivitiesCount} rutas</span>
                        <span>·</span>
                        <span className="text-orange-400 font-mono font-bold">{acc.totalDistanceKm} km</span>
                      </div>

                      {/* Auto-Sync Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-zinc-400 hover:text-zinc-200">
                        <span>Auto-sincronizar</span>
                        <input
                          type="checkbox"
                          checked={acc.autoSync}
                          onChange={(e) => sync.toggleAutoSync(provider, e.target.checked)}
                          className="w-3.5 h-3.5 accent-orange-500 rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* OAuth Developer Setup & Callback URI Information */}
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                <span>Configuración de OAuth para Desarrollador</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Oficial y Seguro
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Para vincular directamente tus credenciales de Strava API o Garmin Portal, utiliza la siguiente URL de redirección en tu aplicación:
            </p>

            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
              <code className="text-[11px] text-orange-400 font-mono truncate select-all">
                {redirectUri}
              </code>
              <button
                onClick={handleCopyRedirect}
                className="h-7 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
