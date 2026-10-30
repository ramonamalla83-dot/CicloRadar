/**
 * Utilidades para generación y simulación en tiempo real
 * del mapa de calor de rutas ciclistas comunitarias en CicloRadar.
 */

export interface CyclingCorridor {
  id: string;
  name: string;
  difficulty: 'Fácil' | 'Media' | 'Avanzada';
  trafficLevel: 'Alto' | 'Medio' | 'Muy Alto';
  activeCyclists: number;
  coordinates: [number, number][]; // [lng, lat]
}

export interface HeatPointFeature {
  type: 'Feature';
  properties: {
    intensity: number;
    corridorId: string;
    speed?: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface RouteLineFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    trafficLevel: string;
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

/**
 * Genera corredores ciclistas realistas centrados en las coordenadas dadas.
 */
export function getCyclingCorridors(centerLng: number, centerLat: number): CyclingCorridor[] {
  return [
    {
      id: 'corridor-1',
      name: 'Ciclovía Central Av. Libertador',
      difficulty: 'Fácil',
      trafficLevel: 'Muy Alto',
      activeCyclists: 24,
      coordinates: [
        [centerLng - 0.035, centerLat - 0.025],
        [centerLng - 0.022, centerLat - 0.012],
        [centerLng - 0.010, centerLat - 0.003],
        [centerLng + 0.002, centerLat + 0.005],
        [centerLng + 0.018, centerLat + 0.015],
        [centerLng + 0.032, centerLat + 0.028]
      ]
    },
    {
      id: 'corridor-2',
      name: 'Circuito del Parque & Mirador',
      difficulty: 'Media',
      trafficLevel: 'Alto',
      activeCyclists: 18,
      coordinates: [
        [centerLng + 0.010, centerLat - 0.020],
        [centerLng + 0.025, centerLat - 0.010],
        [centerLng + 0.030, centerLat + 0.005],
        [centerLng + 0.020, centerLat + 0.018],
        [centerLng + 0.005, centerLat + 0.015],
        [centerLng - 0.005, centerLat + 0.002],
        [centerLng + 0.010, centerLat - 0.020]
      ]
    },
    {
      id: 'corridor-3',
      name: 'Senda Costanera del Río',
      difficulty: 'Fácil',
      trafficLevel: 'Alto',
      activeCyclists: 15,
      coordinates: [
        [centerLng - 0.040, centerLat + 0.010],
        [centerLng - 0.025, centerLat + 0.012],
        [centerLng - 0.010, centerLat + 0.018],
        [centerLng + 0.008, centerLat + 0.022],
        [centerLng + 0.028, centerLat + 0.020],
        [centerLng + 0.045, centerLat + 0.024]
      ]
    },
    {
      id: 'corridor-4',
      name: 'Eje Bulevar Universitario',
      difficulty: 'Fácil',
      trafficLevel: 'Medio',
      activeCyclists: 11,
      coordinates: [
        [centerLng - 0.020, centerLat + 0.030],
        [centerLng - 0.015, centerLat + 0.015],
        [centerLng - 0.008, centerLat - 0.005],
        [centerLng - 0.002, centerLat - 0.022],
        [centerLng + 0.003, centerLat - 0.038]
      ]
    },
    {
      id: 'corridor-5',
      name: 'Ruta de Entrenamiento Las Lomas',
      difficulty: 'Avanzada',
      trafficLevel: 'Medio',
      activeCyclists: 8,
      coordinates: [
        [centerLng - 0.030, centerLat - 0.015],
        [centerLng - 0.022, centerLat - 0.028],
        [centerLng - 0.010, centerLat - 0.035],
        [centerLng + 0.005, centerLat - 0.030],
        [centerLng + 0.020, centerLat - 0.025]
      ]
    }
  ];
}

/**
 * Genera puntos de calor interpolados y dispersos a lo largo de cada ruta
 * simulando pings GPS agregados de ciclistas activos.
 */
export function generateHeatmapGeoJson(
  centerLng: number,
  centerLat: number,
  pulseSeed: number = 0
): {
  heatmapData: GeoJSON.FeatureCollection<GeoJSON.Point>;
  routesData: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  totalCyclists: number;
} {
  const corridors = getCyclingCorridors(centerLng, centerLat);
  const pointFeatures: HeatPointFeature[] = [];
  const lineFeatures: RouteLineFeature[] = [];

  let totalCyclists = 0;

  corridors.forEach((corridor, cIdx) => {
    totalCyclists += corridor.activeCyclists;

    // Agregar la línea base del corredor
    lineFeatures.push({
      type: 'Feature',
      properties: {
        id: corridor.id,
        name: corridor.name,
        trafficLevel: corridor.trafficLevel
      },
      geometry: {
        type: 'LineString',
        coordinates: corridor.coordinates
      }
    });

    // Para cada segmento del corredor, generar puntos de densidad con variabilidad
    for (let i = 0; i < corridor.coordinates.length - 1; i++) {
      const p1 = corridor.coordinates[i];
      const p2 = corridor.coordinates[i + 1];

      // Cantidad de puntos por segmento para un heatmap continuo y denso
      const steps = 18;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const baseLng = p1[0] + (p2[0] - p1[0]) * t;
        const baseLat = p1[1] + (p2[1] - p1[1]) * t;

        // Factor de pulso en tiempo real basado en seed
        const pulse = Math.sin((pulseSeed * 0.4) + (cIdx * 1.5) + (s * 0.2)) * 0.15;
        
        // Dispersión sutil simulando ancho de ciclovía y adelantamientos
        const jitterLng = (Math.sin(s * 7 + cIdx + pulseSeed) * 0.0004);
        const jitterLat = (Math.cos(s * 5 + cIdx + pulseSeed) * 0.0004);

        // Intensidad base según afluencia de la ruta
        let baseIntensity = corridor.trafficLevel === 'Muy Alto' ? 0.9 : corridor.trafficLevel === 'Alto' ? 0.7 : 0.45;
        const intensity = Math.min(1.0, Math.max(0.2, baseIntensity + pulse));

        pointFeatures.push({
          type: 'Feature',
          properties: {
            intensity,
            corridorId: corridor.id,
            speed: 15 + Math.abs(Math.sin(s + pulseSeed)) * 12
          },
          geometry: {
            type: 'Point',
            coordinates: [baseLng + jitterLng, baseLat + jitterLat]
          }
        });

        // En puntos de alta congestión (intersecciones / paradas populares), agregar un clúster extra
        if (s % 6 === 0) {
          pointFeatures.push({
            type: 'Feature',
            properties: {
              intensity: Math.min(1.0, intensity * 1.15),
              corridorId: corridor.id
            },
            geometry: {
              type: 'Point',
              coordinates: [baseLng + jitterLng * 1.8, baseLat + jitterLat * 1.8]
            }
          });
        }
      }
    }
  });

  return {
    heatmapData: {
      type: 'FeatureCollection',
      features: pointFeatures
    },
    routesData: {
      type: 'FeatureCollection',
      features: lineFeatures
    },
    totalCyclists: totalCyclists + Math.floor(Math.sin(pulseSeed) * 4)
  };
}
