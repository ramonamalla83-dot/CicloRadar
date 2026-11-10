export interface GeminiCyclingRoute {
  id: string;
  name: string;
  category: 'lighting' | 'traffic' | 'both';
  summary: string;
  lightingScore: number;
  trafficCalmScore: number;
  distanceKm: number;
  estimatedMinutes: number;
  streetLightingType: string;
  trafficConditions: string;
  safetyHighlights: string[];
  cautions: string[];
  waypoints?: { name: string; lat: number; lng: number }[];
  coordinates: [number, number][]; // [longitude, latitude]
}

export type RoutePreference = 'lighting' | 'traffic' | 'both';

export interface SuggestRoutesParams {
  latitude: number;
  longitude: number;
  preference?: RoutePreference;
  distanceKm?: number;
  timeOfDay?: 'day' | 'night' | 'dusk';
  currentCity?: string;
}

export interface SuggestRoutesResponse {
  success: boolean;
  source: string;
  preference: RoutePreference;
  center: { lat: number; lng: number };
  routes: GeminiCyclingRoute[];
  note?: string;
  errorDetail?: string;
}

export async function fetchGeminiCyclingRoutes(params: SuggestRoutesParams): Promise<SuggestRoutesResponse> {
  const response = await fetch('/api/gemini/suggest-routes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Error del servidor (${response.status}) al consultar rutas con Gemini.`);
  }

  const data: SuggestRoutesResponse = await response.json();
  return data;
}
