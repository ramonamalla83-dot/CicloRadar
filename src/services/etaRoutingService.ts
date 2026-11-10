/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { externalSyncService } from './externalSyncService';

export interface ElevationPoint {
  distanceKm: number;
  elevationMeters: number;
  gradientPercent: number; // Pendiente %
  lat: number;
  lng: number;
  estimatedSpeedKmh: number;
  cumulativeMinutes: number;
}

export type PaceMode = 'historic' | 'relaxed' | 'fast' | 'ebike';

export interface RouteAltimetryProfile {
  totalDistanceKm: number;
  elevationGainMeters: number;    // D+ Desnivel positivo
  elevationLossMeters: number;    // D- Desnivel negativo
  minElevationMeters: number;
  maxElevationMeters: number;
  avgGradientPercent: number;
  maxGradientPercent: number;
  climbDistanceKm: number;
  descentDistanceKm: number;
  flatDistanceKm: number;
  elevationPoints: ElevationPoint[];
}

export interface EtaCalculationResult {
  destination: {
    lat: number;
    lng: number;
    name: string;
  };
  start: {
    lat: number;
    lng: number;
  };
  profile: RouteAltimetryProfile;
  baseHistoricalSpeedKmh: number;
  effectiveSpeedKmh: number;
  estimatedDurationMinutes: number;
  formattedDuration: string;
  estimatedArrivalTime: string; // ej. "18:45"
  elevationTimePenaltyMinutes: number; // Minutos añadidos por subidas
  paceMode: PaceMode;
  routeGeoJson: GeoJSON.Feature<GeoJSON.LineString>;
}

/**
 * Calcula la velocidad media histórica del usuario a partir de las actividades sincronizadas
 * (Strava, Garmin, iGPSPORT) o fallback a estándar ciclista de 21.5 km/h.
 */
export function getHistoricalAverageSpeed(): { speed: number; sourceCount: number; source: string } {
  try {
    const activities = externalSyncService.getActivities();
    if (activities && activities.length > 0) {
      const validActivities = activities.filter(a => a.distanceKm > 0 && a.durationMinutes > 0);
      if (validActivities.length > 0) {
        const totalKm = validActivities.reduce((acc, a) => acc + a.distanceKm, 0);
        const totalMinutes = validActivities.reduce((acc, a) => acc + a.durationMinutes, 0);
        const weightedSpeed = (totalKm / (totalMinutes / 60));
        return {
          speed: Math.round(weightedSpeed * 10) / 10,
          sourceCount: validActivities.length,
          source: 'Strava / Garmin / iGPSPORT'
        };
      }
    }
  } catch (e) {
    console.warn('Error computing historical speed from sync service', e);
  }

  return {
    speed: 21.8,
    sourceCount: 0,
    source: 'Promedio CicloRadar Base'
  };
}

/**
 * Distancia Haversine en kilómetros entre dos coordenadas
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio terrestre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Simula o extrae la elevación topográfica del terreno en una coordenada dada.
 * Utiliza un modelo fractal de ondulación orográfica con elevación base según lat/lng.
 */
function sampleTerrainElevation(lat: number, lng: number): number {
  // Elevación base de la región (ej. Cuyo / Serranías / 720m)
  const baseAltitude = 740;
  
  // Ondulación topográfica natural mediante armónicos espaciales
  const h1 = Math.sin(lat * 180 + lng * 120) * 85;
  const h2 = Math.cos(lat * 360 - lng * 240) * 45;
  const h3 = Math.sin((lat + lng) * 520) * 25;
  const valleyFault = Math.sin(lng * 60) * 35;
  
  const rawElevation = baseAltitude + h1 + h2 + h3 + valleyFault;
  return Math.round(Math.max(10, rawElevation));
}

/**
 * Modelo de física ciclista (adaptación Minetti / Tobler para ciclismo):
 * Ajusta la velocidad según la pendiente (%)
 */
