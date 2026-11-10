/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HazardType = 
  | 'obras' 
  | 'baches' 
  | 'ruta_peligrosa' 
  | 'perros' 
  | 'vidrios' 
  | 'ciclovia_bloqueada' 
  | 'punto_seguro';

export type HazardSeverity = 'baja' | 'media' | 'alta' | 'critica';

export interface SafetyHazard {
  id: string;
  type: HazardType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  reportedBy: string;
  reportedAt: number; // Timestamp
  severity: HazardSeverity;
  confirmations: number;
  userVoted?: boolean;
  isUserCreated?: boolean;
}

export interface HazardConfig {
  type: HazardType;
  label: string;
  iconName: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  markerBg: string;
  descriptionPlaceholder: string;
}

export const HAZARD_TYPES_CONFIG: Record<HazardType, HazardConfig> = {
  obras: {
    type: 'obras',
    label: 'Obras en Vía',
    iconName: 'Construction',
    badgeBg: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    markerBg: 'bg-amber-500',
    descriptionPlaceholder: 'ej. Zanja abierta, reducción de carril o maquinaria pesada'
  },
  baches: {
    type: 'baches',
    label: 'Baches / Asfalto Roto',
    iconName: 'CircleAlert',
    badgeBg: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
    markerBg: 'bg-yellow-500',
    descriptionPlaceholder: 'ej. Pozo profundo en la orilla derecha, peligro de caída'
  },
  ruta_peligrosa: {
    type: 'ruta_peligrosa',
    label: 'Ruta Peligrosa / Inseguridad',
    iconName: 'ShieldAlert',
    badgeBg: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/40',
    markerBg: 'bg-red-600',
    descriptionPlaceholder: 'ej. Zona solitaria, robos recientes o cruce de alta velocidad'
  },
  perros: {
    type: 'perros',
    label: 'Animales / Perros Sueltos',
    iconName: 'Dog',
    badgeBg: 'bg-orange-500/20',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/40',
    markerBg: 'bg-orange-500',
    descriptionPlaceholder: 'ej. Jauría agresiva que persigue bicicletas'
  },
  vidrios: {
    type: 'vidrios',
    label: 'Vidrios / Pinchazos',
    iconName: 'Sparkles',
    badgeBg: 'bg-pink-500/20',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500/40',
    markerBg: 'bg-pink-600',
    descriptionPlaceholder: 'ej. Botellas rotas sobre la ciclovía o banquina'
  },
  ciclovia_bloqueada: {
    type: 'ciclovia_bloqueada',
    label: 'Ciclovía Obstruida',
    iconName: 'Ban',
    badgeBg: 'bg-purple-500/20',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    markerBg: 'bg-purple-600',
    descriptionPlaceholder: 'ej. Autos estacionados o ramas caídas bloqueando el paso'
  },
  punto_seguro: {
    type: 'punto_seguro',
    label: 'Punto Seguro / Taller / Agua',
    iconName: 'ShieldCheck',
    badgeBg: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    markerBg: 'bg-emerald-600',
    descriptionPlaceholder: 'ej. Taller ciclista solidario, inflador público o punto de hidratación'
  }
};

const STORAGE_KEY = 'cicloradar_community_hazards_v1';

