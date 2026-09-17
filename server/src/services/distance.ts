import axios from 'axios';
import { config } from '../config.js';

export interface DistanceResult {
  jarakKm: number;
  estimasiMenit: number;
  routePoints: { lat: number; lng: number }[];
}

export interface GeocodeDetail {
  fullAddress: string;
  houseNumber?: string | null;
  street?: string | null;
  neighborhood?: string | null;
  locality?: string | null;
  city?: string | null;
  region?: string | null;
  postcode?: string | null;
  country?: string | null;
}

export interface GeocodeRecommendation {
  placeName: string;
  fullAddress: string;
  lat: number;
  lng: number;
  distanceKm: number | null;
}

const NOMINATIM_UA = 'com.truzzi.customer_app';

/** Hitung jarak — Mapbox Directions → OSRM → Haversine. Disalin perilakunya dari distance_service.dart. */
export async function hitungJarak(opts: {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}): Promise<DistanceResult> {
  const { fromLat, fromLng, toLat, toLng } = opts;
  if (config.mapbox.accessToken) {
    const res = await mapboxDistance(fromLat, fromLng, toLat, toLng);
    if (res) return res;
  }
  const osm = await osmDistance(fromLat, fromLng, toLat, toLng);
  if (osm) return osm;
  // Haversine fallback
  const distKm = haversineKm(fromLat, fromLng, toLat, toLng);
  return {
    jarakKm: distKm,
    estimasiMenit: Math.max(1, Math.round((distKm / 25.0) * 60)),
    routePoints: [
      { lat: fromLat, lng: fromLng },
      { lat: toLat, lng: toLng },
    ],
  };
}

function parseRoute(data: { routes?: Array<{ distance?: number; duration?: number; geometry?: { coordinates?: [number, number][] } }> }): DistanceResult | null {
  const routes = data.routes;
  if (!routes || routes.length === 0) return null;
  const route = routes[0];
  const distanceMeters = route.distance ?? 0;
  const durationSeconds = route.duration ?? 0;
  const coords = route.geometry?.coordinates ?? [];
  const points = coords.map((pt) => ({ lat: pt[1], lng: pt[0] }));
  return {
    jarakKm: distanceMeters / 1000.0,
    estimasiMenit: Math.round(durationSeconds / 60),
    routePoints: points,
  };
}

async function mapboxDistance(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<DistanceResult | null> {
  try {
    const coordinates = `${fromLng},${fromLat};${toLng},${toLat}`;
    const r = await axios.get(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`, {
      params: {
        access_token: config.mapbox.accessToken,
        geometries: 'geojson',
        overview: 'full',
        alternatives: 'false',
        steps: 'false',
      },
      timeout: 10000,
    });
    if (r.status === 200 && r.data && r.data.routes?.length) {
      return parseRoute(r.data);
    }
  } catch {
    /* fallthrough */
  }
  return null;
}

async function osmDistance(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<DistanceResult | null> {
  try {
    const coordinates = `${fromLng},${fromLat};${toLng},${toLat}`;
    const r = await axios.get(`https://router.project-osrm.org/route/v1/driving/${coordinates}`, {
      params: { overview: 'full', geometries: 'geojson' },
      timeout: 10000,
    });
    if (r.status === 200 && r.data && r.data.routes?.length) {
      return parseRoute(r.data);
    }
  } catch {
    /* fallthrough */
  }
  return null;
}

