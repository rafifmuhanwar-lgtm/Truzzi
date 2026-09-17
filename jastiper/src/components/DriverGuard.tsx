import { useEffect, type ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { FullScreenLoader } from './Loading';

const PUBLIC_PATHS = ['/', '/login', '/register'];

/** Guard driver — meniru redirect gate app_router.dart Flutter:
 *  belum login → /login; belum KYC → /kyc (data kendaraan + verifikasi). */
export function DriverGuard({ children }: { children: ReactNode }) {
  const { status, user, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (status === 'initial') void checkAuth();
  }, [status, checkAuth]);

  const path = location.pathname;
  const isAuthRoute = PUBLIC_PATHS.includes(path) || path.startsWith('/login') || path.startsWith('/register');

  // Splash menangani redirect sendiri.
  if (path === '/') return <>{children}</>;

  if (status === 'initial' || status === 'loading') {
    return <FullScreenLoader />;
  }

  if (status === 'authenticated' && user) {
    // Sudah login & buka halaman auth → gate profil
    if (isAuthRoute) return <Navigate to={gatePath(user)} replace />;
    // Gate KYC — data kendaraan & verifikasi identitas digabung di /kyc.
    const gate = gatePath(user);
    if (gate !== '/main' && path !== gate && path !== '/profile/edit') {
      return <Navigate to={gate} replace />;
    }
    // Jika user sudah terverifikasi (gate === '/main') tapi masih di halaman kyc/splash/auth
    if (gate === '/main' && (path === '/kyc' || path === '/kyc-pending' || isAuthRoute || path === '/')) {
      return <Navigate to="/main" replace />;
    }
    return <>{children}</>;
  }

  // Belum login & bukan halaman auth → /login
  if (!isAuthRoute) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function gatePath(user: { vehicleType?: string | null; selectedArea?: string | null; kycVerified: boolean; kycKtpUrl?: string | null }): string {
  if (!user.kycVerified) {
    if (user.kycKtpUrl) return '/kyc-pending';
    return '/kyc';
  }
  if (!user.vehicleType || !user.selectedArea) return '/kyc';
  return '/main';
}
