import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import truzziLogo from '../assets/images/truzzi_logo.png';
import jastiperScooter from '../assets/images/jastiper_scooter.png';

/** Splash 3 detik + logo — persis splash_screen.dart ("Truzzi / D R I V E R"). */
export default function Splash() {
  const navigate = useNavigate();
  const { status, user, checkAuth } = useAuthStore();

  useEffect(() => {
    if (status === 'initial') void checkAuth();
  }, [status, checkAuth]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (status === 'authenticated' && user) {
        if (!user.kycVerified || !user.vehicleType || !user.selectedArea) navigate('/kyc', { replace: true });
        else navigate('/main', { replace: true });
      } else if (status === 'unauthenticated') {
        navigate('/login', { replace: true });
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [status, user, navigate]);

  return (
    <div className="min-h-screen bg-primary overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center mt-10">
        <div className="flex items-center justify-center animate-pulse transform transition-all hover:scale-105">
          <img src={truzziLogo} alt="Truzzi Logo" className="w-[220px] object-contain drop-shadow-xl" />
        </div>
        <p className="text-white/80 text-sm tracking-[0.4em] -mt-6 uppercase text-center pl-[0.4em]">Only Jastiper</p>
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