export function calculateCyclingSpeedOnGradient(
  baseSpeedKmh: number,
  gradientPercent: number,
  paceMode: PaceMode = 'historic'
): number {
  let effectiveBase = baseSpeedKmh;

  if (paceMode === 'relaxed') {
    effectiveBase = baseSpeedKmh * 0.8;
  } else if (paceMode === 'fast') {
    effectiveBase = baseSpeedKmh * 1.18;
  } else if (paceMode === 'ebike') {
    // Las e-bikes mantienen velocidad constante en subida hasta 25 km/h
    if (gradientPercent > 0) {
      return Math.max(18, 25 - gradientPercent * 0.4);
    }
    return Math.min(38, 25 + Math.abs(gradientPercent) * 1.2);
  }

  if (gradientPercent >= 0) {
    // Pendiente positiva (Subida):
    // Cada 1% reduce la velocidad debido al trabajo gravitatorio (P = m*g*v*sin(theta))
    // A 4% reduce aprox 30%, a 8% reduce a unos 10-12 km/h
    const uphillFactor = 1 / (1 + 0.12 * gradientPercent + 0.012 * Math.pow(gradientPercent, 1.8));
    const calculated = effectiveBase * uphillFactor;
    return Math.max(5.5, Math.round(calculated * 10) / 10);
  } else {
    // Pendiente negativa (Bajada):
    // La gravedad ayuda pero el ciclista frena por seguridad y curvas
    const absGrad = Math.abs(gradientPercent);
    const downhillBoost = 1 + 0.09 * absGrad - 0.0035 * Math.pow(absGrad, 2);
    const calculated = effectiveBase * downhillBoost;
    return Math.min(42.0, Math.round(calculated * 10) / 10);
  }
}

/**
 * Calcula la ruta ciclista, el perfil altimétrico y la estimación de tiempo de llegada (ETA)
 */
