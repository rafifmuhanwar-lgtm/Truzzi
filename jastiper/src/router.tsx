import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { DriverGuard } from './components/DriverGuard';
import { FullScreenLoader } from './components/Loading';

// Auth & verifikasi
const Splash = lazy(() => import('./screens/Splash'));
const Login = lazy(() => import('./screens/Login'));
const Register = lazy(() => import('./screens/Register'));
const Kyc = lazy(() => import('./screens/Kyc'));
const KycPending = lazy(() => import('./screens/KycPending'));

// Main shell
const Main = lazy(() => import('./screens/Main'));

// Order flow
const OrderDetail = lazy(() => import('./screens/OrderDetail'));
const Receipt = lazy(() => import('./screens/Receipt'));
const DeliveryProof = lazy(() => import('./screens/DeliveryProof'));
const PickupProof = lazy(() => import('./screens/PickupProof'));

// Earnings
const Withdrawal = lazy(() => import('./screens/Withdrawal'));
const TransactionHistory = lazy(() => import('./screens/TransactionHistory'));

// Chat & notifikasi
const ChatRoomScreen = lazy(() => import('./screens/ChatRoom'));
const CsChat = lazy(() => import('./screens/CsChat'));
const Notifications = lazy(() => import('./screens/Notifications'));

// Profil lainnya
const EditProfile = lazy(() => import('./screens/EditProfile'));
const Settings = lazy(() => import('./screens/Settings'));
const HelpCenter = lazy(() => import('./screens/HelpCenter'));

// Jastip mode
const JastipRegister = lazy(() => import('./screens/JastipRegister'));

function Suspend({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<FullScreenLoader />}>{children}</Suspense>;
}

export default function AppRouter() {
  return (
    <HashRouter>
      <DriverGuard>
        <Suspend>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/kyc" element={<Kyc />} />
            <Route path="/kyc-pending" element={<KycPending />} />

            <Route path="/main" element={<Main />} />

            {/* Order flow */}
            <Route path="/order/detail" element={<OrderDetail />} />
            <Route path="/order/receipt" element={<Receipt />} />
            <Route path="/order/pickup-proof" element={<PickupProof />} />
            <Route path="/order/delivery-proof" element={<DeliveryProof />} />

            {/* Sub-profil */}
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/profile/withdrawal" element={<Withdrawal />} />
            <Route path="/profile/transactions" element={<TransactionHistory />} />
            <Route path="/profile/settings" element={<Settings />} />
            <Route path="/profile/help" element={<HelpCenter />} />

            {/* Jastip mode */}
            <Route path="/jastip/register" element={<JastipRegister />} />

            {/* Chat & notifikasi */}
            <Route path="/chat/room" element={<ChatRoomScreen />} />
            <Route path="/cs-chat" element={<CsChat />} />
            <Route path="/notifications" element={<Notifications />} />

            <Route path="*" element={<FullScreenLoader text="Halaman tidak ditemukan" />} />
          </Routes>
        </Suspend>
      </DriverGuard>
    </HashRouter>
  );
}
