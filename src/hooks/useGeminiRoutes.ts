import { useState, useCallback, useMemo } from 'react';
import { 
  fetchGeminiCyclingRoutes, 
  GeminiCyclingRoute, 
  RoutePreference, 
  SuggestRoutesParams 
} from '../services/geminiRoutingService';

export function useGeminiRoutes() {
  const [routes, setRoutes] = useState<GeminiCyclingRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<GeminiCyclingRoute | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [preference, setPreference] = useState<RoutePreference>('lighting');
  const [distanceKm, setDistanceKm] = useState<number>(8);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [lastSource, setLastSource] = useState<string>('');

  const fetchRoutes = useCallback(async (
    coords: { lat: number; lng: number },
    customPref?: RoutePreference,
    customDist?: number
  ) => {
    setIsLoading(true);
    setError(null);
    const prefToUse = customPref || preference;
    const distToUse = customDist || distanceKm;

    try {
      const result = await fetchGeminiCyclingRoutes({
        latitude: coords.lat,
        longitude: coords.lng,
        preference: prefToUse,
        distanceKm: distToUse,
        timeOfDay: new Date().getHours() >= 19 || new Date().getHours() < 7 ? 'night' : 'day'
      });

      if (result.routes && result.routes.length > 0) {
        setRoutes(result.routes);
        setLastSource(result.source);
        // Seleccionar automáticamente la primera ruta si no hay ninguna activa
        setSelectedRoute(result.routes[0]);
      } else {
        setError('No se encontraron rutas seguras para esta ubicación.');
      }
    } catch (err: any) {
      console.error('Error en useGeminiRoutes:', err);
      setError(err.message || 'Error al conectar con el asistente de rutas Gemini.');
    } finally {
      setIsLoading(false);
    }
  }, [preference, distanceKm]);

  const selectRoute = useCallback((route: GeminiCyclingRoute | null) => {
    setSelectedRoute(route);
  }, []);

  const clearRoute = useCallback(() => {
    setSelectedRoute(null);
  }, []);

  // GeoJSON LineString de la ruta seleccionada para MapLibre
  const routeGeoJson = useMemo(() => {
    if (!selectedRoute || !selectedRoute.coordinates || selectedRoute.coordinates.length < 2) {
      return null;
    }

    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {
            id: selectedRoute.id,
            name: selectedRoute.name,
            category: selectedRoute.category,
            lightingScore: selectedRoute.lightingScore,
            trafficCalmScore: selectedRoute.trafficCalmScore,
            distanceKm: selectedRoute.distanceKm,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: selectedRoute.coordinates,
          },
        },
      ],
    };
  }, [selectedRoute]);

  // GeoJSON Points de los waypoints de la ruta seleccionada
  const waypointsGeoJson = useMemo(() => {
    if (!selectedRoute || !selectedRoute.waypoints || selectedRoute.waypoints.length === 0) {
      return null;
    }

    return {
      type: 'FeatureCollection' as const,
      features: selectedRoute.waypoints.map((wp, idx) => ({
        type: 'Feature' as const,
        properties: {
          index: idx + 1,
          name: wp.name,
          isStart: idx === 0,
          isEnd: idx === (selectedRoute.waypoints?.length ?? 1) - 1,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [wp.lng, wp.lat],
        },
      })),
    };
  }, [selectedRoute]);

  return {
    routes,
    selectedRoute,
    isLoading,
    error,
    preference,
    distanceKm,
    isDrawerOpen,
    lastSource,
    routeGeoJson,
    waypointsGeoJson,
    fetchRoutes,
    selectRoute,
    clearRoute,
    setPreference,
    setDistanceKm,
    setIsDrawerOpen,
  };
}
