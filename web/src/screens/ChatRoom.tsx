import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';
import { API } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { formatTime, formatRupiah } from '../lib/format';
import type { ChatMessage, ChatRoom as ChatRoomT, Order } from '../types';
import {
  ArrowLeft,
  Send,
  PlusCircle,
  Check,
  CheckCheck,
  Camera,
  ImageIcon,
  Video,
  Phone,
  ReceiptText,
  Truck,
  XCircle,
} from '../components/icons';

function getBackUrl(room: ChatRoomT | undefined): string {
  if (!room) return '/main?tab=chat';
  return '/main?tab=chat';
}

const DEFAULT_CS_ROOM: ChatRoomT = {
  id: 'room_cs',
  senderName: 'Customer Service Truzzi',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  lastMessage: 'Halo! Ada yang bisa kami bantu?',
  lastMessageTime: new Date().toISOString(),
  unreadCount: 0,
  isOnline: true,
  lastSeenText: 'Aktif 24 Jam',
  serviceType: 'Bantuan & Kendala',
  isSupport: true,
  orderStatus: 'processing',
  orderUpdatedAt: null,
};

const QUICK_REPLIES = [
  'Posisi di mana mas?',
  'Sesuai pesanan ya 👍',
  'Tolong hati-hati di jalan ya',
  'Terima kasih banyak kak 🙏',
];