/** Reverse geocode — Mapbox → Nominatim. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeDetail | null> {
  if (config.mapbox.accessToken) {
    try {
      const r = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`, {
        params: { access_token: config.mapbox.accessToken, language: 'id', types: 'address,poi,neighborhood,locality,place,region,country' },
        timeout: 10000,
      });
      const feature = r.data?.features?.[0];
      if (feature) {
        const context: Record<string, string> = {};
        for (const c of feature.context ?? []) {
          const id: string = c.id ?? '';
          if (id.startsWith('neighborhood')) context.neighborhood = c.text;
          else if (id.startsWith('locality')) context.locality = c.text;
          else if (id.startsWith('place')) context.city = c.text;
          else if (id.startsWith('region')) context.region = c.text;
          else if (id.startsWith('postcode')) context.postcode = c.text;
          else if (id.startsWith('country')) context.country = c.text;
        }
        const isAddress = (feature.place_type ?? []).includes('address');
        const street = isAddress ? (feature.properties?.address ?? feature.text) : feature.text;
        return {
          fullAddress: feature.place_name ?? '',
          houseNumber: feature.address ?? null,
          street,
          neighborhood: context.neighborhood ?? null,
          locality: context.locality ?? null,
          city: context.city ?? null,
          region: context.region ?? null,
          postcode: context.postcode ?? null,
          country: context.country ?? null,
        };
      }
    } catch {
      /* fallthrough */
    }
  }
  try {
    const r = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { format: 'json', lat, lon: lng, zoom: 18, addressdetails: 1 },
      headers: { 'User-Agent': NOMINATIM_UA },
      timeout: 10000,
    });
    const d = r.data;
    const addr = d.address ?? {};
    if (d.display_name && addr) {
      const street = addr.road ?? addr.suburb ?? d.display_name.split(',').shift();
      return {
        fullAddress: d.display_name,
        houseNumber: addr.house_number ?? null,
        street: street ?? null,
        neighborhood: addr.neighbourhood ?? addr.suburb ?? null,
        locality: addr.village ?? addr.town ?? null,
        city: addr.city ?? addr.county ?? null,
        region: addr.state ?? null,
        postcode: addr.postcode ?? null,
        country: addr.country ?? null,
      };
    }
  } catch {
    /* fallthrough */
  }
  return null;
}

/** Forward geocode — Mapbox → Nominatim. */
export async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const encoded = encodeURIComponent(query);
  if (config.mapbox.accessToken) {
    try {
      const r = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`, {
        params: { access_token: config.mapbox.accessToken, language: 'id', limit: 1 },
        timeout: 10000,
      });
      const c = r.data?.features?.[0]?.center;
      if (c && c.length >= 2) return { lng: c[0], lat: c[1] };
    } catch {
      /* fallthrough */
    }
  }
  try {
    const r = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { format: 'json', q: query, countrycodes: 'id', limit: 1 },
      headers: { 'User-Agent': NOMINATIM_UA },
      timeout: 10000,
    });
    const first = r.data?.[0];
    if (first) {
      const lat = Number.parseFloat(first.lat);
      const lon = Number.parseFloat(first.lon);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) return { lat, lng: lon };
    }
  } catch {
    /* fallthrough */
  }
  return null;
}

/** Rekomendasi tempat terdekat — Mapbox → Nominatim. Urut dari terdekat bila ada proximity. */
export async function searchRecommendations(opts: { query: string; lat?: number; lng?: number }): Promise<GeocodeRecommendation[]> {
  const { query, lat, lng } = opts;
  if (!query.trim()) return [];
  const encoded = encodeURIComponent(query.trim());
  if (config.mapbox.accessToken) {
    try {
      const params: Record<string, unknown> = { access_token: config.mapbox.accessToken, language: 'id', limit: 6, country: 'id' };
      if (lat != null && lng != null) params.proximity = `${lng},${lat}`;
      const r = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`, { params, timeout: 10000 });
      const results: GeocodeRecommendation[] = [];
      for (const f of r.data?.features ?? []) {
        const center = f.center;
        if (center && center.length >= 2) {
          const lng0 = center[0];
          const lat0 = center[1];
          let dist: number | null = null;
          if (lat != null && lng != null) dist = haversineKm(lat, lng, lat0, lng0);
          results.push({
            placeName: f.text || f.place_name,
            fullAddress: f.place_name,
            lat: lat0,
            lng: lng0,
            distanceKm: dist,
          });
        }
      }
      if (lat != null && lng != null) results.sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
      return results;
    } catch {
      /* fallthrough */
    }
  }
  try {
    const r = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { format: 'json', q: query, countrycodes: 'id', limit: 8, addressdetails: 1 },
      headers: { 'User-Agent': NOMINATIM_UA },
      timeout: 10000,
    });
    const results: GeocodeRecommendation[] = [];
    for (const item of r.data ?? []) {
      const lat0 = Number.parseFloat(item.lat);
      const lng0 = Number.parseFloat(item.lon);
      if (Number.isNaN(lat0) || Number.isNaN(lng0) || !item.display_name) continue;
      let dist: number | null = null;
      if (lat != null && lng != null) dist = haversineKm(lat, lng, lat0, lng0);
      results.push({
        placeName: item.name || item.display_name.split(',').shift() || item.display_name,
        fullAddress: item.display_name,
        lat: lat0,
        lng: lng0,
        distanceKm: dist,
      });
    }
    if (lat != null && lng != null) results.sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
    return results;
  } catch {
    return [];
  }
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180.0) * Math.cos((lat2 * Math.PI) / 180.0) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}