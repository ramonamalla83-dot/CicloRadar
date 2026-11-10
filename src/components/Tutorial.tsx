import { useState, useEffect } from 'react';
import { 
  Bike, 
  CloudLightning, 
  Layers, 
  Flame, 
  ShieldAlert, 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Check, 
  Sparkles,
  Wind,
  AlertTriangle,
  Users,
  Flag
} from 'lucide-react';

export interface TutorialStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Bike;
  accentColor: string;
  badge: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-right' | 'bottom-center';
  targetSelector?: string;
  tip?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a CicloRadar!',
    subtitle: 'Seguridad y Asistencia Comunitaria',
    description: 'CicloRadar transforma tu teléfono en un radar activo para ciclistas urbanos y de ruta. Te mostraremos las herramientas esenciales en 6 sencillos pasos.',
    icon: Bike,
    accentColor: 'from-orange-500 to-amber-500',
    badge: 'INICIO',
    position: 'center',
    tip: 'Puedes pausar o saltar esta guía en cualquier momento.'
  },
  {
    id: 'weather',
    title: 'Clima, Vientos y Tormentas',
    subtitle: 'Alertas Meteorológicas en Ruta',
    description: 'En la esquina superior izquierda tienes el widget de clima en vivo. Te advertirá automáticamente si hay riesgo de tormentas eléctricas o ráfagas de viento peligrosas para la bicicleta.',
    icon: Wind,
    accentColor: 'from-sky-500 to-blue-600',
    badge: 'METEOROLOGÍA',
    position: 'top-left',
    tip: 'Toca el widget del clima para desplegar ráfagas máximas, dirección y consejos de pedaleo.'
  },
  {
    id: 'layers',
    title: 'Capas de Mapa Adaptables',
    subtitle: 'Día, Noche, Satélite y Terreno',
    description: 'Cambia la visualización del mapa con el selector de capas: Calles (Día por defecto), Oscuro (Noche para no deslumbrar), Satélite fotográfico y Relieve topográfico con curvas de nivel.',
    icon: Layers,
    accentColor: 'from-purple-500 to-indigo-600',
    badge: 'CARTOGRAFÍA',
    position: 'top-right',
    tip: 'Las teselas ráster funcionan sin necesidad de tarjetas de crédito ni claves de pago.'
  },
  {
    id: 'heatmap',
    title: 'Mapa de Calor de Ciclovías',
    subtitle: 'Corredores Comunitarios Seguros',
    description: 'Pulsa el botón de la llama para activar las trazas de calor comunitarias. Descubrirás por dónde pedalean más ciclistas y las rutas con mejor índice de seguridad vial.',
    icon: Flame,
    accentColor: 'from-orange-500 to-red-500',
    badge: 'COMUNIDAD',
    position: 'top-right',
    tip: 'El gradiente térmico verde, cian y amarillo te indica el flujo de paso en tiempo real.'
  },
  {
    id: 'sos',
    title: 'Sistema SOS de Emergencia',
    subtitle: 'Auto-Boost Acústico Forzado',
    description: 'Ante cualquier peligro o caída, pulsa el botón SOS flotante. Dispone de 5 segundos para cancelar falsas alarmas y activa una sirena a volumen máximo con vibración continua.',
    icon: ShieldAlert,
    accentColor: 'from-red-600 to-rose-700',
    badge: 'SEGURIDAD VITAL',
    position: 'bottom-right',
    tip: 'La alarma sonora se proyecta al máximo incluso si el volumen del móvil estaba en silencio o bajo.'
  },
  {
    id: 'hazards',
    title: 'Hitos y Peligros Comunitarios',
    subtitle: 'Alertas en Tiempo Real',
    description: 'Marca y consulta en el mapa baches, obras, rutas peligrosas, perros sueltos o puntos seguros con iconos personalizados. La comunidad puede confirmar su vigencia con un toque.',
    icon: AlertTriangle,
    accentColor: 'from-amber-500 to-yellow-600',
    badge: 'COLABORATIVO',
    position: 'bottom-right',
    tip: 'Toca el botón flotante "Reportar Peligro" para emitir una alerta instantánea en tu posición GPS o en el centro del mapa.'
  },
  {
    id: 'group_rides',
    title: 'Grupos de Ruta y Pelotón',
    subtitle: 'Amigos en Vivo sobre el Mapa',
    description: 'Crea salidas grupales temporales o únete mediante un código (ej. ROD-412). Verás la posición, velocidad en km/h y distancia de tus amigos en tiempo real mientras pedalean juntos.',
    icon: Users,
    accentColor: 'from-cyan-500 to-blue-600',
    badge: 'PELOTÓN',
    position: 'top-right',
    tip: 'Envía pings sonoros de reagrupamiento, avisa de pinchazos o ajusta el zoom para ver a todo el pelotón.'
  },
  {
    id: 'altimetry_eta',
    title: 'Estimación ETA y Altimetría',
    subtitle: 'Tiempo Real según tu Velocidad Histórica',
    description: 'Toca el botón de la bandera o cualquier punto del mapa para fijar tu destino. CicloRadar analizará el perfil de elevación (D+ y D-) y calculará la hora exacta de llegada basándose en tu velocidad histórica de Strava, Garmin o CicloRadar.',
    icon: Flag,
    accentColor: 'from-orange-500 to-amber-600',
    badge: 'ALTIMETRÍA & ETA',
    position: 'bottom-center',
    tip: 'El gráfico interactivo de altimetría te muestra las pendientes duras por colores e incluye selector de ritmos (Paseo, Intenso, e-Bike).'
  },
  {
    id: 'nav',
    title: 'Barra de Herramientas y Dashboard',
    subtitle: 'Acceso Rápido a Todas las Funciones',
    description: 'Usa la barra inferior para saltar entre el Radar en vivo, el Directorio de la Comunidad, Configuración SOS, Ajustes de tu Bici y el nuevo Dashboard de Kilometraje en "Inicio".',
    icon: Compass,
    accentColor: 'from-emerald-500 to-teal-600',
    badge: 'NAVEGACIÓN',
    position: 'bottom-center',
    tip: 'En el menú "Inicio" dispones de gráficos de Recharts con tus kilómetros acumulados y rutas guardadas.'
  }
];

