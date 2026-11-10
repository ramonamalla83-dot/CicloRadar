import React, { useState } from 'react';
import { Camera, Bike, Save, Eye, AlertTriangle, Bell, Play, Square, ShieldCheck, Sun, Moon, Sparkles, Clock, RefreshCw, Link2 } from 'lucide-react';
import { audioEngine, ALARM_PRESETS } from '../utils/audio';
import { useCyclingTheme } from '../hooks/useCyclingTheme';
import { useExternalSync } from '../hooks/useExternalSync';
import SyncAccountsModal from './SyncAccountsModal';

export default function ProfileSettings({ 
  trackingEnabled = true, 
  setTrackingEnabled,
  alarmSound = 'radar_ios',
  setAlarmSound,
  onOpenPermissions,
  onRestartTutorial
}: { 
  trackingEnabled?: boolean;
  setTrackingEnabled?: (enabled: boolean) => void;
  alarmSound?: string;
  setAlarmSound?: (sound: string) => void;
  onOpenPermissions?: () => void;
  onRestartTutorial?: () => void;
}) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bikeImage, setBikeImage] = useState<string | null>(null);

  const [brand, setBrand] = useState('Specialized');
  const [model, setModel] = useState('Rockhopper');
  const [type, setType] = useState('MTB');
  
  const [showTrackingAlert, setShowTrackingAlert] = useState(false);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const sync = useExternalSync();
  const theme = useCyclingTheme();

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleBikeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBikeImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleToggleTrackingClick = () => {
    if (trackingEnabled) {
      setShowTrackingAlert(true);
    } else {
      setTrackingEnabled?.(true);
    }
  };

  const confirmDisableTracking = () => {
    setTrackingEnabled?.(false);
    setShowTrackingAlert(false);
  };

  const toggleSoundTest = () => {
    if (isPlayingTest) {
      audioEngine.stop();
      setIsPlayingTest(false);
    } else {
      audioEngine.play(alarmSound);
      setIsPlayingTest(true);
      // Auto stop after 3 seconds
      setTimeout(() => {
        audioEngine.stop();
        setIsPlayingTest(false);
      }, 3000);
    }
  };

  return (
    <div className="flex-1 bg-zinc-950 p-4 pt-24 pb-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Ajustes de Perfil</h2>
      
      <div className="space-y-8 pb-10">
        
        {/* Foto de perfil */}
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border-4 border-zinc-900 shadow-md">
              {profileImage ? (
                <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-zinc-500" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black cursor-pointer shadow-lg hover:bg-orange-600 transition-colors">
              <Camera className="w-4 h-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
            </label>
          </div>
          <h3 className="font-bold text-white">Foto de Perfil</h3>
          <p className="text-xs text-zinc-400">Hazte visible para otros ciclistas</p>
        </div>
        
        {/* Privacidad y Rastreo */}
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-orange-500" /> Privacidad y Seguridad
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <div>
                <p className="font-bold text-white text-sm">Rastreo de Ubicación</p>
                <p className="text-xs text-zinc-400">{trackingEnabled ? 'Visible en el mapa' : 'Oculto en el mapa'}</p>
              </div>
              <button 
                onClick={handleToggleTrackingClick}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${trackingEnabled ? 'bg-orange-500' : 'bg-zinc-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${trackingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {/* Tono de Alerta SOS y Volumen Boost */}
            <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-orange-500"/> Sonido de Alarma SOS del Sistema
                  </p>
                  <p className="text-xs text-zinc-400">Tono emitido al activar o recibir un SOS</p>
                </div>
                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                  Auto-Boost 🔊
                </span>
              </div>

              {/* Selector de tonos de sistema */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {ALARM_PRESETS.map((preset) => {
                  const isSelected = alarmSound === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAlarmSound?.(preset.id);
                        audioEngine.play(preset.id);
                        setIsPlayingTest(true);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-orange-500/15 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.25)]'
                          : 'bg-zinc-900/80 border-zinc-700/70 hover:bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white leading-tight">{preset.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${preset.badgeColor}`}>
                          {preset.brand.split(' ')[0]}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 line-clamp-2 leading-tight">
                        {preset.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Botón de control de prueba y auto-aumento */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-700/60">
                <span className="text-[11px] text-zinc-400">
                  {isPlayingTest ? '🔊 Sonando a volumen máximo...' : 'Prueba el tono con auto-amplificación:'}
                </span>
                <button 
                  type="button"
                  onClick={toggleSoundTest}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                    isPlayingTest 
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
                      : 'bg-orange-500 text-zinc-950 border-orange-500 hover:bg-orange-400'
                  }`}
                >
                  {isPlayingTest ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlayingTest ? 'Detener Alarma' : 'Probar Alarma'}</span>
                </button>
              </div>

              {/* Info de Aumento de Volumen */}
              <div className="p-2.5 bg-zinc-900/90 border border-zinc-700/60 rounded-lg text-[11px] text-zinc-400 flex items-start gap-2">
                <span className="text-orange-400 font-bold shrink-0">ℹ️</span>
                <span>
                  <strong>Aumento Automático:</strong> Si el volumen del celular está bajo, el motor de audio aplica compresión dinámica y sobreganancia para maximizar la resonancia de los parlantes del móvil.
                </span>
              </div>
            </div>

            {/* Acceso a Permisos e Instalación */}
            {onOpenPermissions && (
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">Instalación y Permisos</p>
                  <p className="text-xs text-zinc-400">GPS, Notificaciones, Wake Lock y PWA</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenPermissions}
                  className="px-3.5 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 text-xs font-bold rounded-lg transition-colors"
                >
                  Configurar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tema Oscuro Avanzado & Confort Visual Nocturno */}
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                {theme.isNightActive ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
                <span>Tema y Confort Visual en Rutas</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Detección automática por hora local (19:30 - 06:30) y sistema operativo para reducir fatiga visual nocturna en el manillar.
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
              theme.isNightActive 
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {theme.isNightActive ? 'NOCTURNO ACTIVO 🌙' : 'DIURNO ACTIVO ☀️'}
            </span>
          </div>

          {/* Selector de Modo: Auto / Noche / Día */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => theme.setMode('auto')}
              className={`p-3 rounded-xl border text-left transition-all ${
                theme.mode === 'auto'
                  ? 'bg-orange-500/15 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.25)] text-white'
                  : 'bg-zinc-800/80 border-zinc-700/70 hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold">Automático</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">Hora y SO</p>
            </button>

            <button
              type="button"
              onClick={() => theme.setMode('night')}
              className={`p-3 rounded-xl border text-left transition-all ${
                theme.mode === 'night'
                  ? 'bg-orange-500/15 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.25)] text-white'
                  : 'bg-zinc-800/80 border-zinc-700/70 hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">Noche OLED</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">Negro puro</p>
            </button>

            <button
              type="button"
              onClick={() => theme.setMode('day')}
              className={`p-3 rounded-xl border text-left transition-all ${
                theme.mode === 'day'
                  ? 'bg-orange-500/15 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.25)] text-white'
                  : 'bg-zinc-800/80 border-zinc-700/70 hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">Día Claro</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">Bajo el sol</p>
            </button>
          </div>

          {/* Info de Detección */}
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs flex items-center justify-between text-zinc-300">
            <div className="flex items-center gap-2">
              <span className="text-sm">⏱️</span>
              <span>
                Hora local: <strong className="font-mono text-white">{theme.timeStr}</strong> · Capa de mapa recomendada: <strong className="text-orange-400">{theme.recommendedMapLayer === 'dark' ? 'Carto Dark' : 'Calles OSM'}</strong>
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 uppercase font-mono">
              {theme.reason === 'local_time' ? 'Reloj Local' : theme.reason === 'system_preference' ? 'Modo SO' : 'Manual'}
            </span>
          </div>

          {/* Switch de Filtro de Confort Nocturno (Anti-Luz Azul) */}
          <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/15 text-orange-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Filtro de Confort Nocturno (Luz Cálida)</p>
                <p className="text-[11px] text-zinc-400">Reduce picos de luz azul para una conducción nocturna sin deslumbramiento</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => theme.setComfortFilter(!theme.comfortFilterEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                theme.comfortFilterEnabled ? 'bg-orange-500' : 'bg-zinc-700'
              }`}
              aria-label="Alternar filtro cálido"
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                theme.comfortFilterEnabled ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Datos de la bicicleta */}
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Bike className="w-5 h-5 text-orange-500" /> Mi Bicicleta
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Marca</label>
                <input 
                  type="text" value={brand} onChange={e => setBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Modelo</label>
                <input 
                  type="text" value={model} onChange={e => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Tipo</label>
              <select 
                value={type} onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg outline-none focus:border-orange-500 transition-colors"
              >
                <option>MTB</option>
                <option>Ruta</option>
                <option>Gravel</option>
                <option>Urbana</option>
                <option>BMX</option>
              </select>
            </div>

            {/* Foto de la bici */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-400 mb-2">Foto de la Bicicleta</label>
              <div className="relative w-full h-40 bg-zinc-800 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden">
                {bikeImage ? (
                  <>
                    <img src={bikeImage} alt="Bicicleta" className="w-full h-full object-cover" />
                    <label className="absolute bottom-2 right-2 bg-black/80 p-2 rounded-full text-white cursor-pointer hover:bg-black transition-colors">
                      <Camera className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleBikeImageUpload} />
                    </label>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-zinc-500 hover:text-orange-500 hover:bg-zinc-700/50 transition-colors">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Subir foto</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleBikeImageUpload} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Guía Interactiva / Tutorial de Inicio */}
        {onRestartTutorial && (
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm">Guía Interactiva de CicloRadar</h3>
              <p className="text-xs text-zinc-400">Repasa las herramientas del radar, clima, capas y SOS</p>
            </div>
            <button
              onClick={onRestartTutorial}
              className="px-3.5 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40 text-xs font-bold transition-colors shrink-0"
            >
              Ver Tutorial
            </button>
          </div>
        )}

        {/* Sincronización Externa (Strava, Garmin, iGPSPORT) */}
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>Cuentas Externas y Telemetría</span>
                {sync.connectedCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {sync.connectedCount} activa{sync.connectedCount > 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">
                Vincula Strava, Garmin Connect e iGPSPORT para importar salidas al Inicio
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition-colors shrink-0 self-start sm:self-auto"
          >
            Configurar Cuentas
          </button>
        </div>

        <button className="w-full bg-orange-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-colors">
          <Save className="w-5 h-5" /> Guardar Cambios
        </button>
      </div>

      {/* Modal de Sincronización */}
      {isSyncModalOpen && (
        <SyncAccountsModal
          onClose={() => setIsSyncModalOpen(false)}
        />
      )}

      {/* Alerta de rastreo Modal */}
      {showTrackingAlert && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-center text-white mb-2">¿Ocultar tu ubicación?</h3>
            <p className="text-sm text-zinc-400 text-center mb-6">
              Si desactivas el rastreo, no serás visible para la comunidad. Sin embargo, <strong className="text-white">tampoco podrás ver a otros ciclistas cercanos en el mapa ni en la sección de Comunidad</strong>.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowTrackingAlert(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDisableTracking}
                className="flex-1 px-4 py-2 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-600 transition-colors"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
