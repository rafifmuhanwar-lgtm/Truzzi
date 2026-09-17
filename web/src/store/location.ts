import { create } from 'zustand';
import { API } from '../lib/api';

export type LocationStatus = 'initial' | 'loading' | 'ready' | 'permissionDenied' | 'serviceDisabled' | 'error';

interface LocationState {
  status: LocationStatus;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  errorMessage: string | null;
  detectLocation: () => Promise<void>;
  updateLocation: (p: { latitude: number; longitude: number; address: string }) => void;
  reset: () => void;
}

// Default fallback Jakarta (identik Flutter)
export const DEFAULT_LAT = -6.2;
export const DEFAULT_LNG = 106.816666;
const DEFAULT_ADDRESS = 'Jakarta (Titik Default - Klik atur)';

const isDefault = (lat: number | null, lng: number | null) =>
  lat !== null && lng !== null && Math.abs(lat - DEFAULT_LAT) < 0.0001 && Math.abs(lng - DEFAULT_LNG) < 0.0001;

export const useLocationStore = create<LocationState>((set, get) => ({
  status: 'initial',
  latitude: null,
  longitude: null,
  address: null,
  errorMessage: null,

  detectLocation: async () => {
    set({ status: 'loading' });
    let lat = DEFAULT_LAT;
    let lng = DEFAULT_LNG;

    // Coba geolokasi browser; fallback default bila gagal / ditolak.
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 10000 }),
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        set({ status: 'permissionDenied', latitude: DEFAULT_LAT, longitude: DEFAULT_LNG, address: DEFAULT_ADDRESS, errorMessage: null });
      }
    } else {
      set({ status: 'permissionDenied', latitude: DEFAULT_LAT, longitude: DEFAULT_LNG, address: DEFAULT_ADDRESS, errorMessage: null });
    }

    const st = get().status;
    if (st === 'permissionDenied') return;

    set({ latitude: lat, longitude: lng });
    // Reverse geocode untuk menampilkan alamat
    try {
      const { result } = await API.location.reverseGeocode(lat, lng);
      if (result?.fullAddress) {
        const short = result.street && result.locality
          ? `${result.street}, ${result.locality}`
          : result.fullAddress;
        set({
          status: 'ready',
          latitude: lat,
          longitude: lng,
          address: isDefault(lat, lng) ? DEFAULT_ADDRESS : (short ?? result.fullAddress),
          errorMessage: null,
        });
      } else {
        set({
          status: 'ready',
          latitude: lat,
          longitude: lng,
          address: isDefault(lat, lng) ? DEFAULT_ADDRESS : `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
      }
    } catch {
      set({
        status: 'ready',
        latitude: lat,
        longitude: lng,
        address: isDefault(lat, lng) ? DEFAULT_ADDRESS : `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    }
  },

  updateLocation: ({ latitude, longitude, address }) =>
    set({ status: 'ready', latitude, longitude, address, errorMessage: null }),

  reset: () => set({ status: 'initial', latitude: null, longitude: null, address: null, errorMessage: null }),
}));