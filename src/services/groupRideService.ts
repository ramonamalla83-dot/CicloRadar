/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { audioEngine } from '../utils/audio';

export type GroupDiscipline = 'ruta' | 'mtb' | 'urbana' | 'gravel' | 'recreativa';
export type MemberStatus = 'riding' | 'stopped' | 'delayed' | 'sos';
export type PingType = 'regroup' | 'puncture' | 'sprint' | 'caution' | 'coffee';

export interface GroupPing {
  id: string;
  senderId: string;
  senderName: string;
  type: PingType;
  message: string;
  timestamp: number;
}

export interface RideGroupMember {
  id: string;
  name: string;
  initials: string;
  avatarColor: string; // Tailwind color class or hex
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading?: number;
  status: MemberStatus;
  batteryPercent?: number;
  isLeader: boolean;
  isCurrentUser: boolean;
  lastUpdate: number;
}

export interface RideGroup {
  id: string;
  code: string;
  name: string;
  discipline: GroupDiscipline;
  createdAt: number;
  expiresAt: number;
  leaderId: string;
  leaderName: string;
  members: RideGroupMember[];
  pings: GroupPing[];
  status: 'active' | 'completed';
}

export interface PublicGroupSummary {
  code: string;
  name: string;
  discipline: GroupDiscipline;
  membersCount: number;
  leaderName: string;
  pace: string;
  distanceKm: string;
}

const STORAGE_ACTIVE_GROUP = 'cicloradar_active_group_v1';
const BROADCAST_CHANNEL_NAME = 'cicloradar_group_rides_v1';

const AVATAR_COLORS = [
  'bg-emerald-600 border-emerald-400',
  'bg-sky-600 border-sky-400',
  'bg-amber-600 border-amber-400',
  'bg-purple-600 border-purple-400',
  'bg-rose-600 border-rose-400',
  'bg-indigo-600 border-indigo-400',
  'bg-teal-600 border-teal-400'
];

class GroupRideService {
  private activeGroup: RideGroup | null = null;
  private listeners: Set<(group: RideGroup | null) => void> = new Set();
  private channel: BroadcastChannel | null = null;
  private simulationInterval: NodeJS.Timeout | null = null;
  private currentUserId: string = '';

  constructor() {
    this.currentUserId = this.getOrCreateUserId();
    this.loadFromStorage();
    this.setupBroadcastChannel();

    if (this.activeGroup) {
      this.startSquadSimulation();
    }
  }

  private getOrCreateUserId(): string {
    if (typeof window === 'undefined') return 'user-default';
    let id = localStorage.getItem('cicloradar_user_id');
    if (!id) {
      id = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      localStorage.setItem('cicloradar_user_id', id);
    }
    return id;
  }

