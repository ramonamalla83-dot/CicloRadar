import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  PlusSquare, 
  X, 
  QrCode, 
  AlertTriangle, 
  Sparkles, 
  Monitor, 
  CheckCircle2,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: {
    isStandalone: boolean;
    installPromptEvent: any;
    isIOS: boolean;
    isAndroid?: boolean;
    isInIframe?: boolean;
    appUrl?: string;
    triggerInstallPrompt: () => Promise<boolean>;
  };
}

export default function InstallModal({
  isOpen,
  onClose,
  permissions
}: InstallModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'auto' | 'android' | 'ios' | 'desktop'>('auto');

  const {
    isStandalone,
    installPromptEvent,
    isIOS,
    isAndroid,
    isInIframe,
    appUrl,
    triggerInstallPrompt
  } = permissions;

  const directUrl = appUrl || (typeof window !== 'undefined' ? window.location.href : '');

  // Generar código QR dinámico de alta fidelidad
  useEffect(() => {
    if (directUrl) {
      QRCode.toDataURL(directUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR:', err));
    }
  }, [directUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(directUrl);
      } else {
        const input = document.createElement('input');
        input.value = directUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenDirect = () => {
    if (typeof window !== 'undefined') {
      window.open(directUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Encabezado */}
        <div className="p-5 pb-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30">
              <Download className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white leading-tight">Instalar CicloRadar</h3>
              <p className="text-xs text-zinc-400">En tu teléfono móvil o computadora</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 overflow-y-auto space-y-4 text-zinc-300">

          {/* DIAGNÓSTICO: ¿Por qué no aparecía la opción antes? */}
          {isInIframe && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300">¿Por qué no salía el botón de instalar directo?</p>
                  <p className="text-zinc-300 text-[11px] mt-0.5 leading-relaxed">
                    Estás viendo la app dentro del visor web integrado (iframe). Por seguridad, <strong>los navegadores desactivan el diálogo de instalación automática dentro de marcos embebidos</strong>.
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleOpenDirect}
                  className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Abrir en Pestaña Directa
                </button>
                <button
                  onClick={handleCopyLink}
                  className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ESTADO 1: Ya está instalada (Standalone) */}
          {isStandalone && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-green-500 text-zinc-950 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white text-sm">¡CicloRadar ya está instalada!</p>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Estás navegando en modo app nativa a pantalla completa, con acceso a aceleración por hardware y alarmas de emergencia.
                </p>
              </div>
            </div>
          )}

          {/* ESTADO 2: Navegador con soporte 1 Clic (evento capturado) */}
          {installPromptEvent && !isStandalone && (
            <div className="p-4 bg-gradient-to-r from-orange-500/20 to-amber-500/15 border-2 border-orange-500/60 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Instalación Nativa Detectada
              </div>
              <p className="text-xs text-white leading-relaxed">
                Tu navegador está listo para instalar CicloRadar directamente en tu pantalla de inicio o escritorio con 1 solo toque.
              </p>
              <button
                onClick={triggerInstallPrompt}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-zinc-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-500/25 transition-all transform active:scale-98"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                Instalar CicloRadar Ahora (1 Clic)
              </button>
            </div>
          )}

          {/* SECCIÓN MÓVIL: ESCANEAR CÓDIGO QR PARA INSTALAR EN EL CELULAR */}
          <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            {qrDataUrl ? (
              <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                <img src={qrDataUrl} alt="QR para instalar en móvil" className="w-28 h-28 object-contain" />
              </div>
            ) : (
              <div className="w-28 h-28 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                <QrCode className="w-10 h-10 text-zinc-500 animate-pulse" />
              </div>
            )}
            <div className="text-xs text-center sm:text-left space-y-2">
              <div>
                <p className="font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <Smartphone className="w-4 h-4 text-orange-400" />
                  Instálala en tu teléfono celular
                </p>
                <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                  Apunta la cámara de tu móvil a este código QR para abrir CicloRadar directamente en tu smartphone e instalarla en tu manillar.
                </p>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar Link'}</span>
                </button>
                <button
                  onClick={handleOpenDirect}
                  className="px-3 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border border-orange-500/30 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir directo</span>
                </button>
              </div>
            </div>
          </div>

          {/* GUÍA PASO A PASO POR PLATAFORMA */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Instrucciones según tu dispositivo
              </h4>
            </div>

            {/* Pestañas de plataforma */}
            <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 mb-3 text-xs">
              <button
                onClick={() => setActiveTab('auto')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                  activeTab === 'auto' ? 'bg-orange-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Recomendado
              </button>
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                  activeTab === 'android' ? 'bg-orange-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Android
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                  activeTab === 'ios' ? 'bg-orange-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                iPhone / iPad
              </button>
              <button
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                  activeTab === 'desktop' ? 'bg-orange-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                PC / Mac
              </button>
            </div>

            {/* Contenido según pestaña */}
            {/* 1. Android */}
            {(activeTab === 'android' || (activeTab === 'auto' && !isIOS)) && (
              <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Smartphone className="w-4 h-4 text-orange-400" /> En Android (Google Chrome / Edge / Samsung Internet):
                </p>
                <ol className="list-decimal pl-4 space-y-2 text-zinc-300 text-[11px] leading-relaxed">
                  <li>
                    Abre CicloRadar en tu navegador <strong className="text-white">Google Chrome</strong> (fuera de redes sociales).
                  </li>
                  <li>
                    Toca el menú de <strong className="text-white">tres puntos verticales (⋮)</strong> en la esquina superior derecha del navegador.
                  </li>
                  <li>
                    Selecciona <strong className="text-orange-400">"Instalar aplicación"</strong> o <strong className="text-orange-400">"Añadir a la pantalla de inicio"</strong>.
                  </li>
                  <li>
                    Presiona <strong className="text-white">"Instalar"</strong>. El icono naranja de CicloRadar aparecerá de inmediato junto a tus apps nativas.
                  </li>
                </ol>
              </div>
            )}

            {/* 2. iOS Safari */}
            {(activeTab === 'ios' || (activeTab === 'auto' && isIOS)) && (
              <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Share2 className="w-4 h-4 text-sky-400" /> En iPhone / iPad (Navegador Safari):
                </p>
                <p className="text-[11px] text-zinc-400">
                  Apple no muestra botones automáticos de instalación. Sigue estos 3 sencillos pasos:
                </p>
                <ol className="list-decimal pl-4 space-y-2 text-zinc-300 text-[11px] leading-relaxed">
                  <li>
                    Abre el enlace en <strong className="text-white">Safari</strong> y pulsa el botón <strong className="text-white inline-flex items-center gap-0.5"><Share2 className="w-3.5 h-3.5 text-sky-400 inline" /> Compartir</strong> (en la barra inferior del iPhone).
                  </li>
                  <li>
                    Baja en el menú y selecciona <strong className="text-orange-400 inline-flex items-center gap-0.5"><PlusSquare className="w-3.5 h-3.5 text-orange-400 inline" /> "Añadir a pantalla de inicio"</strong>.
                  </li>
                  <li>
                    Pulsa <strong className="text-white">"Añadir"</strong> en la esquina superior derecha. ¡Listo para salir a rodar!
                  </li>
                </ol>
              </div>
            )}

            {/* 3. Computadora (Chrome / Edge) */}
            {activeTab === 'desktop' && (
              <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Monitor className="w-4 h-4 text-orange-400" /> En PC o Mac (Google Chrome / Microsoft Edge):
                </p>
                <ol className="list-decimal pl-4 space-y-2 text-zinc-300 text-[11px] leading-relaxed">
                  <li>
                    Abre la aplicación en una pestaña directa de Chrome o Edge.
                  </li>
                  <li>
                    Fíjate en la barra de direcciones superior (donde escribes la URL); verás un pequeño icono de <strong className="text-white">pantalla con flecha hacia abajo</strong> (<Download className="w-3 h-3 text-orange-400 inline" />).
                  </li>
                  <li>
                    Haz clic en ese icono y pulsa <strong className="text-orange-400">"Instalar"</strong>. Se abrirá como aplicación independiente en tu barra de tareas o dock.
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* VENTAJAS DE INSTALAR */}
          <div className="p-3.5 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl space-y-1.5 text-xs">
            <p className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Beneficios en Ruta:
            </p>
            <ul className="text-[11px] text-zinc-400 space-y-1 list-disc pl-4">
              <li><strong>Modo Manillar Completo:</strong> Sin barras de navegación que tapen el mapa ni alertas de recarga.</li>
              <li><strong>Prioridad de Audio:</strong> Desbloquea la alarma SOS para sonar con auto-boost a volumen máximo.</li>
              <li><strong>Sin pérdida de sesión:</strong> Tus contactos de emergencia y preferencias se conservan siempre.</li>
            </ul>
          </div>

        </div>

        {/* Pie del modal */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between gap-3">
          <button 
            onClick={handleOpenDirect}
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-orange-500/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir en ventana completa</span>
          </button>

          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
