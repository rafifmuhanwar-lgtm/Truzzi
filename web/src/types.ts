// Tipe data — menjiplak model Flutter (order_model, chat, wallet, etc).

export type OrderStatus = 'pending' | 'processing' | 'bought' | 'shipping' | 'completed' | 'cancelled' | 'waiting_confirmation' | 'ongoing';
export type OrderType = 'jastip' | 'suruh';
export type KebijakanLebih = 'jangan_lebih' | 'boleh_lebih';
export type JastiperStatus = 'online' | 'offline' | 'busy';
export type JastipProductStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  selectedArea?: string | null;
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
  jastiperRating?: number | null;
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
  reviewRating?: number | null;
}



export interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  fullAddress: string;
  details?: string | null;
  isPrimary: boolean;
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
  recipientId?: string;
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

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  totalTopUp: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopUpTransaction {
  id?: string;
  $id?: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  pakasirOrderId?: string | null;
  status: 'pending' | 'success' | 'failed' | 'completed';
  createdAt: string;
  completedAt?: string | null;
}

export interface PakasirPayment {
  // Pakasir legacy
  payment_number?: string;
  total_payment?: number;
  expired_at?: string;
  // BuatQris
  transaction_id?: string;
  qr_url?: string;
  qris_image?: string;
  payment_url?: string;
  total_amount?: number;
  amount?: number;
  status?: string;
  is_test?: boolean;
  demo?: boolean;
  message?: string;
}

export interface Escrow {
  id?: string;
  $id?: string;
  orderId: string;
  userId: string;
  amount: number;
  status: 'held' | 'released' | 'refunded';
  serviceType?: string;
  createdAt: string;
  releasedAt?: string | null;
  danaBelanja: number;
  ongkir: number;
  biayaLayanan: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  category: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  routeName?: string;
  routeExtra?: string;
}


export interface JastipProduct {
  id: string;
  jastiperId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images?: string[];
  status: JastipProductStatus;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Jastiper {
  id: string;
  name: string;
  phone?: string;
  photoUrl?: string;
  coverUrl?: string;
  area?: string;
  rating?: number;
  totalOrders?: number;
  services?: string[];
  status?: JastiperStatus;
  verified?: boolean;
  distanceKm?: number;
  bio?: string;
  openTripTitle?: string;
  openTripDestination?: string;
  openTripSchedule?: string;
  openTripClosing?: string;
  category?: string;
  feeEstimate?: string;
  flatOngkir?: number;
  products?: JastipProduct[];
}



export interface FeeConfig {
  platformFeeFlat: number;
  platformFeePercent: number;
  cashbackPercent: number;
  minPlatformFee: number;
  maxCashback: number;
}






export interface PickupLocation {
  lat: number;
  lng: number;
  address: string;
}

/** Data yang dibawa dari form ke summary (sama dengan `extra` di router Flutter). */


export type GigStatus = 'open' | 'in_progress' | 'submitted' | 'completed' | 'cancelled';
export type GigCategory = 'digital' | 'fisik';

export interface Gig {
  id: string;
  $id?: string;
  posterId: string;
  posterName?: string;
  workerId?: string | null;
  workerName?: string | null;
  title: string;
  description: string;
  category: GigCategory;
  budget: number;
  biayaLayanan: number;
  status: GigStatus;
  location?: string | null;
  deadline?: string | null;
  proofImageUrl?: string | null;
  proofNote?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  escrowId?: string | null;
}

export interface GigReview {
  id: string;
  $id?: string;
  gigId: string;
  reviewerId: string;
  reviewerName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