  private setupBroadcastChannel() {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
    try {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'GROUP_UPDATED') {
          this.activeGroup = payload;
          this.notify();
        } else if (type === 'GROUP_PING') {
          if (this.activeGroup && this.activeGroup.id === payload.groupId) {
            this.activeGroup.pings.unshift(payload.ping);
            audioEngine.playGroupNotification(payload.ping.type === 'regroup' ? 'regroup' : 'ping');
            this.notify();
          }
        } else if (type === 'GROUP_LEFT') {
          if (this.activeGroup && this.activeGroup.id === payload.groupId && payload.userId === this.currentUserId) {
            this.activeGroup = null;
            this.saveToStorage();
            this.notify();
          }
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_ACTIVE_GROUP);
      if (data) {
        const parsed = JSON.parse(data) as RideGroup;
        // Verificar si la salida ha expirado (más de 8 horas)
        if (Date.now() > parsed.expiresAt) {
          localStorage.removeItem(STORAGE_ACTIVE_GROUP);
          this.activeGroup = null;
        } else {
          this.activeGroup = parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading active group', e);
      this.activeGroup = null;
    }
  }

  private saveToStorage() {
    try {
      if (this.activeGroup) {
        localStorage.setItem(STORAGE_ACTIVE_GROUP, JSON.stringify(this.activeGroup));
      } else {
        localStorage.removeItem(STORAGE_ACTIVE_GROUP);
      }
    } catch (e) {
      console.warn('Error saving active group', e);
    }
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.activeGroup ? { ...this.activeGroup } : null));
  }

  private broadcast(type: string, payload: any) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type, payload });
      } catch (e) {
        console.warn('Error broadcasting message', e);
      }
    }
  }

  public subscribe(listener: (group: RideGroup | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.activeGroup ? { ...this.activeGroup } : null);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getActiveGroup(): RideGroup | null {
    return this.activeGroup ? { ...this.activeGroup } : null;
  }

  /**
   * Crea un nuevo Grupo de Ruta temporal
   */
  public createGroup(params: {
    name: string;
    discipline: GroupDiscipline;
    userName: string;
    userCoords: { lat: number; lng: number };
    durationHours?: number;
  }): RideGroup {
    const code = this.generateGroupCode();
    const duration = (params.durationHours || 4) * 3600 * 1000;
    const now = Date.now();

    const userInitials = params.userName
      ? params.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'YO';

    const currentMember: RideGroupMember = {
      id: this.currentUserId,
      name: params.userName || 'Tú (Líder)',
      initials: userInitials,
      avatarColor: 'bg-orange-600 border-orange-400',
      latitude: params.userCoords.lat,
      longitude: params.userCoords.lng,
      speedKmh: 0,
      heading: 45,
      status: 'riding',
      batteryPercent: 88,
      isLeader: true,
      isCurrentUser: true,
      lastUpdate: now
    };

    // Amigos compañeros de ruta iniciales generados en cercanías para enriquecer la experiencia de salida
    const companionA: RideGroupMember = {
      id: `comp-1-${Date.now()}`,
      name: 'Sofía R.',
      initials: 'SR',
      avatarColor: 'bg-emerald-600 border-emerald-400',
      latitude: params.userCoords.lat + 0.0018,
      longitude: params.userCoords.lng + 0.0014,
      speedKmh: 24,
      heading: 50,
      status: 'riding',
      batteryPercent: 94,
      isLeader: false,
      isCurrentUser: false,
      lastUpdate: now
    };

    const companionB: RideGroupMember = {
      id: `comp-2-${Date.now()}`,
      name: 'Martín B.',
      initials: 'MB',
      avatarColor: 'bg-sky-600 border-sky-400',
      latitude: params.userCoords.lat - 0.0015,
      longitude: params.userCoords.lng - 0.0022,
      speedKmh: 22,
      heading: 45,
      status: 'riding',
      batteryPercent: 76,
      isLeader: false,
      isCurrentUser: false,
      lastUpdate: now
    };

    const companionC: RideGroupMember = {
      id: `comp-3-${Date.now()}`,
      name: 'Lucas P.',
      initials: 'LP',
      avatarColor: 'bg-purple-600 border-purple-400',
      latitude: params.userCoords.lat - 0.0032,
      longitude: params.userCoords.lng - 0.0028,
      speedKmh: 20,
      heading: 42,
      status: 'delayed', // Rezagado a 400m
      batteryPercent: 65,
      isLeader: false,
      isCurrentUser: false,
      lastUpdate: now
    };

    const newGroup: RideGroup = {
      id: `grp-${Date.now()}`,
      code,
      name: params.name.trim() || 'Salida Grupal CicloRadar',
      discipline: params.discipline || 'ruta',
      createdAt: now,
      expiresAt: now + duration,
      leaderId: this.currentUserId,
      leaderName: params.userName || 'Tú',
      members: [currentMember, companionA, companionB, companionC],
      pings: [
        {
          id: `png-init-${Date.now()}`,
          senderId: this.currentUserId,
          senderName: params.userName || 'Tú',
          type: 'regroup',
          message: '¡Salida iniciada! Pelotón conectado en tiempo real.',
          timestamp: now
        }
      ],
      status: 'active'
    };

    this.activeGroup = newGroup;
    this.saveToStorage();
    this.broadcast('GROUP_UPDATED', newGroup);
    this.startSquadSimulation();
    audioEngine.playGroupNotification('join');
    this.notify();

    return newGroup;
  }

  /**
   * Unirse a un grupo existente mediante código (ej: ROD-782)
   */
  public joinGroup(
    code: string, 
    userName: string, 
    userCoords: { lat: number; lng: number }
  ): RideGroup | null {
    const cleanCode = code.trim().toUpperCase();
    const now = Date.now();

    const userInitials = userName
      ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'YO';

    // Si ya existe un grupo con ese código o es un código público simulado
    const disciplineList: GroupDiscipline[] = ['ruta', 'mtb', 'gravel', 'urbana'];
    const chosenDiscipline = disciplineList[Math.floor(Math.random() * disciplineList.length)];

    const currentMember: RideGroupMember = {
      id: this.currentUserId,
      name: userName || 'Tú',
      initials: userInitials,
      avatarColor: 'bg-orange-600 border-orange-400',
      latitude: userCoords.lat,
      longitude: userCoords.lng,
      speedKmh: 23,
      heading: 60,
      status: 'riding',
      batteryPercent: 91,
      isLeader: false,
      isCurrentUser: true,
      lastUpdate: now
    };

    const companion1: RideGroupMember = {
      id: `comp-join-1-${Date.now()}`,
      name: 'Esteban C.',
      initials: 'EC',
      avatarColor: 'bg-indigo-600 border-indigo-400',
      latitude: userCoords.lat + 0.0022,
      longitude: userCoords.lng + 0.0019,
      speedKmh: 27,
      heading: 65,
      status: 'riding',
      batteryPercent: 82,
      isLeader: true,
      isCurrentUser: false,
      lastUpdate: now
    };

    const companion2: RideGroupMember = {
      id: `comp-join-2-${Date.now()}`,
      name: 'Valeria M.',
      initials: 'VM',
      avatarColor: 'bg-rose-600 border-rose-400',
      latitude: userCoords.lat + 0.0008,
      longitude: userCoords.lng + 0.0006,
      speedKmh: 25,
      heading: 62,
      status: 'riding',
      batteryPercent: 78,
      isLeader: false,
      isCurrentUser: false,
      lastUpdate: now
    };

    const joinedGroup: RideGroup = {
      id: `grp-${cleanCode.toLowerCase()}`,
      code: cleanCode,
      name: `Pelotón ${cleanCode}`,
      discipline: chosenDiscipline,
      createdAt: now - 35 * 60 * 1000,
      expiresAt: now + 4 * 3600 * 1000,
      leaderId: companion1.id,
      leaderName: companion1.name,
      members: [companion1, companion2, currentMember],
      pings: [
        {
          id: `png-j-${now}`,
          senderId: this.currentUserId,
          senderName: userName || 'Tú',
          type: 'regroup',
          message: `${userName || 'Nuevo ciclista'} se unió al grupo de ruta.`,
          timestamp: now
        }
      ],
      status: 'active'
    };

    this.activeGroup = joinedGroup;
    this.saveToStorage();
    this.broadcast('GROUP_UPDATED', joinedGroup);
    this.startSquadSimulation();
    audioEngine.playGroupNotification('join');
    this.notify();

    return joinedGroup;
  }

  /**
   * Salir del grupo actual
   */
  public leaveGroup(): void {
    if (!this.activeGroup) return;
    const groupId = this.activeGroup.id;

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    this.broadcast('GROUP_LEFT', { groupId, userId: this.currentUserId });
    this.activeGroup = null;
    this.saveToStorage();
    this.notify();
  }

  /**
   * Actualiza la posición GPS en vivo del usuario actual en el grupo
   */
  public updateUserLocation(lat: number, lng: number, speedKmh: number = 0): void {
    if (!this.activeGroup) return;

    const memberIndex = this.activeGroup.members.findIndex(m => m.id === this.currentUserId);
    if (memberIndex !== -1) {
      this.activeGroup.members[memberIndex].latitude = lat;
      this.activeGroup.members[memberIndex].longitude = lng;
      this.activeGroup.members[memberIndex].speedKmh = Math.round(speedKmh);
      this.activeGroup.members[memberIndex].lastUpdate = Date.now();
      this.saveToStorage();
      this.notify();
    }
  }

  /**
   * Envía un ping de pelotón (Reagrupar, Alerta de bache, Pinchazo, etc.)
   */
  public sendPing(type: PingType, customMessage?: string): GroupPing | null {
    if (!this.activeGroup) return null;

    const senderMember = this.activeGroup.members.find(m => m.id === this.currentUserId);
    const senderName = senderMember ? senderMember.name : 'Tú';

    const defaultMessages: Record<PingType, string> = {
      regroup: '¡Reagrupamiento! Bajamos el ritmo en el próximo semáforo/esquina.',
      puncture: '¡Pinchazo! Me detengo al costado para cambiar cámara.',
      sprint: '¡Sprint en esta recta! Máxima potencia hasta la cima.',
      caution: '¡Atención pelotón! Bache o vehículo en carril derecho.',
      coffee: '¡Parada técnica de hidratación / café!'
    };

    const ping: GroupPing = {
      id: `png-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: this.currentUserId,
      senderName,
      type,
      message: customMessage || defaultMessages[type],
      timestamp: Date.now()
    };

    this.activeGroup.pings.unshift(ping);
    if (this.activeGroup.pings.length > 20) {
      this.activeGroup.pings.pop();
    }

    // Efecto de audio local
    audioEngine.playGroupNotification(type === 'regroup' ? 'regroup' : 'ping');

    this.saveToStorage();
    this.broadcast('GROUP_PING', { groupId: this.activeGroup.id, ping });
    this.notify();

    // Reacción simulada de los compañeros si es reagrupamiento o pinchazo
    if (type === 'regroup' || type === 'puncture') {
      setTimeout(() => {
        if (!this.activeGroup) return;
        const companions = this.activeGroup.members.filter(m => !m.isCurrentUser);
        if (companions.length > 0) {
          const comp = companions[0];
          const responsePing: GroupPing = {
            id: `png-resp-${Date.now()}`,
            senderId: comp.id,
            senderName: comp.name,
            type: 'regroup',
            message: type === 'puncture' ? 'Enterado, aflojamos el paso y te esperamos.' : 'Copiado, frenando el pelotón.',
            timestamp: Date.now()
          };
          this.activeGroup.pings.unshift(responsePing);
          audioEngine.playGroupNotification('ping');
          this.notify();
        }
      }, 3500);
    }

    return ping;
  }

  /**
   * Simulación viva de movimiento del pelotón en tiempo real
   */
  private startSquadSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    this.simulationInterval = setInterval(() => {
      if (!this.activeGroup || this.activeGroup.members.length <= 1) return;

      const now = Date.now();
      // Mover suavemente a los compañeros a lo largo de un rumbo realista
      this.activeGroup.members = this.activeGroup.members.map((member) => {
        if (member.isCurrentUser) return member;

        // Si está en 'stopped' o 'sos', no avanza
        if (member.status === 'stopped') return member;

        const deltaAngle = (Math.random() - 0.5) * 0.15;
        const headingRad = ((member.heading || 45) + deltaAngle) * (Math.PI / 180);

        // Velocidad realista entre 21 y 32 km/h convertida a desplazamiento por tick
        const speedKmh = Math.max(18, Math.min(35, member.speedKmh + (Math.random() - 0.5) * 2));
        const distancePerTick = (speedKmh / 3600) * 2.5 * 0.009; // escala en grados

        const newLat = member.latitude + distancePerTick * Math.cos(headingRad);
        const newLng = member.longitude + distancePerTick * Math.sin(headingRad);

        return {
          ...member,
          latitude: newLat,
          longitude: newLng,
          speedKmh: Math.round(speedKmh),
          lastUpdate: now
        };
      });

      this.saveToStorage();
      this.notify();
    }, 2800);
  }

  /**
   * Genera un código de grupo amigable (ej: ROD-482)
   */
  private generateGroupCode(): string {
    const prefixes = ['ROD', 'PEL', 'RUTA', 'MTB', 'SQUAD', 'CICLO'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${p}-${num}`;
  }

  /**
   * Lista de salidas públicas comunitarias activas
   */
  public getPublicGroups(): PublicGroupSummary[] {
    return [
      {
        code: 'ROD-412',
        name: 'Pelotón Madrugador Fondo 60K',
        discipline: 'ruta',
        membersCount: 6,
        leaderName: 'Ignacio V.',
        pace: '28-32 km/h',
        distanceKm: '60 km'
      },
      {
        code: 'MTB-890',
        name: 'Sendas y Quebradas MTB',
        discipline: 'mtb',
        membersCount: 4,
        leaderName: 'Florencia T.',
        pace: '16-20 km/h',
        distanceKm: '32 km'
      },
      {
        code: 'GRAV-215',
        name: 'Gravel & Ripio al Dique',
        discipline: 'gravel',
        membersCount: 5,
        leaderName: 'Mateo D.',
        pace: '22-25 km/h',
        distanceKm: '45 km'
      },
      {
        code: 'URB-108',
        name: 'Pedaleo Nocturno y Café Urbano',
        discipline: 'urbana',
        membersCount: 8,
        leaderName: 'Camila S.',
        pace: '18-22 km/h',
        distanceKm: '20 km'
      }
    ];
  }
}

export const groupRideService = new GroupRideService();
