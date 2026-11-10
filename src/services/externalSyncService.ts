/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SyncProvider = 'strava' | 'garmin' | 'igsport';

export interface ProviderConfig {
  id: SyncProvider;
  name: string;
  tagline: string;
  brandColor: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  authUrl: string;
  scopes: string;
  clientIdPlaceholder: string;
  websiteUrl: string;
}

export const PROVIDERS_CONFIG: Record<SyncProvider, ProviderConfig> = {
  strava: {
    id: 'strava',
    name: 'Strava',
    tagline: 'Sincroniza salidas, segmentos y desnivel acumulado',
    brandColor: '#FC6100',
    badgeBg: 'bg-[#FC6100]/15',
    textColor: 'text-[#FC6100]',
    borderColor: 'border-[#FC6100]/40',
    authUrl: 'https://www.strava.com/oauth/authorize',
    scopes: 'read,activity:read_all',
    clientIdPlaceholder: 'ej. 128495',
    websiteUrl: 'https://www.strava.com/settings/api'
  },
  garmin: {
    id: 'garmin',
    name: 'Garmin Connect',
    tagline: 'Ciclocomputadores Edge, potencia, cadencia y ritmo cardíaco',
    brandColor: '#007CC3',
    badgeBg: 'bg-[#007CC3]/15',
    textColor: 'text-[#38bdf8]',
    borderColor: 'border-[#007CC3]/40',
    authUrl: 'https://connect.garmin.com/oauthConfirm',
    scopes: 'read:activities,read:devices',
    clientIdPlaceholder: 'ej. garm-oauth-82910',
    websiteUrl: 'https://developer.garmin.com'
  },
  igsport: {
    id: 'igsport',
    name: 'iGPSPORT',
    tagline: 'Dispositivos iGS630, BSC200/300 y telemetría de satélite',
    brandColor: '#E53935',
    badgeBg: 'bg-[#E53935]/15',
    textColor: 'text-rose-400',
    borderColor: 'border-[#E53935]/40',
    authUrl: 'https://i.igpsport.com/oauth/authorize',
    scopes: 'activity:read,device:status',
    clientIdPlaceholder: 'ej. igs-api-49201',
    websiteUrl: 'https://www.igpsport.com'
  }
};

export interface ConnectedAccount {
  provider: SyncProvider;
  connected: boolean;
  athleteName: string;
  athleteUsername?: string;
  avatarUrl?: string;
  connectedAt: number | null;
  lastSyncAt: number | null;
  autoSync: boolean;
  syncedActivitiesCount: number;
  totalDistanceKm: number;
  totalElevationMeters: number;
  clientId?: string;
}

export interface SyncedActivity {
  id: string;
  provider: SyncProvider;
  externalId: string;
  name: string;
  distanceKm: number;
  durationMinutes: number;
  elevationMeters: number;
  avgSpeedKmh: number;
  maxSpeedKmh?: number;
  avgPowerWatts?: number;
  avgHeartRateBpm?: number;
  date: string;
  timestamp: number;
  type: 'ruta' | 'urbana' | 'gravel';
  deviceModel: string;
  safetyScore: number;
  favorite?: boolean;
}

const STORAGE_ACCOUNTS_KEY = 'cicloradar_sync_accounts_v2';
const STORAGE_ACTIVITIES_KEY = 'cicloradar_synced_activities_v2';

class ExternalSyncService {
  private accounts: Record<SyncProvider, ConnectedAccount> = {
    strava: {
      provider: 'strava',
      connected: false,
      athleteName: '',
      connectedAt: null,
      lastSyncAt: null,
      autoSync: true,
      syncedActivitiesCount: 0,
      totalDistanceKm: 0,
      totalElevationMeters: 0
    },
    garmin: {
      provider: 'garmin',
      connected: false,
      athleteName: '',
      connectedAt: null,
      lastSyncAt: null,
      autoSync: true,
      syncedActivitiesCount: 0,
      totalDistanceKm: 0,
      totalElevationMeters: 0
    },
    igsport: {
      provider: 'igsport',
      connected: false,
      athleteName: '',
      connectedAt: null,
      lastSyncAt: null,
      autoSync: true,
      syncedActivitiesCount: 0,
      totalDistanceKm: 0,
      totalElevationMeters: 0
    }
  };

