import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import { AuthGuard } from './components/AuthGuard';
import { useAuthStore } from './store/auth';
import Loading from './components/Loading';

// Screens dimuat lazy agar bundle terpisah.
const SplashScreen = lazy(() => import('./screens/SplashScreen'));
const LocationSelection = lazy(() => import('./screens/LocationSelection'));
const LoginScreen = lazy(() => import('./screens/LoginScreen'));
const RegisterScreen = lazy(() => import('./screens/RegisterScreen'));
const MainShell = lazy(() => import('./screens/MainShell'));
const JastipForm = lazy(() => import('./screens/JastipForm'));
const JastipExploreScreen = lazy(() => import('./screens/JastipExploreScreen'));
const JastipSummary = lazy(() => import('./screens/JastipSummary'));
const OrderSuccess = lazy(() => import('./screens/OrderSuccess'));
const DeliveryAddress = lazy(() => import('./screens/DeliveryAddress'));
const SuruhForm = lazy(() => import('./screens/SuruhForm'));
const SuruhSummary = lazy(() => import('./screens/SuruhSummary'));
const OrderDetail = lazy(() => import('./screens/OrderDetail'));
const JastiperReceipt = lazy(() => import('./screens/JastiperReceipt'));
const Tracking = lazy(() => import('./screens/Tracking'));
const ChatRoom = lazy(() => import('./screens/ChatRoom'));
const EditProfile = lazy(() => import('./screens/EditProfile'));
const SavedAddresses = lazy(() => import('./screens/SavedAddresses'));
const PaymentMethods = lazy(() => import('./screens/PaymentMethods'));
const HelpCenter = lazy(() => import('./screens/HelpCenter'));
const AboutApp = lazy(() => import('./screens/AboutApp'));
const Notifications = lazy(() => import('./screens/Notifications'));
const Topup = lazy(() => import('./screens/Topup'));
const WithdrawScreen = lazy(() => import('./screens/WithdrawScreen'));
const InspirationsScreen = lazy(() => import('./screens/InspirationsScreen'));
const GigHomeScreen = lazy(() => import('./screens/GigHomeScreen'));
const GigCreateScreen = lazy(() => import('./screens/GigCreateScreen'));
const GigDetailScreen = lazy(() => import('./screens/GigDetailScreen'));
const VoucherScreen = lazy(() => import('./screens/VoucherScreen'));
const GoogleCallback = lazy(() => import('./screens/GoogleCallback'));
const AdminDashboard = lazy(() => import('./screens/AdminDashboard'));
const JastipManageScreen = lazy(() => import('./screens/JastipManageScreen'));
const ConfirmOrder = lazy(() => import('./screens/ConfirmOrder'));
const JastiperStoreScreen = lazy(() => import('./screens/JastiperStoreScreen'));

function SuspenseBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

/** Redirect ke /main bila sudah login di halaman auth (dijaga AuthGuard juga). Preserve tab param. */
function AuthRedirect({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (
      status === 'authenticated' &&
      (location.pathname === '/login' || location.pathname === '/register')
    ) {
      // Preserve tab param if present (e.g., /main?tab=chat)
      const target = location.search ? `/main${location.search}` : '/main';
      navigate(target, { replace: true });
    }
  }, [status, location.pathname, location.search, navigate]);
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            <SuspenseBoundary>
              <SplashScreen />
            </SuspenseBoundary>
          }
        />
        <Route
          path="/location"
          element={
            <SuspenseBoundary>
              <LocationSelection />
            </SuspenseBoundary>
          }
        />
        <Route
          path="/login"
          element={
            <AuthGuard>
              <AuthRedirect>
                <SuspenseBoundary>
                  <LoginScreen />
                </SuspenseBoundary>
              </AuthRedirect>
            </AuthGuard>
          }
        />
        <Route
          path="/register"
          element={
            <AuthGuard>
              <AuthRedirect>
                <SuspenseBoundary>
                  <RegisterScreen />
                </SuspenseBoundary>
              </AuthRedirect>
            </AuthGuard>
          }
        />
        <Route
          path="/main"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <MainShell />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/jastip"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <JastipExploreScreen />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/jastip/form"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <JastipForm />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/jastip/manage"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <JastipManageScreen />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/jastip/summary"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <JastipSummary />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/jastip/success"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <OrderSuccess />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/jastip/delivery-address"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <DeliveryAddress />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/suruh"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <SuruhForm />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/suruh/summary"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <SuruhSummary />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/order/detail"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <OrderDetail />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/order/jastiper-receipt"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <JastiperReceipt />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/order/confirm"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <ConfirmOrder />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/tracking"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <Tracking />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/chat/room"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <ChatRoom />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <EditProfile />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/profile/addresses"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <SavedAddresses />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/profile/payment"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <PaymentMethods />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/profile/help"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <HelpCenter />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/profile/about"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <AboutApp />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/profile/notifications"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <Notifications />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/wallet/topup"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <Topup />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/wallet/withdraw"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <WithdrawScreen />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/inspirations"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <InspirationsScreen />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/gigs"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <GigHomeScreen />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/gigs/create"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <GigCreateScreen />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/gigs/:id"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <GigDetailScreen />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/jastiper/:id"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <JastiperStoreScreen />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/vouchers"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <VoucherScreen />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <SuspenseBoundary>
                <AdminDashboard />
              </SuspenseBoundary>
            </AuthGuard>
          }
        />
        <Route path="/google/callback" element={<GoogleCallback />} />
        <Route
          path="*"
          element={
            <AuthGuard>
              <NotFound />
            </AuthGuard>
          }
        />
      </Routes>
    </HashRouter>
  );
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6">
      <div className="text-6xl">🛵</div>
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <button className="btn-primary max-w-[260px]" onClick={() => navigate('/main')}>
        Kembali ke Beranda
      </button>
    </div>
  );
}
