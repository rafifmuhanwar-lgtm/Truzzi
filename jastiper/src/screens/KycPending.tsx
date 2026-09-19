import { useNavigate } from 'react-router-dom';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export default function KycPending() {
  const navigate = useNavigate();
  const { checkAuth, logout } = useAuthStore();

  const handleRefresh = async () => {
    await checkAuth();
    // DriverGuard will automatically redirect to /home if approved
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-card border border-border shadow-sm max-w-sm w-full flex flex-col items-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <Clock className="text-amber-500" size={40} />
        </div>

        <h1 className="text-display font-bold text-ink mb-2">Menunggu Verifikasi</h1>

        <p className="text-body2 text-ink-secondary mb-8">
          Data dan dokumen identitas Anda sedang ditinjau oleh tim SentraGo. Mohon tunggu maksimal
          1x24 jam.
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={handleRefresh}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Cek Status Terbaru
          </button>

          <button
            onClick={handleLogout}
            className="w-full h-12 rounded-btn font-semibold text-ink-secondary hover:bg-ink/5 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Keluar Akun
          </button>
        </div>
      </div>
    </div>
  );
}
