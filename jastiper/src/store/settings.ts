import { create } from 'zustand';

/** Keys persis SharedPreferences settings_provider.dart Flutter. */
const KEYS = {
  notifyNewOrder: 'notify_new_order',
  notifyChat: 'notify_chat',
  notifyPromo: 'notify_promo',
  vibrateOnOrder: 'vibrate_on_order',
  showOnlineStatus: 'show_online_status',
  saveBatteryMode: 'save_battery_mode',
} as const;

export type SettingsKey = keyof typeof KEYS;

interface DriverSettings {
  notifyNewOrder: boolean;
  notifyChat: boolean;
  notifyPromo: boolean;
  vibrateOnOrder: boolean;
  showOnlineStatus: boolean;
  saveBatteryMode: boolean;
  toggle: (key: SettingsKey) => void;
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* ignore */
  }
}

/** Default persis settings_provider.dart. */
export const useSettingsStore = create<DriverSettings>((set, get) => ({
  notifyNewOrder: readBool(KEYS.notifyNewOrder, true),
  notifyChat: readBool(KEYS.notifyChat, true),
  notifyPromo: readBool(KEYS.notifyPromo, false),
  vibrateOnOrder: readBool(KEYS.vibrateOnOrder, true),
  showOnlineStatus: readBool(KEYS.showOnlineStatus, true),
  saveBatteryMode: readBool(KEYS.saveBatteryMode, false),

  toggle: (key) => {
    const next = !get()[key];
    writeBool(KEYS[key], next);
    set({ [key]: next } as Partial<DriverSettings>);
  },
}));
