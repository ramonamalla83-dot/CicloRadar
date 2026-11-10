import { useState, useEffect } from 'react';
import { themeService, ThemeState, ThemeMode } from '../services/themeService';

export function useCyclingTheme() {
  const [themeState, setThemeState] = useState<ThemeState>(() => themeService.getThemeState());

  useEffect(() => {
    const unsubscribe = themeService.subscribe((newState) => {
      setThemeState(newState);
    });
    return unsubscribe;
  }, []);

  const setMode = (mode: ThemeMode) => {
    themeService.setMode(mode);
  };

  const setComfortFilter = (enabled: boolean) => {
    themeService.setComfortFilter(enabled);
  };

  const cycleMode = () => {
    if (themeState.mode === 'auto') {
      themeService.setMode('night');
    } else if (themeState.mode === 'night') {
      themeService.setMode('day');
    } else {
      themeService.setMode('auto');
    }
  };

  return {
    ...themeState,
    setMode,
    setComfortFilter,
    cycleMode,
  };
}