export function calculateRouteAndEta(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number,
  destName?: string,
  userPaceMode: PaceMode = 'historic',
  manualSpeedOverride?: number
): EtaCalculationResult {
  const directDistanceKm = calculateHaversineDistanceKm(startLat, startLng, destLat, destLng);
  // Factor de sinuosidad vial urbana y de ciclovías (1.22x la distancia en línea recta)
  const roadWindingFactor = 1.22;
  const totalDistanceKm = Math.round(directDistanceKm * roadWindingFactor * 10) / 10;

  // Determinar velocidad histórica base
  const historical = getHistoricalAverageSpeed();
  const baseHistoricalSpeedKmh = manualSpeedOverride && manualSpeedOverride > 0 
    ? manualSpeedOverride 
    : historical.speed;

  // Cantidad de puntos de muestreo altimétrico a lo largo de la traza (20-30 puntos)
  const steps = Math.min(36, Math.max(16, Math.round(totalDistanceKm * 4)));
  const coordinates: [number, number][] = [];
  const elevationPoints: ElevationPoint[] = [];

  let prevElev = sampleTerrainElevation(startLat, startLng);
  let totalGain = 0;
  let totalLoss = 0;
  let climbDistance = 0;
  let descentDistance = 0;
  let flatDistance = 0;
  let totalCumulativeMinutes = 0;
  let maxGradient = 0;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    // Sinuosidad suave en la ruta GeoJSON para asemejarse a calles/ciclovías
    const curveDeviation = Math.sin(progress * Math.PI) * 0.0025;
    const lat = startLat + (destLat - startLat) * progress + curveDeviation * Math.cos(progress * 4);
    const lng = startLng + (destLng - startLng) * progress + curveDeviation * Math.sin(progress * 4);
    
    coordinates.push([lng, lat]);

    const pointDistanceKm = (totalDistanceKm / steps) * i;
    const currentElev = sampleTerrainElevation(lat, lng);

    let gradient = 0;
    if (i > 0) {
      const stepDistMeters = (totalDistanceKm / steps) * 1000;
      const elevDiff = currentElev - prevElev;
      gradient = Math.round((elevDiff / stepDistMeters) * 1000) / 10;

      if (Math.abs(gradient) > Math.abs(maxGradient)) {
        maxGradient = gradient;
      }

      if (elevDiff > 0) {
        totalGain += elevDiff;
        climbDistance += totalDistanceKm / steps;
      } else if (elevDiff < 0) {
        totalLoss += Math.abs(elevDiff);
        descentDistance += totalDistanceKm / steps;
      } else {
        flatDistance += totalDistanceKm / steps;
      }

      // Tiempo para este segmento según pendiente y velocidad
      const segSpeed = calculateCyclingSpeedOnGradient(baseHistoricalSpeedKmh, gradient, userPaceMode);
      const segTimeHours = (totalDistanceKm / steps) / segSpeed;
      totalCumulativeMinutes += segTimeHours * 60;
    }

    const currentSpeed = calculateCyclingSpeedOnGradient(baseHistoricalSpeedKmh, gradient, userPaceMode);

    elevationPoints.push({
      distanceKm: Math.round(pointDistanceKm * 10) / 10,
      elevationMeters: currentElev,
      gradientPercent: gradient,
      lat,
      lng,
      estimatedSpeedKmh: currentSpeed,
      cumulativeMinutes: Math.round(totalCumulativeMinutes * 10) / 10
    });

    prevElev = currentElev;
  }

  // Pequeña reserva para detenciones en esquinas o semáforos (1 min cada 3.5 km)
  const urbanBufferMinutes = Math.round((totalDistanceKm / 3.5) * 10) / 10;
  const estimatedDurationMinutes = Math.max(1, Math.round(totalCumulativeMinutes + urbanBufferMinutes));

  // Tiempo teórico en plano
  const theoreticalFlatMinutes = Math.round(((totalDistanceKm / baseHistoricalSpeedKmh) * 60) + urbanBufferMinutes);
  const elevationTimePenaltyMinutes = Math.max(0, estimatedDurationMinutes - theoreticalFlatMinutes);

  // Formatear duración
  const hours = Math.floor(estimatedDurationMinutes / 60);
  const minutes = estimatedDurationMinutes % 60;
  const formattedDuration = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;

  // Hora de llegada estimada
  const now = new Date();
  const arrivalDate = new Date(now.getTime() + estimatedDurationMinutes * 60000);
  const arrivalHours = arrivalDate.getHours().toString().padStart(2, '0');
  const arrivalMins = arrivalDate.getMinutes().toString().padStart(2, '0');
  const estimatedArrivalTime = `${arrivalHours}:${arrivalMins}`;

  const allElevations = elevationPoints.map(p => p.elevationMeters);
  const minElev = Math.min(...allElevations);
  const maxElev = Math.max(...allElevations);
  const avgGrad = totalDistanceKm > 0 ? Math.round((totalGain / (totalDistanceKm * 1000)) * 1000) / 10 : 0;

  const effectiveSpeedKmh = estimatedDurationMinutes > 0
    ? Math.round((totalDistanceKm / (estimatedDurationMinutes / 60)) * 10) / 10
    : baseHistoricalSpeedKmh;

  const routeGeoJson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {
      totalDistanceKm,
      elevationGainMeters: totalGain,
      durationMinutes: estimatedDurationMinutes
    },
    geometry: {
      type: 'LineString',
      coordinates
    }
  };

  return {
    destination: {
      lat: destLat,
      lng: destLng,
      name: destName || `Destino (${destLat.toFixed(4)}, ${destLng.toFixed(4)})`
    },
    start: {
      lat: startLat,
      lng: startLng
    },
    profile: {
      totalDistanceKm,
      elevationGainMeters: totalGain,
      elevationLossMeters: totalLoss,
      minElevationMeters: minElev,
      maxElevationMeters: maxElev,
      avgGradientPercent: avgGrad,
      maxGradientPercent: maxGradient,
      climbDistanceKm: Math.round(climbDistance * 10) / 10,
      descentDistanceKm: Math.round(descentDistance * 10) / 10,
      flatDistanceKm: Math.round(flatDistance * 10) / 10,
      elevationPoints
    },
    baseHistoricalSpeedKmh,
    effectiveSpeedKmh,
    estimatedDurationMinutes,
    formattedDuration,
    estimatedArrivalTime,
    elevationTimePenaltyMinutes,
    paceMode: userPaceMode,
    routeGeoJson
  };
}
