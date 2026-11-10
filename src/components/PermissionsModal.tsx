import { useState } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Volume2, 
  Bell, 
  Download, 
  Smartphone, 
  Check, 
  AlertCircle, 
  Share2, 
  PlusSquare, 
  X, 
  Play, 
  Square,
  Sparkles,
  Zap,
  Info,
  Mic
} from 'lucide-react';
import { audioEngine, ALARM_PRESETS } from '../utils/audio';
import { useVoiceSos } from '../hooks/useVoiceSos';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarmSound?: string;
  permissions: {
    geoStatus: 'granted' | 'denied' | 'prompt' | 'unsupported';
    audioUnlocked: boolean;
    notifStatus: 'granted' | 'denied' | 'prompt' | 'unsupported';
    wakeLockSupported: boolean;
    vibrationSupported: boolean;
    isStandalone: boolean;
    installPromptEvent: any;
    isIOS: boolean;
    requestGeolocation: () => Promise<boolean>;
    requestAudioUnlock: () => Promise<boolean>;
    requestNotifications: () => Promise<boolean>;
    testBackgroundNotification?: (delaySeconds?: number) => Promise<boolean>;
    grantAllPermissions: () => Promise<void>;
    triggerInstallPrompt: () => Promise<boolean>;
  };
}

export default function PermissionsModal({
  isOpen,
  onClose,
  alarmSound = 'radar_ios',
  permissions
}: PermissionsModalProps) {
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [bgTestCountdown, setBgTestCountdown] = useState<number | null>(null);
  const voiceSos = useVoiceSos();

  if (!isOpen) return null;

  const {
    geoStatus,
    audioUnlocked,
    notifStatus,
    wakeLockSupported,
    vibrationSupported,
    isStandalone,
    installPromptEvent,
    isIOS,
    requestGeolocation,
    requestAudioUnlock,
    requestNotifications,
    testBackgroundNotification,
    grantAllPermissions,
    triggerInstallPrompt
  } = permissions;

  const currentPreset = ALARM_PRESETS.find(p => p.id === alarmSound) || ALARM_PRESETS[0];

  const handleTestBackground = async () => {
    if (testBackgroundNotification) {
      setBgTestCountdown(4);
      await testBackgroundNotification(4);
      const timer = setInterval(() => {
        setBgTestCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleTestSound = async () => {
    if (isPlayingTest) {
      audioEngine.stop();
      setIsPlayingTest(false);
    } else {
      setIsPlayingTest(true);
      await audioEngine.play(alarmSound);
      setTimeout(() => {
        audioEngine.stop();
        setIsPlayingTest(false);
      }, 4000);
    }
  };

  const handleGrantAll = async () => {
    setIsGranting(true);
    await grantAllPermissions();
    setIsGranting(false);
  };

  const allGranted = geoStatus === 'granted' && audioUnlocked && (notifStatus === 'granted' || notifStatus === 'unsupported');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 pb-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white leading-tight">Instalación y Permisos SOS</h3>
              <p className="text-xs text-zinc-400">Garantiza el sonido y respuesta en caso de emergencia</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-zinc-300">

          {/* Quick Notice: Volume Booster explanation */}
          <div className="p-3.5 bg-gradient-to-r from-orange-500/15 to-amber-500/10 border border-orange-500/30 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-white block mb-0.5">🔊 Aumento Acústico Automático</span>
              Al sonar el SOS, el motor Web Audio aplica <strong className="text-orange-300">compresión dinámica y boost de ganancia (+240%)</strong> para maximizar el volumen incluso si el nivel del móvil está bajo.
            </div>
          </div>

          {/* Section 1: Permissions List */}
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
              Permisos del Dispositivo
            </h4>
            
            <div className="space-y-2">
              
              {/* 1. Geolocalización */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${geoStatus === 'granted' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">GPS y Geolocalización</p>
                    <p className="text-[11px] text-zinc-400 truncate">Transmitir coordenadas precisas en ruta y SOS</p>
                  </div>
                </div>

                {geoStatus === 'granted' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                    <Check className="w-3 h-3 stroke-[3]" /> Activo
                  </span>
                ) : (
                  <button 
                    onClick={requestGeolocation}
                    className="text-xs font-bold bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                  >
                    Permitir
                  </button>
                )}
              </div>

              {/* 2. Audio & Volumen Auto-Boost */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${audioUnlocked ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">Audio a Volumen Máximo</p>
                    <p className="text-[11px] text-zinc-400 truncate">Desbloqueo de sonido para alarmas sin bloqueo</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={handleTestSound}
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                      isPlayingTest 
                        ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                    }`}
                    title="Probar sonido actual"
                  >
                    {isPlayingTest ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-orange-400" />}
                    <span className="text-[10px]">{isPlayingTest ? 'Parar' : 'Probar'}</span>
                  </button>

                  {audioUnlocked ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                      <Check className="w-3 h-3 stroke-[3]" /> Listo
                    </span>
                  ) : (
                    <button 
                      onClick={requestAudioUnlock}
                      className="text-xs font-bold bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Activar
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Notificaciones Push */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${notifStatus === 'granted' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">Notificaciones SOS</p>
                    <p className="text-[11px] text-zinc-400 truncate">Alertas prioritarias en pantalla bloqueada</p>
                  </div>
                </div>

                {notifStatus === 'granted' ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleTestBackground}
                      disabled={bgTestCountdown !== null}
                      className="text-[10px] font-bold bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                      title="Dispara una notificación dentro de 4 segundos para que minimices la app"
                    >
                      <Bell className="w-3 h-3" />
                      <span>{bgTestCountdown !== null ? `En ${bgTestCountdown}s...` : 'Probar en 2do Plano'}</span>
                    </button>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                      <Check className="w-3 h-3 stroke-[3]" /> Activo
                    </span>
                  </div>
                ) : (
                  <button 
                    onClick={requestNotifications}
                    className="text-xs font-bold bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                  >
                    Permitir
                  </button>
                )}
              </div>

              {/* 4. Micrófono para Comando de Voz 'CicloRadar SOS' */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${voiceSos.isListening ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">Comando de Voz ("CicloRadar SOS")</p>
                    <p className="text-[11px] text-zinc-400 truncate">Detección de voz manos libres en primer plano</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {voiceSos.isListening ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                      <Check className="w-3 h-3 stroke-[3]" /> Activo
                    </span>
                  ) : (
                    <button 
                      onClick={() => voiceSos.startListening()}
                      className="text-xs font-bold bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Activar
                    </button>
                  )}
                </div>
              </div>

              {/* Banner de cuenta regresiva para prueba en 2do plano */}
              {bgTestCountdown !== null && (
                <div className="p-3 bg-orange-500/15 border border-orange-500/40 rounded-xl text-xs text-orange-300 animate-in fade-in duration-200">
                  <p className="font-bold flex items-center gap-1.5 text-white">
                    <Bell className="w-4 h-4 text-orange-400 animate-bounce" />
                    ¡Minimiza la app o apaga la pantalla ahora!
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-300">
                    En <strong className="text-orange-400 font-mono">{bgTestCountdown} segundos</strong> el Service Worker emitirá la notificación SOS del sistema con vibración en segundo plano.
                  </p>
                </div>
              )}

              {/* 4. Bloqueo de Suspensión (Wake Lock) & Vibración */}
              <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span>Pantalla siempre encendida (Wake Lock)</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold bg-zinc-800 px-2 py-0.5 rounded">
                  {wakeLockSupported ? 'Soportado ✅' : 'Automático'}
                </span>
              </div>
            </div>

            {/* Grant All Button */}
            {!allGranted && (
              <button 
                onClick={handleGrantAll}
                disabled={isGranting}
                className="mt-3 w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                {isGranting ? 'Configurando...' : 'Conceder Todos los Permisos de una Vez'}
              </button>
            )}
          </div>

          {/* Section 2: Install App on Device (PWA) */}
          <div className="pt-2 border-t border-zinc-800">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-orange-400" />
              Instalar en la Pantalla de Inicio
            </h4>

            {isStandalone ? (
              <div className="p-3.5 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 text-zinc-950 flex items-center justify-center font-bold shrink-0">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">¡App ya instalada en tu móvil!</p>
                  <p className="text-zinc-400 text-[11px]">Estás ejecutando CicloRadar en modo pantalla completa nativo.</p>
                </div>
              </div>
            ) : installPromptEvent ? (
              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-2.5">
                <p className="text-xs text-zinc-300">
                  Instala CicloRadar como aplicación independiente en tu teléfono para abrirla desde el manillar sin barras del navegador.
                </p>
                <button 
                  onClick={triggerInstallPrompt}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors"
                >
                  <Download className="w-4 h-4" /> Instalar CicloRadar con 1 Clic
                </button>
              </div>
            ) : isIOS ? (
              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-orange-400" /> Cómo instalar en iPhone / iPad (Safari):
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-zinc-300 text-[11px] leading-relaxed">
                  <li>
                    Pulsa el botón <strong className="text-white inline-flex items-center gap-0.5"><Share2 className="w-3 h-3 text-sky-400 inline" /> Compartir</strong> en la barra inferior de Safari.
                  </li>
                  <li>
                    Desliza hacia arriba y selecciona <strong className="text-white inline-flex items-center gap-0.5"><PlusSquare className="w-3 h-3 text-orange-400 inline" /> "Agregar a pantalla de inicio"</strong>.
                  </li>
                  <li>
                    Pulsa <strong className="text-white">"Agregar"</strong> en la esquina superior derecha. ¡Listo!
                  </li>
                </ol>
              </div>
            ) : (
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Para instalar, abre el menú de opciones de tu navegador (los tres puntos ⋮) y selecciona <strong>"Instalar aplicación"</strong> o "Añadir a pantalla de inicio".</span>
              </div>
            )}
          </div>

          {/* Section 3: Alarm Preset Highlight */}
          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Tono de Alarma Seleccionado</span>
              <p className="font-bold text-white truncate">{currentPreset.name} • <span className="text-zinc-400 font-normal">{currentPreset.brand}</span></p>
            </div>
            <button 
              onClick={handleTestSound}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                isPlayingTest 
                  ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                  : 'bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30'
              }`}
            >
              {isPlayingTest ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="text-[11px] font-bold">{isPlayingTest ? 'Detener' : 'Escuchar'}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex justify-end">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Entendido y Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
