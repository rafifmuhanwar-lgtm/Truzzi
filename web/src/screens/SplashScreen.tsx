import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import truzziLogo from '../assets/images/truzzi_logo.png';
import jastiperScooter from '../assets/images/jastiper_scooter.png';

/** Splash — 3 detik (identik Flutter), lalu ke /main bila login, else /location. */
export default function SplashScreen() {
  const navigate = useNavigate();
  const { checkAuth, status } = useAuthStore();

  useEffect(() => {
    // Cek session dulu (agar /main muncul bila masih login).
    if (status === 'initial') void checkAuth();
    // Redirect setelah 3 detik sesuai status.
    const t = setTimeout(() => {
      const s = useAuthStore.getState().status;
      if (s === 'authenticated') navigate('/main', { replace: true });
      else navigate('/location', { replace: true });
    }, 3000);
    return () => clearTimeout(t);
  }, [navigate, checkAuth, status]);

  return (
    <div className="min-h-screen bg-primary overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center mt-20">
        {/* Logo Truzzi Baru */}
        <div className="flex flex-col items-center transform transition-all hover:scale-105">
          <img src={truzziLogo} alt="Truzzi Logo" className="w-[220px] object-contain drop-shadow-xl" />
        </div>
      </div>
      <div className="relative flex-1">
        <img
          src={jastiperScooter}
          alt=""
          className="w-full"
          style={{ transform: 'scale(1.15)' }}
        />
      </div>
    </div>
  );
}
