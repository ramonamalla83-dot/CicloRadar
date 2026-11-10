/**
 * Generador de datos geográficos para mapa de calor (Heatmap) y corredores ciclísticos.
 * Genera puntos de intensidad y polilíneas realistas centradas en la ubicación del ciclista.
 */

export interface CyclingCorridor {
  id: string;
  name: string;
  trafficLevel: 'Bajo' | 'Medio' | 'Alto' | 'Muy Alto';
  activeCyclists: number;
  coordinates: [number, number][];
}

export function getCyclingCorridors(centerLng: number, centerLat: number): CyclingCorridor[] {
  // Generar 4 corredores ciclísticos con orientaciones diversas
  return [
    {
      id: 'corridor-ciclovia-norte',
      name: 'Ciclovía Central Av. Illia - Parque IV Centenario',
      trafficLevel: 'Bajo',
      activeCyclists: 24,
      coordinates: [
        [centerLng - 0.015, centerLat - 0.012],
        [centerLng - 0.008, centerLat - 0.004],
        [centerLng, centerLat],
        [centerLng + 0.012, centerLat + 0.008],
        [centerLng + 0.022, centerLat + 0.018]
      ]
    },
    {
      id: 'corridor-circuito-este',
      name: 'Bulevar Circunvalación & Mirador Este',
      trafficLevel: 'Medio',
      activeCyclists: 18,
      coordinates: [
        [centerLng - 0.005, centerLat + 0.015],
        [centerLng + 0.008, centerLat + 0.012],
        [centerLng + 0.018, centerLat + 0.002],
        [centerLng + 0.025, centerLat - 0.009]
      ]
    },
    {
      id: 'corridor-senda-rio',
      name: 'Senda Recreativa Ribera del Río',
      trafficLevel: 'Bajo',
      activeCyclists: 31,
      coordinates: [
        [centerLng - 0.022, centerLat - 0.005],
        [centerLng - 0.012, centerLat - 0.001],
        [centerLng - 0.002, centerLat + 0.004],
        [centerLng + 0.009, centerLat + 0.011]
      ]
    },
    {
      id: 'corridor-anillo-universitario',
      name: 'Corredor Seguro Universitario & Polideportivo',
      trafficLevel: 'Muy Alto',
      activeCyclists: 42,
      coordinates: [
        [centerLng - 0.018, centerLat + 0.010],
        [centerLng - 0.007, centerLat + 0.006],
        [centerLng + 0.004, centerLat - 0.005],
        [centerLng + 0.015, centerLat - 0.016]
      ]
    }
  ];
}

export function generateHeatmapGeoJson(
  centerLng: number,
  centerLat: number,
  _pulseSeed: number = 0
): {
  heatmapData: GeoJSON.FeatureCollection<GeoJSON.Point>;
  routesData: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  totalCyclists: number;
} {
  const corridors = getCyclingCorridors(centerLng, centerLat);

  // Crear FeatureCollection para los corredores (LineString)
  const routesFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = corridors.map(c => ({
    type: 'Feature',
    properties: {
      id: c.id,
      name: c.name,
      activeCyclists: c.activeCyclists
    },
    geometry: {
      type: 'LineString',
      coordinates: c.coordinates
    }
  }));

  // Crear puntos de calor densos a lo largo de las rutas y clusters urbanos
  const pointFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];
  let totalCyclists = 0;

  corridors.forEach((corridor) => {
    totalCyclists += corridor.activeCyclists;
    const coords = corridor.coordinates;
    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i];
      const [lng2, lat2] = coords[i + 1];

      // Interpolar puntos intermedios con dispersión sutil
      const steps = 4;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const baseLng = lng1 + (lng2 - lng1) * t;
        const baseLat = lat1 + (lat2 - lat1) * t;
        
        // Agregar punto central
        pointFeatures.push({
          type: 'Feature',
          properties: {
            intensity: Math.min(1.0, 0.4 + (corridor.activeCyclists / 50) * 0.6)
          },
          geometry: {
            type: 'Point',
            coordinates: [baseLng, baseLat]
          }
        });

        // Puntos adyacentes de dispersión
        pointFeatures.push({
          type: 'Feature',
          properties: {
            intensity: Math.min(0.8, 0.2 + Math.random() * 0.4)
          },
          geometry: {
            type: 'Point',
            coordinates: [
              baseLng + (Math.random() - 0.5) * 0.002,
              baseLat + (Math.random() - 0.5) * 0.002
            ]
          }
        });
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
      features: routesFeatures
    },
    totalCyclists
  };
}
