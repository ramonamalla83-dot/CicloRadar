/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  externalSyncService, 
  SyncProvider, 
  ConnectedAccount, 
  SyncedActivity, 
  PROVIDERS_CONFIG 
} from '../services/externalSyncService';

export function useExternalSync() {
  const [accounts, setAccounts] = useState<Record<SyncProvider, ConnectedAccount>>(() =>
    externalSyncService.getAccounts()
  );
  const [activities, setActivities] = useState<SyncedActivity[]>(() =>
    externalSyncService.getActivities()
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(() =>
    externalSyncService.isBusy()
  );

  useEffect(() => {
    const unsubscribe = externalSyncService.subscribe(() => {
      setAccounts(externalSyncService.getAccounts());
      setActivities(externalSyncService.getActivities());
      setIsSyncing(externalSyncService.isBusy());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const connectAccount = useCallback((provider: SyncProvider, params?: {
    athleteName?: string;
    clientId?: string;
  }) => {
    externalSyncService.connectAccount(provider, params);
  }, []);

  const startOAuthPopup = useCallback((provider: SyncProvider, customClientId?: string) => {
    return externalSyncService.startOAuthPopup(provider, customClientId);
  }, []);

  const disconnectAccount = useCallback((provider: SyncProvider, removeActivities?: boolean) => {
    externalSyncService.disconnectAccount(provider, removeActivities);
  }, []);

  const toggleAutoSync = useCallback((provider: SyncProvider, enabled?: boolean) => {
    externalSyncService.toggleAutoSync(provider, enabled);
  }, []);

  const syncAccount = useCallback(async (provider: SyncProvider) => {
    return await externalSyncService.syncAccount(provider);
  }, []);

  const syncAll = useCallback(async () => {
    return await externalSyncService.syncAll();
  }, []);

  const getRedirectUri = useCallback(() => {
    return externalSyncService.getRedirectUri();
  }, []);

  const connectedCount = (Object.values(accounts) as ConnectedAccount[]).filter(a => a.connected).length;

  return {
    accounts,
    activities,
    isSyncing,
    connectedCount,
    hasAnyConnected: connectedCount > 0,
    providersConfig: PROVIDERS_CONFIG,
    connectAccount,
    startOAuthPopup,
    disconnectAccount,
    toggleAutoSync,
    syncAccount,
    syncAll,
    getRedirectUri
  };
}