export const TUTORIAL_STORAGE_KEY = 'cicloradar_tutorial_completed_v1';

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Tutorial({ isOpen, onClose }: TutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Navegación por teclado (Flechas y Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    } catch (_) {}
    onClose();
  };

  // Posicionamiento dinámico del tooltip superpuesto
  const getTooltipPositionClasses = () => {
    switch (currentStep.position) {
      case 'top-left':
        return 'top-24 left-4 sm:left-6 max-w-sm';
      case 'top-right':
        return 'top-24 right-4 sm:right-20 max-w-sm';
      case 'bottom-right':
        return 'bottom-28 right-4 sm:right-6 max-w-sm';
      case 'bottom-center':
        return 'bottom-20 left-1/2 -translate-x-1/2 max-w-md w-[calc(100%-2rem)]';
      case 'center':
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-[calc(100%-2rem)]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* 1. BACKDROP OSCURO CON TRANSLUCIDEZ */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-[2px] transition-opacity"
        onClick={handleFinish}
      />

      {/* 2. SPOTLIGHTS VISUALES SUGERIDOS SEGÚN EL PASO */}
      {currentStep.position === 'top-left' && (
        <div className="absolute top-20 left-4 w-48 h-14 rounded-2xl ring-4 ring-orange-500/80 shadow-[0_0_35px_rgba(249,115,22,0.8)] pointer-events-none animate-pulse" />
      )}
      {currentStep.id === 'layers' && (
        <div className="absolute top-20 right-4 w-12 h-12 rounded-full ring-4 ring-orange-500/80 shadow-[0_0_35px_rgba(249,115,22,0.8)] pointer-events-none animate-pulse" />
      )}
      {currentStep.id === 'heatmap' && (
        <div className="absolute top-34 right-4 w-12 h-12 rounded-full ring-4 ring-orange-500/80 shadow-[0_0_35px_rgba(249,115,22,0.8)] pointer-events-none animate-pulse" />
      )}
      {currentStep.position === 'bottom-right' && (
        <div className="absolute bottom-28 right-6 w-36 h-14 rounded-full ring-4 ring-red-500/90 shadow-[0_0_40px_rgba(239,68,68,0.9)] pointer-events-none animate-pulse" />
      )}
      {currentStep.position === 'bottom-center' && (
        <div className="absolute bottom-0 left-0 right-0 h-16 ring-4 ring-orange-500/80 shadow-[0_-5px_30px_rgba(249,115,22,0.6)] pointer-events-none" />
      )}

      {/* 3. TOOLTIP CARD FLOTANTE */}
      <div 
        className={`absolute ${getTooltipPositionClasses()} z-50 pointer-events-auto transition-all duration-300`}
        role="dialog"
        aria-modal="true"
        aria-label={currentStep.title}
      >
        <div className="bg-zinc-900/95 border-2 border-orange-500/70 rounded-3xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-md relative overflow-hidden">
          
          {/* Barra superior de acento con gradiente */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${currentStep.accentColor}`} />

          {/* Header del Tooltip */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${currentStep.accentColor} text-white flex items-center justify-center shadow-md shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase block">
                  {currentStep.badge} · PASO {currentStepIndex + 1} DE {TUTORIAL_STEPS.length}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            {/* Botón Cerrar / Saltar */}
            <button
              onClick={handleFinish}
              className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors shrink-0"
              title="Saltar tutorial"
              aria-label="Cerrar tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contenido descriptivo */}
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-3">
            {currentStep.description}
          </p>

          {/* Consejo pro / Tip adicional */}
          {currentStep.tip && (
            <div className="p-2.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl mb-4 flex items-start gap-2 text-[11px] text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
              <span>{currentStep.tip}</span>
            </div>
          )}

          {/* Barra de Progreso y Controles */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
            {/* Dots Indicadores */}
            <div className="flex items-center gap-1.5">
              {TUTORIAL_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'w-5 bg-orange-500'
                      : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                  aria-label={`Ir al paso ${idx + 1}`}
                />
              ))}
            </div>

            {/* Botones de Navegación */}
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  className="h-9 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                  isLastStep
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 active:scale-95'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 active:scale-95'
                }`}
              >
                <span>{isLastStep ? '¡Comenzar a Rodar!' : 'Siguiente'}</span>
                {isLastStep ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
