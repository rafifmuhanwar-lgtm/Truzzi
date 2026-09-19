import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSettingsStore, type SettingsKey } from '../store/settings';

/** Pengaturan — persis settings_screen.dart: toggle notifikasi/privasi/hemat baterai (localStorage). */
export default function Settings() {
  const navigate = useNavigate();
  const settings = useSettingsStore();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary px-4 pt-4 pb-5 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-white rounded-full hover:bg-white/10"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white font-semibold">Pengaturan</h1>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5 max-w-lg mx-auto pb-8">
        <section>
          <h2 className="text-small font-bold text-ink-secondary uppercase tracking-wide mb-2">
            Notifikasi
          </h2>
          <div className="card divide-y divide-divider overflow-hidden">
            <ToggleRow label="Pesanan Baru" settingKey="notifyNewOrder" />
            <ToggleRow label="Pesan Chat" settingKey="notifyChat" />
            <ToggleRow label="Promo & Info" settingKey="notifyPromo" />
            <ToggleRow label="Getar Saat Pesanan" settingKey="vibrateOnOrder" />
          </div>
        </section>

        <section>
          <h2 className="text-small font-bold text-ink-secondary uppercase tracking-wide mb-2">
            Privasi &amp; Keamanan
          </h2>
          <div className="card divide-y divide-divider overflow-hidden">
            <ToggleRow label="Tampilkan Status Online" settingKey="showOnlineStatus" />
            <button
              onClick={() => alert('Silakan hubungi CS untuk mengubah kata sandi')}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-background/60"
            >
              <span className="text-body2 font-medium">Ubah Kata Sandi</span>
              <span className="text-small text-primary font-semibold">Ubah</span>
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-small font-bold text-ink-secondary uppercase tracking-wide mb-2">
            Lainnya
          </h2>
          <div className="card divide-y divide-divider overflow-hidden">
            <ToggleRow
              label="Mode Hemat Baterai"
              settingKey="saveBatteryMode"
              sub={
                settings.saveBatteryMode
                  ? 'Update lokasi dikurangi untuk hemat baterai'
                  : 'Kurangi frekuensi update lokasi untuk hemat baterai'
              }
            />
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-body2 font-medium">Versi Aplikasi</span>
              <span className="text-small text-ink-secondary">v1.0.0</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  settingKey,
  sub,
}: {
  label: string;
  settingKey: SettingsKey;
  sub?: string;
}) {
  const value = useSettingsStore((s) => s[settingKey]);
  const toggle = useSettingsStore((s) => s.toggle);
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-body2 font-medium">{label}</p>
        {sub && <p className="text-small text-ink-secondary mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => toggle(settingKey)}
        role="switch"
        aria-checked={value}
        aria-label={label}
        className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-success' : 'bg-border'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            value ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}
