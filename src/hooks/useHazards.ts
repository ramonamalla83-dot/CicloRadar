/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  hazardsService, 
  SafetyHazard, 
  HazardType, 
  HazardSeverity 
} from '../services/hazardsService';

export function useHazards(centerLng?: number, centerLat?: number) {
  const [hazards, setHazards] = useState<SafetyHazard[]>(() => hazardsService.getHazards());
  const [liveAlert, setLiveAlert] = useState<SafetyHazard | null>(null);

  useEffect(() => {
    const unsubscribe = hazardsService.subscribe((updated) => {
      setHazards(updated);
    });

    const handleCommunityAlert = (e: Event) => {
      const customEvt = e as CustomEvent<SafetyHazard>;
      if (customEvt.detail) {
        setLiveAlert(customEvt.detail);
      }
    };

    window.addEventListener('cicloradar:community-hazard-alert', handleCommunityAlert);

    return () => {
      unsubscribe();
      window.removeEventListener('cicloradar:community-hazard-alert', handleCommunityAlert);
    };
  }, []);

  useEffect(() => {
    if (typeof centerLng === 'number' && typeof centerLat === 'number') {
      hazardsService.ensureInitialHazards(centerLng, centerLat);
    }
  }, [centerLng, centerLat]);

  const reportHazard = useCallback((params: {
    type: HazardType;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    reportedBy?: string;
    severity?: HazardSeverity;
  }) => {
    return hazardsService.reportHazard(params);
  }, []);

  const confirmHazard = useCallback((id: string) => {
    return hazardsService.confirmHazard(id);
  }, []);

  const resolveHazard = useCallback((id: string) => {
    return hazardsService.resolveHazard(id);
  }, []);

  const deleteHazard = useCallback((id: string) => {
    return hazardsService.deleteHazard(id);
  }, []);

  const clearLiveAlert = useCallback(() => {
    setLiveAlert(null);
  }, []);

  return {
    hazards,
    liveAlert,
    clearLiveAlert,
    reportHazard,
    confirmHazard,
    resolveHazard,
    deleteHazard
  };
}
