import { useEffect, type ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const PUBLIC_PATHS = ['/', '/location', '/login', '/register'];

/** Guard akses — meniru redirect logic di app_router.dart Flutter. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (status === 'initial') void checkAuth();
  }, [status, checkAuth]);

  const path = location.pathname;
  const isAuthRoute =
    PUBLIC_PATHS.includes(path) || path.startsWith('/login') || path.startsWith('/register');

  // Splash menangani redirect sendiri; location boleh sebelum login.
  if (path === '/' || path === '/location') {
    if (status === 'authenticated' && path === '/location') return <Navigate to="/main" replace />;
    return <>{children}</>;
  }

  // Masih cek: jangan redirect dulu.
  if (status === 'initial' || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-white text-2xl font-black font-sans">S</span>
          </div>
          <p className="text-sm text-ink-secondary">Memuat...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    // Sudah login & lagi di halaman auth → /main
    if (isAuthRoute) return <Navigate to="/main" replace />;
    return <>{children}</>;
  }

  // Belum login & bukan halaman auth → /login
  if (!isAuthRoute) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
