/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  calculateRouteAndEta, 
  getHistoricalAverageSpeed, 
  EtaCalculationResult, 
  PaceMode 
} from '../services/etaRoutingService';

export function useAltimetryEta(userLat?: number, userLng?: number) {
  const [destination, setDestinationState] = useState<{
    lat: number;
    lng: number;
    name?: string;
  } | null>(null);

  const [isDestinationMode, setIsDestinationMode] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [paceMode, setPaceMode] = useState<PaceMode>('historic');
  const [customSpeed, setCustomSpeed] = useState<number | null>(null);

  const historicalInfo = useMemo(() => {
    return getHistoricalAverageSpeed();
  }, []);

  const [calculationResult, setCalculationResult] = useState<EtaCalculationResult | null>(null);

  // Recalcular ruta y ETA cuando cambie el destino, posición de inicio o modo de ritmo
  useEffect(() => {
    if (!destination) {
      setCalculationResult(null);
      return;
    }

    const startLat = userLat !== undefined ? userLat : -33.2994;
    const startLng = userLng !== undefined ? userLng : -66.3369;

    const result = calculateRouteAndEta(
      startLat,
      startLng,
      destination.lat,
      destination.lng,
      destination.name,
      paceMode,
      customSpeed || undefined
    );

    setCalculationResult(result);
  }, [destination, userLat, userLng, paceMode, customSpeed]);

  const setDestination = useCallback((lat: number, lng: number, name?: string) => {
    setDestinationState({ lat, lng, name });
    setIsDrawerOpen(true);
    setIsDestinationMode(false); // Desactivar modo selección tras elegir
  }, []);

  const clearDestination = useCallback(() => {
    setDestinationState(null);
    setCalculationResult(null);
    setIsDrawerOpen(false);
  }, []);

  const toggleDestinationMode = useCallback(() => {
    setIsDestinationMode(prev => !prev);
  }, []);

  return {
    destination,
    isDestinationMode,
    isDrawerOpen,
    paceMode,
    customSpeed,
    historicalInfo,
    calculationResult,
    setDestination,
    clearDestination,
    toggleDestinationMode,
    setIsDestinationMode,
    setIsDrawerOpen,
    setPaceMode,
    setCustomSpeed
  };
}
