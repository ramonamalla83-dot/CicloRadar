/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { voiceSosService, VoiceSosStatus } from '../services/voiceSosService';

export function useVoiceSos(onTrigger?: (phrase: string) => void) {
  const [status, setStatus] = useState<VoiceSosStatus>(() => voiceSosService.getStatus());

  useEffect(() => {
    const unsubscribe = voiceSosService.subscribe(() => {
      setStatus(voiceSosService.getStatus());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (onTrigger) {
      const unsubscribe = voiceSosService.onSosTrigger(onTrigger);
      return () => {
        unsubscribe();
      };
    }
  }, [onTrigger]);

  const toggleEnabled = useCallback((force?: boolean) => {
    return voiceSosService.toggleEnabled(force);
  }, []);

  const startListening = useCallback(() => {
    return voiceSosService.startListening();
  }, []);

  const stopListening = useCallback(() => {
    voiceSosService.stopListening();
  }, []);

  const simulateVoiceCommand = useCallback((phrase: string = 'CicloRadar SOS') => {
    voiceSosService.triggerSos(phrase);
  }, []);

  return {
    ...status,
    toggleEnabled,
    startListening,
    stopListening,
    simulateVoiceCommand,
  };
}
