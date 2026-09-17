// Tipe data driver app — menjiplak JastiperModel/OrderModel/WithdrawalModel Flutter jastiper_app.

export type OrderStatus = 'ongoing' | 'completed' | 'cancelled' | 'waiting_confirmation';
export type OrderType = 'jastip' | 'suruh';
export type KebijakanLebih = 'jangan_lebih' | 'boleh_lebih';

/** Profil jastiper gabungan (User + Jastiper) dari GET /api/jastiper/me. */
export interface JastiperProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  selectedArea?: string | null;
  isOnline: boolean;
  isActive: boolean;
  kycVerified: boolean;
  kycKtpUrl?: string | null;
  role: 'jastiper';
  /** Apakah jastiper ini juga terdaftar sebagai jastiper? */
  isJastiper?: boolean;
}

export interface JastipProduct {
  id: string;
  jastiperId: string;
  title: string;
  description?: string | null;
  price: number;
  category?: string | null;
  images?: string[];
  published: boolean;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface JastiperProfile {
  id: string;
  jastiperId: string;
  name: string;
  bio?: string | null;
  photoUrl?: string | null;
  coverUrl?: string | null;
  area?: string | null;
  category?: string | null;
  feeEstimate?: string | null;
  flatOngkir?: number;
  verified: boolean;
  rating: number;
  totalOrders: number;
  isJastipActive: boolean;
  openTripTitle?: string | null;
  openTripDestination?: string | null;
  openTripSchedule?: string | null;
  openTripClosing?: string | null;
  products?: JastipProduct[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  $id?: string;
  userId: string;
  serviceName: string;
  title: string;
  description: string;
  status: OrderStatus;
  statusText: string;
  createdAt: string;
  updatedAt?: string | null;
  totalAmount: number;
  totalPrice?: number;
  jastiperId?: string;
  jastiperName?: string;
  jastiperPhone?: string;
  jastiperAvatar?: string;
  pickupAddress: string;
  deliveryAddress: string;
  chatRoomId?: string | null;
  danaBelanja: number;
  ongkir: number;
  biayaLayanan: number;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  jastiperLat?: number | null;
  jastiperLng?: number | null;
  jarakKm?: number | null;
  estimasiWaktu?: string | null;
  escrowId?: string | null;
  totalBelanjaStruk?: number | null;
  strukImageUrl?: string | null;
  deliveryProofUrl?: string | null;
  refundCustomer?: number | null;
  kebijakanLebih: KebijakanLebih;
  pendingApproval: boolean;
  requestedTopup?: number | null;
  voucherCode?: string | null;
  voucherDiscount?: number | null;
  orderType: OrderType;
  /** Alias legacy Appwrite (order_model.dart fallback key). */
  type?: string;
}

export interface Withdrawal {
  id: string;
  $id?: string;
  jastiperId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Earnings {
  hariIni: number;
  bulanIni: number;
  total: number;
  saldo: number;
}

export interface Settlement {
  refundCustomer: number;
  paymentToJastiper: number;
  platformFee: number;
  reimbursementBelanja: number;
  ongkirPaid: number;
  isOverBudget: boolean;
  invalid: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  text: string;
  timestamp: string;
  isMine: boolean;
  status: 'sent' | 'delivered' | 'read';
  senderRole: 'customer' | 'jastiper' | 'support' | string;
  senderId?: string;
  senderName?: string;
  messageType: 'text' | 'image' | 'video';
  mediaUrl?: string | null;
}

export interface ChatRoom {
  id: string;
  senderName: string;
  avatarUrl: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  lastSeenText: string;
  serviceType: string;
  isSupport: boolean;
  orderStatus: string;
  orderUpdatedAt?: string | null;
  orderTitle?: string;
  lastMessageSenderId?: string;
}

export interface AppNotification {
  id: string;
  $id?: string;
  userId: string;
  category: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  routeName?: string;
  routeExtra?: string;
}

export interface DistanceResult {
  jarakKm: number;
  estimasiMenit: number;
  routePoints: { lat: number; lng: number }[];
}