class HazardsService {
  private hazards: SafetyHazard[] = [];
  private listeners: Set<(hazards: SafetyHazard[]) => void> = new Set();
  private simulationInterval: NodeJS.Timeout | null = null;
  private lastCenterLng = -66.3369;
  private lastCenterLat = -33.2994;

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.loadFromStorage();
          this.notify();
        }
      });
      // Iniciar simulación de actividad comunitaria en tiempo real
      this.startRealtimeSimulation();
    }
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.hazards = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error reading hazards from localStorage', e);
      this.hazards = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.hazards));
    } catch (e) {
      console.warn('Error saving hazards to localStorage', e);
    }
  }

  private notify() {
    this.listeners.forEach(fn => fn([...this.hazards]));
  }

  public subscribe(listener: (hazards: SafetyHazard[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.hazards]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getHazards(): SafetyHazard[] {
    return [...this.hazards];
  }

  /**
   * Inicializa o actualiza hitos comunitarios realistas alrededor del usuario
   */
  public ensureInitialHazards(centerLng: number, centerLat: number) {
    this.lastCenterLng = centerLng;
    this.lastCenterLat = centerLat;

    if (this.hazards.length === 0) {
      const initial: SafetyHazard[] = [
        {
          id: 'hz-init-1',
          type: 'obras',
          title: 'Reparación de alcantarillado',
          description: 'Zanja sin tapar en carril derecho. Obliga a desviarse al carril rápido.',
          latitude: centerLat + 0.0035,
          longitude: centerLng - 0.0042,
          reportedBy: 'Martín R.',
          reportedAt: Date.now() - 18 * 60 * 1000,
          severity: 'alta',
          confirmations: 4
        },
        {
          id: 'hz-init-2',
          type: 'baches',
          title: 'Bache profundo en curva',
          description: 'Cráter de 15 cm de profundidad poco visible de noche. Riesgo de pinchazo o caída.',
          latitude: centerLat - 0.0028,
          longitude: centerLng + 0.0051,
          reportedBy: 'Carla G.',
          reportedAt: Date.now() - 42 * 60 * 1000,
          severity: 'critica',
          confirmations: 7
        },
        {
          id: 'hz-init-3',
          type: 'ruta_peligrosa',
          title: 'Tramo sin luminaria ni banquina',
          description: 'Tránsito de camiones a alta velocidad. Recomendado circular en grupo o con balizas de alta potencia.',
          latitude: centerLat + 0.0062,
          longitude: centerLng + 0.0038,
          reportedBy: 'Rodolfo V.',
          reportedAt: Date.now() - 85 * 60 * 1000,
          severity: 'alta',
          confirmations: 12
        },
        {
          id: 'hz-init-4',
          type: 'perros',
          title: 'Perros sueltos agresivos',
          description: 'Dos perros salen de un taller mecánico a perseguir ciclistas en subida.',
          latitude: centerLat - 0.0045,
          longitude: centerLng - 0.0035,
          reportedBy: 'Laura S.',
          reportedAt: Date.now() - 110 * 60 * 1000,
          severity: 'media',
          confirmations: 3
        },
        {
          id: 'hz-init-5',
          type: 'punto_seguro',
          title: 'Punto Seguro: Bicicletería y Taller Express',
          description: 'Inflador gratis, parches y asistencia de emergencia comunitaria disponible.',
          latitude: centerLat + 0.0018,
          longitude: centerLng + 0.0022,
          reportedBy: 'Comunidad CicloRadar',
          reportedAt: Date.now() - 360 * 60 * 1000,
          severity: 'baja',
          confirmations: 19
        }
      ];

      this.hazards = initial;
      this.saveToStorage();
      this.notify();
    }
  }

  /**
   * Publica un nuevo hito o peligro en la comunidad en tiempo real
   */
  public reportHazard(data: {
    type: HazardType;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    reportedBy?: string;
    severity?: HazardSeverity;
  }): SafetyHazard {
    const newHazard: SafetyHazard = {
      id: `hz-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: data.type,
      title: data.title.trim() || HAZARD_TYPES_CONFIG[data.type].label,
      description: data.description.trim() || 'Reporte de la comunidad ciclista',
      latitude: data.latitude,
      longitude: data.longitude,
      reportedBy: data.reportedBy || 'Ciclista Anónimo',
      reportedAt: Date.now(),
      severity: data.severity || 'media',
      confirmations: 1,
      userVoted: true,
      isUserCreated: true
    };

    this.hazards.unshift(newHazard);
    this.saveToStorage();
    this.notify();

    // Disparar evento para notificación visual en componentes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cicloradar:hazard-added', { detail: newHazard }));
    }

    return newHazard;
  }

  /**
   * Confirmar vigencia de un peligro (voto de la comunidad)
   */
  public confirmHazard(id: string): boolean {
    const index = this.hazards.findIndex(h => h.id === id);
    if (index === -1) return false;

    const hazard = this.hazards[index];
    if (hazard.userVoted) return false;

    hazard.confirmations += 1;
    hazard.userVoted = true;
    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Reportar que el peligro ya ha sido solucionado/retirado
   */
  public resolveHazard(id: string): boolean {
    const index = this.hazards.findIndex(h => h.id === id);
    if (index === -1) return false;

    // Reducir o eliminar si la comunidad lo desmarca
    this.hazards.splice(index, 1);
    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Eliminar reporte propio
   */
  public deleteHazard(id: string): boolean {
    const index = this.hazards.findIndex(h => h.id === id);
    if (index === -1) return false;

    this.hazards.splice(index, 1);
    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Simulación comunitaria en tiempo real: de vez en cuando otro ciclista cercano reporta algo nuevo
   */
  private startRealtimeSimulation() {
    if (this.simulationInterval) return;

    this.simulationInterval = setInterval(() => {
      // 15% de probabilidad cada 35 segundos de que la comunidad agregue o confirme un reporte
      if (Math.random() < 0.25 && this.hazards.length < 14) {
        const types: HazardType[] = ['obras', 'baches', 'ruta_peligrosa', 'perros', 'vidrios', 'ciclovia_bloqueada'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const cyclists = ['Lucas B.', 'Sofía P.', 'Fernando M.', 'Esteban T.', 'Valeria K.', 'Gonzalo R.'];
        const randomCyclist = cyclists[Math.floor(Math.random() * cyclists.length)];

        // Generar coordenadas cercanas
        const deltaLat = (Math.random() - 0.5) * 0.015;
        const deltaLng = (Math.random() - 0.5) * 0.015;

        const titles: Record<HazardType, string[]> = {
          obras: ['Corte parcial por asfaltado', 'Escombros en bicisenda', 'Señalización caída en curva'],
          baches: ['Hundimiento de calzada', 'Bache tapado con agua', 'Rejilla pluvial rota'],
          ruta_peligrosa: ['Semáforo intermitente apagado', 'Mancha de aceite en rotonda', 'Sin banquina transitada'],
          perros: ['Perro suelto territorial', 'Animales cruzando en recta'],
          vidrios: ['Botella estallada en carril bici', 'Restos de parabrisas'],
          ciclovia_bloqueada: ['Camioneta descargando mercadería', 'Contenedor en ciclovía'],
          punto_seguro: ['Taller de bicis abierto con inflador']
        };

        const randomTitles = titles[randomType];
        const title = randomTitles[Math.floor(Math.random() * randomTitles.length)];

        const simHazard: SafetyHazard = {
          id: `hz-sim-${Date.now()}`,
          type: randomType,
          title,
          description: `Aviso en vivo reportado hace unos instantes por la red ciclista.`,
          latitude: this.lastCenterLat + deltaLat,
          longitude: this.lastCenterLng + deltaLng,
          reportedBy: randomCyclist,
          reportedAt: Date.now(),
          severity: Math.random() > 0.5 ? 'alta' : 'media',
          confirmations: 2,
          userVoted: false
        };

        this.hazards.unshift(simHazard);
        this.saveToStorage();
        this.notify();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cicloradar:community-hazard-alert', { detail: simHazard }));
        }
      }
    }, 35000);
  }
}

export const hazardsService = new HazardsService();
