import { useEffect, useState } from 'react';
import { API } from './api';

export interface Recommendation {
  placeName: string;
  fullAddress: string;
  lat: number;
  lng: number;
  distanceKm: number | null;
}

/** Reverse geocode + pencarian rekomendasi tempat (Mapbox→OSM via proxy). */
export function usePlacesQuery(q: string, lat?: number, lng?: number) {
  const [results, setResults] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { results: r } = await API.location.places(q, lat, lng);
        if (!cancelled) setResults(r ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, lat, lng]);

  return { results, loading };
}

/** Debounce reverse geocode utk pin yang dipindah. */
export function useReverseGeocode(lat: number, lng: number) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setAddress('');
    const t = setTimeout(async () => {
      try {
        const { result } = await API.location.reverseGeocode(lat, lng);
        if (!cancelled) {
          if (result?.fullAddress) {
            const short =
              result.street && result.locality ? `${result.street}, ${result.locality}` : result.fullAddress;
            setAddress(short);
          } else {
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        }
      } catch {
        if (!cancelled) {
          setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          setError('Alamat tidak tersedia');
        }
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [lat, lng]);

  return { address, error };
}