export default function ChatRoom() {
  const { state } = useLocation() as { state?: { room?: ChatRoomT } };
  const [params] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  let roomIdFromUrl = params.get('roomId') || params.get('id') || '';
  const targetUserId = params.get('targetUserId');
  if (targetUserId && user) {
    roomIdFromUrl =
      user.id < targetUserId
        ? `room_${user.id}_${targetUserId}`
        : `room_${targetUserId}_${user.id}`;
  }

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();

  const [room, setRoom] = useState<ChatRoomT | null>(state?.room ?? null);
  const [loadingRoom, setLoadingRoom] = useState<boolean>(!state?.room && !!roomIdFromUrl);
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachKind, setAttachKind] = useState<'image' | 'video'>('image');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!room && roomIdFromUrl) {
      if (roomIdFromUrl === 'room_cs') {
        setRoom(DEFAULT_CS_ROOM);
        setLoadingRoom(false);
        return;
      }
      setLoadingRoom(true);
      API.chat
        .rooms()
        .then(async (res) => {
          const found = (res.rooms as ChatRoomT[])?.find((r) => r.id === roomIdFromUrl);
          if (found) {
            setRoom(found);
          } else {
            if (targetUserId && user) {
              let senderName = 'Pengguna';
              let avatarUrl = '';
              let lastSeenText = 'Aktif';
              let lastMessage = 'Mulai obrolan';
              let orderTitle = '';

              try {
                // Try fetching as jastiper
                const jRes = await API.jastipers.get(targetUserId);
                const j = jRes?.jastiper;
                if (j) {
                  senderName = `${j.name} (Jastiper)`;
                  avatarUrl = j.photoUrl || '';
                  lastSeenText = j.area || 'Jastiper Terverifikasi';
                  lastMessage = j.openTripTitle || j.bio || 'Mulai obrolan';
                  orderTitle = j.openTripTitle || '';
                }
              } catch {
                // If not a jastiper, maybe it's a customer, just use defaults
              }

              setRoom({
                id: roomIdFromUrl,
                recipientId: targetUserId,
                senderName,
                avatarUrl,
                lastMessage,
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0,
                isOnline: true,
                lastSeenText,
                serviceType: 'Chat',
                isSupport: false,
                orderStatus: 'pre-order',
                orderUpdatedAt: null,
                orderTitle,
              });
              return;
            } else {
              // Backward compatibility for old orderId links
              try {
                const orderRes = await API.orders.get(roomIdFromUrl);
                const o = orderRes.order;
                if (o) {
                  setOrderDetail(o);
                  setRoom({
                    id: o.id,
                    recipientId: o.jastiperId || '',
                    senderName: o.jastiperName ? `${o.jastiperName} · Jastiper` : 'Jastiper Truzzi',
                    avatarUrl: o.jastiperAvatar || '',
                    lastMessage: o.description || o.title || 'Chat dengan jastiper',
                    lastMessageTime: o.createdAt,
                    unreadCount: 0,
                    isOnline: !!o.jastiperName,
                    lastSeenText: 'Jastiper aktif',
                    serviceType: o.serviceName,
                    isSupport: false,
                    orderStatus: o.status,
                    orderUpdatedAt: o.updatedAt ?? null,
                    orderTitle: o.title ?? '',
                  });
                }
              } catch {
                // ignore
              }
            }
          }
        })
        .catch(() => undefined)
        .finally(() => setLoadingRoom(false));
    }
  }, [room, roomIdFromUrl]);

  // Load Order detail for context card if room is an order
  useEffect(() => {
    if (room && !room.isSupport && !room.id.startsWith('cs_')) {
      const orderId =
        (room as any).activeOrderId ||
        (room.id.startsWith('room_') || room.id.startsWith('gig_') ? '' : room.id);
      if (orderId && !orderDetail) {
        API.orders
          .get(orderId)
          .then((res) => {
            if (res.order) setOrderDetail(res.order);
          })
          .catch(() => undefined);
      }
    }
  }, [room, orderDetail]);

  const isCS = room?.id === 'room_cs' || room?.isSupport;
  const expired =
    room?.orderStatus === 'completed' &&
    room?.orderUpdatedAt != null &&
    Date.now() - Date.parse(room.orderUpdatedAt) >= 3 * 60 * 60 * 1000;

  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { messages: msgs } = await API.chat.messages(room.id);
        if (!cancelled) setMessages(msgs ?? []);
      } catch {
        /* ignore */
      }
    };
    void load();
    const t = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [room?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (room?.id) {
      API.chat.read(room.id).catch(() => {});
    }
  }, [room?.id, messages.length]);

  const send = async (raw?: string, type?: 'text' | 'image' | 'video', mediaUrl?: string) => {
    const msg = raw ?? text;
    if (!msg.trim() && type === 'text') return;
    if (!user) return;
    setSending(true);

    const optimistic: ChatMessage = {
      id: `msg_${Date.now()}`,
      roomId: room!.id,
      text: msg.trim(),
      timestamp: new Date().toISOString(),
      isMine: true,
      status: 'sent',
      senderRole: 'customer',
      senderId: user.id,
      senderName: user.name,
      messageType: type ?? 'text',
      mediaUrl: mediaUrl ?? null,
    };
    setMessages((m) => [...m, optimistic]);
    setText('');

    try {
      const { message: saved } = await API.chat.send(room!.id, {
        text: msg.trim(),
        messageType: type ?? 'text',
        mediaUrl: mediaUrl ?? null,
        senderRole: 'customer',
      });
      setMessages((m) =>
        m.map((x) => (x.id === optimistic.id ? { ...x, ...saved, isMine: true } : x)),
      );

      // Auto-reply CS
      if (isCS) {
        setTimeout(async () => {
          try {
            const { message: botMsg } = await API.chat.csBot(msg.trim());
            setMessages((m) => (m.some((x) => x.id === botMsg.id) ? m : [...m, botMsg]));
            qc.invalidateQueries({ queryKey: ['chat-rooms'] });
          } catch {
            /* ignore */
          }
        }, 1500);
      }
      qc.invalidateQueries({ queryKey: ['chat-rooms'] });
    } catch {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      enqueueSnackbar('Gagal mengirim pesan', { variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleGenerateResi = async () => {
    if (!orderDetail) return;
    setActionLoading(true);
    try {
      const res = await API.chat.generateResi(orderDetail.id);
      enqueueSnackbar(`Nomor resi dibuat: ${res.resi}`, { variant: 'success' });
      await send(`Nomor Resi Pengiriman: ${res.resi}`);
      setOrderDetail(res.order);
    } catch {
      enqueueSnackbar('Gagal membuat resi', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderDetail) return;
    if (!window.confirm('Batalkan pesanan ini? Dana akan dikembalikan ke saldo TruzziPay.')) return;
    setActionLoading(true);
    try {
      const res = await API.chat.cancelOrder(orderDetail.id);
      enqueueSnackbar('Pesanan berhasil dibatalkan', { variant: 'info' });
      await send('[SISTEM] Pesanan telah dibatalkan oleh pengguna.');
      setOrderDetail(res.order);
      qc.invalidateQueries({ queryKey: ['orders'] });
    } catch {
      enqueueSnackbar('Gagal membatalkan pesanan', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTakeOrder = async () => {
    if (!orderDetail) return;
    setActionLoading(true);
    try {
      const res = await API.chat.takeOrder(orderDetail.id);
      enqueueSnackbar('Pesanan berhasil diambil!', { variant: 'success' });
      await send(`[SISTEM] Pesanan telah diambil oleh jastiper.`);
      setOrderDetail(res.order);
      qc.invalidateQueries({ queryKey: ['orders'] });
    } catch {
      enqueueSnackbar('Gagal mengambil pesanan', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const sendMedia = async (type: 'image' | 'video') => {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    try {
      const res = await API.upload(f);
      await send('', type, res.url);
    } catch {
      enqueueSnackbar('Gagal mengunggah media', { variant: 'error' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
      setAttachOpen(false);
    }
  };

  const handlePayInvoice = (inv: any) => {
    if (!inv) return;
    const jastiperIdentifier =
      inv?.jastiperId ||
      (room?.id?.startsWith('room_') ? room?.recipientId : room?.id) ||
      roomIdFromUrl ||
      '';
    navigate('/jastip/summary', {
      state: {
        item: inv.items,
        budget: String(inv.belanja || 0),
        ongkirCustom: Number(inv.ongkir || 0),
        totalCustom: Number(inv.total || 0),
        isDirectInvoice: true,
        invoiceId: inv.id || `inv_${inv.total}_${inv.jastiperId}`,
        jastiperId: jastiperIdentifier,
        notes: `[Tagihan Hasil Chat]: ${inv.title || 'Pesanan Khusus'}`,
        pickup: room?.senderName ? `Jastiper: ${room.senderName}` : 'Lokasi Jastip Disepakati',
        pickupLat: -6.2383,
        pickupLng: 106.9756,
        dropoff: '',
        dropoffData: null,
      },
    });
  };

  if (loadingRoom)
    return <p className="p-6 text-center text-sm text-ink-secondary">Memuat obrolan...</p>;
  if (!room)
    return <p className="p-6 text-center text-sm text-ink-secondary">Obrolan tidak ditemukan</p>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary px-4 py-3 flex items-center gap-3 sticky top-0 z-10 text-white shadow-nav">
        <button onClick={() => navigate(getBackUrl(room))} aria-label="Kembali">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        {room.avatarUrl ? (
          <img
            src={room.avatarUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-white/30"
          />
        ) : (
          <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            👤
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] truncate">{room.senderName}</p>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-white/80 text-[9.5px] font-medium">
              {room.serviceType || 'Jastiper'}
            </span>
          </div>
        </div>
        <button
          onClick={() => enqueueSnackbar(`Memanggil ${room.senderName}...`, { variant: 'info' })}
          aria-label="Telepon"
        >
          <Phone className="w-5 h-5" />
        </button>
      </header>

      {/* Order Context Card */}
      {orderDetail && (
        <div className="bg-surface border-b border-border px-4 py-2.5 shadow-2xs">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ReceiptText className="w-4 h-4 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink truncate">
                  {orderDetail.title || orderDetail.serviceName}
                </p>
                <p className="text-[10px] text-ink-secondary truncate">
                  Status:{' '}
                  <span className="font-semibold text-primary">
                    {orderDetail.statusText || orderDetail.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => navigate('/order/detail', { state: { order: orderDetail } })}
                className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold"
              >
                Detail
              </button>
              {orderDetail.status === 'processing' && !orderDetail.jastiperId && (
                <button
                  disabled={actionLoading}
                  onClick={handleTakeOrder}
                  className="px-2 py-1 rounded-lg bg-success text-white text-[11px] font-bold"
                >
                  Ambil
                </button>
              )}
              {orderDetail.status !== 'completed' && orderDetail.status !== 'cancelled' && (
                <button
                  disabled={actionLoading}
                  onClick={handleGenerateResi}
                  className="px-2 py-1 rounded-lg bg-surface border border-border text-ink text-[11px] font-medium"
                  title="Generate Resi"
                >
                  <Truck className="w-3.5 h-3.5 inline" />
                </button>
              )}
              {orderDetail.status !== 'completed' && orderDetail.status !== 'cancelled' && (
                <button
                  disabled={actionLoading}
                  onClick={handleCancelOrder}
                  className="px-2 py-1 rounded-lg bg-error/10 text-error text-[11px] font-medium"
                  title="Batalkan"
                >
                  <XCircle className="w-3.5 h-3.5 inline" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Waiting confirmation banner */}
      {orderDetail && orderDetail.status === 'waiting_confirmation' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl">📦</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-900">
                  Jastiper telah menyelesaikan pesanan
                </p>
                <p className="text-[10px] text-amber-700">
                  Konfirmasi penerimaan barang & berikan ulasan
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/order/confirm?id=${orderDetail.$id || orderDetail.id}`)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold shrink-0 hover:bg-amber-700 transition-colors"
            >
              Konfirmasi
            </button>
          </div>
        </div>
      )}

      {/* Date header */}
      <div className="flex justify-center py-2.5">
        <span className="px-3 py-1 rounded-full bg-black/5 text-[11px] text-ink-secondary">
          Hari ini
        </span>
      </div>

      {expired ? (
        <div className="mx-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          Sesi chat telah berakhir (melewati batas 3 jam setelah pesanan selesai).
        </div>
      ) : (
        <>
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5 max-w-lg w-full mx-auto">
            {messages.map((m) => (
              <Bubble key={m.id} msg={m} onPayInvoice={handlePayInvoice} />
            ))}
            {sending && <p className="text-xs text-ink-secondary">Mengirim...</p>}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {!isCS && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar max-w-lg w-full mx-auto">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-surface border border-border text-xs text-ink active:scale-95 transition-transform"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input field */}
          <div className="sticky bottom-0 bg-surface border-t border-divider px-4 pt-3 pb-5">
            <div className="flex items-end gap-2 max-w-lg w-full mx-auto">
              <button
                onClick={() => setAttachOpen((v) => !v)}
                className="text-primary mb-1"
                aria-label="Lampirkan Foto/Video"
              >
                <PlusCircle className="w-7 h-7" />
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Tulis pesan..."
                className="flex-1 rounded-3xl border border-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => void send()}
                disabled={!text.trim()}
                className="w-11 h-11 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity"
                aria-label="Kirim"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Attach sheet */}
      {attachOpen && (
        <div
          className="fixed inset-0 z-[1500] bg-black/40 flex items-end justify-center"
          onClick={() => setAttachOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Lampirkan Media &amp; Bukti</h3>
            <p className="text-[13px] text-ink-secondary mt-1">
              Kirim foto atau video ke jastiper/CS
            </p>
            <div className="flex justify-around mt-5">
              <AttachBtn
                label="Kamera"
                color="#7C3AED"
                icon={<Camera className="w-7 h-7" />}
                onClick={() => {
                  fileRef.current?.click();
                  setAttachKind('image');
                }}
              />
              <AttachBtn
                label="Galeri Foto"
                color="#2563EB"
                icon={<ImageIcon className="w-7 h-7" />}
                onClick={() => {
                  fileRef.current?.click();
                  setAttachKind('image');
                }}
              />
              <AttachBtn
                label="Video"
                color="#EA580C"
                icon={<Video className="w-7 h-7" />}
                onClick={() => {
                  fileRef.current?.click();
                  setAttachKind('video');
                }}
              />
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={attachKind === 'video' ? 'video/*' : 'image/*'}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void sendMedia(attachKind);
        }}
      />
    </div>
  );
}

function AttachBtn({
  label,
  color,
  icon,
  onClick,
}: {
  label: string;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <span
        className="rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}1A`, width: 60, height: 60, color }}
      >
        {icon}
      </span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function Bubble({ msg, onPayInvoice }: { msg: ChatMessage; onPayInvoice: (inv: any) => void }) {
  const mine = msg.isMine;

  // Cek apakah pesan berupa tagihan invoice jastip khusus
  const isInvoice = msg.text?.startsWith('[INVOICE_JASTIP]');
  let invoiceData: any = null;
  if (isInvoice) {
    try {
      invoiceData = JSON.parse(msg.text.slice('[INVOICE_JASTIP]'.length));
    } catch {
      invoiceData = null;
    }
  }

  if (isInvoice && invoiceData) {
    const invId = invoiceData.id || `inv_${invoiceData.total}_${invoiceData.jastiperId}`;
    let isPaid = invoiceData.status === 'paid';
    try {
      const paidList = JSON.parse(localStorage.getItem('truzzi_paid_invoices') || '[]');
      if (paidList.includes(invId)) isPaid = true;
    } catch {
      /* ignore */
    }

    return (
      <div className={`flex ${mine ? 'justify-end' : 'justify-start'} my-2`}>
        <div className="w-[280px] rounded-2xl bg-white border border-gray-200 shadow-sm p-4 text-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-900 tracking-tight">
                Tagihan Pesanan
              </span>
            </div>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {isPaid ? 'Sudah Dibayar' : 'Menunggu Bayar'}
            </span>
          </div>

          {/* Rincian Barang */}
          <div className="py-2.5">
            <p className="text-xs text-gray-500 font-normal">Barang yang dibeli:</p>
            <p className="text-xs font-medium text-gray-900 mt-0.5 leading-snug whitespace-pre-line">
              {invoiceData.items}
            </p>
          </div>

          {/* Rincian Harga */}
          <div className="space-y-1.5 py-2.5 border-t border-b border-gray-100 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Belanja</span>
              <span className="font-medium text-gray-900">{formatRupiah(invoiceData.belanja)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Ongkir</span>
              <span className="font-medium text-gray-900">{formatRupiah(invoiceData.ongkir)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-dashed border-gray-200 text-xs font-semibold">
              <span className="text-gray-900">Total Tagihan</span>
              <span className="text-primary font-bold text-sm">
                {formatRupiah(invoiceData.total)}
              </span>
            </div>
          </div>

          {/* Action / Status */}
          <div className="pt-3">
            {isPaid ? (
              <div className="w-full py-2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-xl text-center flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Lunas via TruzziPay</span>
              </div>
            ) : !mine ? (
              <button
                onClick={() => onPayInvoice(invoiceData)}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl shadow-xs active:scale-[0.98] transition-all text-center"
              >
                Bayar Sekarang
              </button>
            ) : (
              <p className="text-[11px] text-gray-400 text-center">Menunggu pembayaran customer</p>
            )}
            <div className="flex justify-end pt-1.5">
              <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[75%] px-[14px] py-2.5 mb-1"
        style={{
          backgroundColor: mine ? '#7F1D3A' : '#ffffff',
          color: mine ? '#ffffff' : '#1E1E1E',
          borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          border: mine ? 'none' : '1px solid #E0E0E0',
        }}
      >
        {msg.messageType === 'image' && msg.mediaUrl && (
          <img src={msg.mediaUrl} alt="media" className="w-56 h-40 object-cover rounded-xl mb-1" />
        )}
        {msg.messageType === 'video' && msg.mediaUrl && (
          <div className="w-56 h-36 rounded-xl bg-black/85 flex items-center justify-center mb-1 relative">
            <PlayIcon />
            <span className="absolute bottom-1.5 right-2 text-[10px] text-white">Play Video</span>
          </div>
        )}
        {msg.text && <p className="text-[14px] leading-relaxed">{msg.text}</p>}
        <div className={`flex items-center justify-end gap-1 mt-1`}>
          <span className={`text-[10.5px] ${mine ? 'text-white/70' : 'text-ink-secondary'}`}>
            {formatTime(msg.timestamp)}
          </span>
          {mine &&
            (msg.status === 'sent' ? (
              <Check className="w-3 h-3 text-white/70" />
            ) : (
              <CheckCheck
                className={`w-3 h-3 ${msg.status === 'read' ? 'text-sky-300' : 'text-white/70'}`}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="#ffffff">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