  private activities: SyncedActivity[] = [];
  private listeners: Set<() => void> = new Set();
  private isSyncing: boolean = false;
  private pendingAuthWindow: Window | null = null;
  private pendingProvider: SyncProvider | null = null;

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleOAuthMessage.bind(this));
    }
  }

  private handleOAuthMessage(event: MessageEvent) {
    const origin = event.origin;
    if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return;
    }

    if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
      const provider = (event.data.provider || this.pendingProvider || 'strava') as SyncProvider;
      this.completeConnection(provider, event.data.code);
    }
  }

  private loadFromStorage() {
    try {
      const accData = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      if (accData) {
        this.accounts = { ...this.accounts, ...JSON.parse(accData) };
      }
      const actData = localStorage.getItem(STORAGE_ACTIVITIES_KEY);
      if (actData) {
        this.activities = JSON.parse(actData);
      }
    } catch (e) {
      console.warn('Error loading sync data from localStorage', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(this.accounts));
      localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(this.activities));
    } catch (e) {
      console.warn('Error saving sync data to localStorage', e);
    }
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getAccounts(): Record<SyncProvider, ConnectedAccount> {
    return { ...this.accounts };
  }

  public getActivities(): SyncedActivity[] {
    return [...this.activities];
  }

  public isBusy(): boolean {
    return this.isSyncing;
  }

  public getRedirectUri(): string {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    return 'https://ais-dev-yjehzmzgzljkrrn676vklm-287629411663.us-east5.run.app/auth/callback';
  }

  /**
   * Genera la URL de autorización para el proveedor
   */
  public getAuthUrl(provider: SyncProvider, customClientId?: string): string {
    const cfg = PROVIDERS_CONFIG[provider];
    const redirectUri = this.getRedirectUri();
    const clientId = customClientId || 'cicloradar-client-id';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: cfg.scopes,
      state: provider
    });

    return `${cfg.authUrl}?${params.toString()}`;
  }

  /**
   * Inicia el flujo OAuth mediante Popup en el navegador
   */
  public async startOAuthPopup(provider: SyncProvider, customClientId?: string): Promise<boolean> {
    this.pendingProvider = provider;

    if (typeof window !== 'undefined') {
      const width = 600;
      const height = 720;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      // Abrir la ventana inmediatamente para evitar que el bloqueador de popups la rechace
      const popup = window.open(
        'about:blank',
        `oauth_${provider}`,
        `width=${width},height=${height},left=${left},top=${top},status=yes,scrollbars=yes`
      );

      if (!popup) {
        return false;
      }
      this.pendingAuthWindow = popup;

      try {
        const query = new URLSearchParams({ provider });
        if (customClientId) query.set('clientId', customClientId);
        const res = await fetch(`/api/auth/url?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            popup.location.href = data.url;
            return true;
          }
        }
      } catch (err) {
        console.warn('Fallo obteniendo auth URL del servidor, usando generador local:', err);
      }

      // Fallback a URL generada en cliente
      popup.location.href = this.getAuthUrl(provider, customClientId);
      return true;
    }
    return false;
  }

  /**
   * Conecta directamente una cuenta con credenciales o modo simulación
   */
  public connectAccount(provider: SyncProvider, params?: {
    athleteName?: string;
    clientId?: string;
  }) {
    const defaultNames: Record<SyncProvider, string> = {
      strava: 'Ramon Amalla (Strava Cyclist)',
      garmin: 'Ramon Amalla (Garmin Edge 1040)',
      igsport: 'Ramon Amalla (iGPSPORT iGS630)'
    };

    const athleteName = params?.athleteName || defaultNames[provider];
    this.accounts[provider] = {
      ...this.accounts[provider],
      connected: true,
      athleteName,
      connectedAt: Date.now(),
      clientId: params?.clientId,
      autoSync: true
    };

    this.saveToStorage();
    this.notify();

    // Importar actividades iniciales de esa cuenta
    this.syncAccount(provider);
  }

  private async completeConnection(provider: SyncProvider, code?: string) {
    try {
      const res = await fetch('/api/sync/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, code })
      });
      if (res.ok) {
        const data = await res.json();
        this.connectAccount(provider, {
          athleteName: data.athleteName || (provider === 'strava' ? 'Ramon Amalla (Strava Pro)' : provider === 'garmin' ? 'Ramon Amalla (Garmin Connect)' : 'Ramon Amalla (iGPSPORT Cloud)')
        });
        return;
      }
    } catch (_) {}

    this.connectAccount(provider, {
      athleteName: provider === 'strava' 
        ? 'Ramon Amalla (Strava Pro)' 
        : provider === 'garmin' 
        ? 'Ramon Amalla (Garmin Connect)' 
        : 'Ramon Amalla (iGPSPORT Cloud)'
    });
  }

  /**
   * Desconecta la cuenta y permite eliminar sus actividades
   */
  public disconnectAccount(provider: SyncProvider, removeActivities = false) {
    this.accounts[provider] = {
      ...this.accounts[provider],
      connected: false,
      athleteName: '',
      connectedAt: null,
      lastSyncAt: null,
      syncedActivitiesCount: 0,
      totalDistanceKm: 0,
      totalElevationMeters: 0
    };

    if (removeActivities) {
      this.activities = this.activities.filter(a => a.provider !== provider);
    }

    this.saveToStorage();
    this.notify();
  }

  /**
   * Alterna la auto-sincronización de una cuenta
   */
  public toggleAutoSync(provider: SyncProvider, enabled?: boolean) {
    const current = this.accounts[provider].autoSync;
    this.accounts[provider].autoSync = enabled !== undefined ? enabled : !current;
    this.saveToStorage();
    this.notify();
  }

  /**
   * Sincroniza las actividades de un proveedor específico
   */
  public async syncAccount(provider: SyncProvider): Promise<SyncedActivity[]> {
    if (!this.accounts[provider].connected) return [];

    this.isSyncing = true;
    this.notify();

    // Pequeño delay realista de sincronización de red
    await new Promise(resolve => setTimeout(resolve, 800));

    const imported = this.generateHistoricalActivities(provider);

    // Merge sin duplicados
    const existingIds = new Set(this.activities.map(a => a.id));
    const newItems = imported.filter(a => !existingIds.has(a.id));

    this.activities = [...newItems, ...this.activities];

    // Actualizar estadísticas de la cuenta
    const providerActivities = this.activities.filter(a => a.provider === provider);
    const totalKm = providerActivities.reduce((acc, a) => acc + a.distanceKm, 0);
    const totalElev = providerActivities.reduce((acc, a) => acc + a.elevationMeters, 0);

    this.accounts[provider].lastSyncAt = Date.now();
    this.accounts[provider].syncedActivitiesCount = providerActivities.length;
    this.accounts[provider].totalDistanceKm = Math.round(totalKm * 10) / 10;
    this.accounts[provider].totalElevationMeters = Math.round(totalElev);

    this.isSyncing = false;
    this.saveToStorage();
    this.notify();

    return newItems;
  }

  /**
   * Sincroniza todas las cuentas activas
   */
  public async syncAll(): Promise<number> {
    this.isSyncing = true;
    this.notify();

    let totalNew = 0;
    for (const p of ['strava', 'garmin', 'igsport'] as SyncProvider[]) {
      if (this.accounts[p].connected) {
        const added = await this.syncAccount(p);
        totalNew += added.length;
      }
    }

    this.isSyncing = false;
    this.notify();
    return totalNew;
  }

  /**
   * Genera actividades históricas realistas para cada proveedor
   */
  private generateHistoricalActivities(provider: SyncProvider): SyncedActivity[] {
    const now = Date.now();
    const dayMs = 24 * 3600 * 1000;

    switch (provider) {
      case 'strava':
        return [
          {
            id: 'strava-act-101',
            provider: 'strava',
            externalId: '1092837411',
            name: 'Fondo de los Molles y Coronamiento de Dique',
            distanceKm: 56.4,
            durationMinutes: 148,
            elevationMeters: 620,
            avgSpeedKmh: 22.8,
            maxSpeedKmh: 54.2,
            avgPowerWatts: 195,
            avgHeartRateBpm: 146,
            date: 'Hoy, 07:15',
            timestamp: now - 3 * 3600 * 1000,
            type: 'ruta',
            deviceModel: 'Strava App v342',
            safetyScore: 4.8,
            favorite: true
          },
          {
            id: 'strava-act-102',
            provider: 'strava',
            externalId: '1092837412',
            name: 'Subida al Mirador Serrano & Descenso Rápido',
            distanceKm: 38.2,
            durationMinutes: 98,
            elevationMeters: 480,
            avgSpeedKmh: 23.4,
            maxSpeedKmh: 58.1,
            avgPowerWatts: 210,
            avgHeartRateBpm: 154,
            date: 'Hace 3 días',
            timestamp: now - 3 * dayMs,
            type: 'ruta',
            deviceModel: 'Strava App v342',
            safetyScore: 4.7,
            favorite: false
          },
          {
            id: 'strava-act-103',
            provider: 'strava',
            externalId: '1092837413',
            name: 'Intervalos en Recta y Sprint en Pelotón',
            distanceKm: 32.5,
            durationMinutes: 72,
            elevationMeters: 140,
            avgSpeedKmh: 27.1,
            maxSpeedKmh: 46.5,
            avgPowerWatts: 235,
            avgHeartRateBpm: 162,
            date: 'Hace 5 días',
            timestamp: now - 5 * dayMs,
            type: 'ruta',
            deviceModel: 'Strava App v342',
            safetyScore: 4.9,
            favorite: true
          }
        ];

      case 'garmin':
        return [
          {
            id: 'garmin-act-201',
            provider: 'garmin',
            externalId: 'garm-982144',
            name: 'Entrenamiento de Fondo Zona 2 (Garmin Edge)',
            distanceKm: 68.0,
            durationMinutes: 182,
            elevationMeters: 740,
            avgSpeedKmh: 22.4,
            maxSpeedKmh: 52.0,
            avgPowerWatts: 188,
            avgHeartRateBpm: 138,
            date: 'Ayer, 08:30',
            timestamp: now - 1 * dayMs,
            type: 'ruta',
            deviceModel: 'Garmin Edge 1040 Solar',
            safetyScore: 4.9,
            favorite: true
          },
          {
            id: 'garmin-act-202',
            provider: 'garmin',
            externalId: 'garm-982145',
            name: 'Circuito Quebrada de los Padres & Ripio',
            distanceKm: 44.5,
            durationMinutes: 125,
            elevationMeters: 510,
            avgSpeedKmh: 21.4,
            maxSpeedKmh: 48.6,
            avgPowerWatts: 202,
            avgHeartRateBpm: 149,
            date: 'Hace 4 días',
            timestamp: now - 4 * dayMs,
            type: 'gravel',
            deviceModel: 'Garmin Edge 1040 Solar',
            safetyScore: 4.6,
            favorite: false
          }
        ];

      case 'igsport':
        return [
          {
            id: 'igsport-act-301',
            provider: 'igsport',
            externalId: 'igs-54312',
            name: 'Ruta Periurbana y Ciclovía Parque (iGS630)',
            distanceKm: 28.6,
            durationMinutes: 76,
            elevationMeters: 195,
            avgSpeedKmh: 22.6,
            maxSpeedKmh: 43.8,
            avgPowerWatts: 175,
            avgHeartRateBpm: 135,
            date: 'Hace 2 días',
            timestamp: now - 2 * dayMs,
            type: 'urbana',
            deviceModel: 'iGPSPORT iGS630 GPS',
            safetyScore: 4.8,
            favorite: false
          },
          {
            id: 'igsport-act-302',
            provider: 'igsport',
            externalId: 'igs-54313',
            name: 'Escalada al Cerro de la Cruz & Retorno',
            distanceKm: 42.1,
            durationMinutes: 118,
            elevationMeters: 560,
            avgSpeedKmh: 21.4,
            maxSpeedKmh: 50.2,
            avgPowerWatts: 215,
            avgHeartRateBpm: 156,
            date: 'Hace 6 días',
            timestamp: now - 6 * dayMs,
            type: 'gravel',
            deviceModel: 'iGPSPORT iGS630 GPS',
            safetyScore: 4.6,
            favorite: true
          }
        ];
    }
  }
}

export const externalSyncService = new ExternalSyncService();
