import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ArrowLeft, ImageIcon, Send } from 'lucide-react';
import { API, errMsg } from '../lib/api';
import { formatTime, formatRupiah, formatRupiahSpaced } from '../lib/format';
import type { ChatMessage } from '../types';

function getBackUrl(roomId: string): string {
  // Kalau room CS, kembali ke daftar chat (tab=chat)
  if (roomId.startsWith('cs_chat_')) return '/main?tab=chat';
  // Kalau room order, kembali ke daftar chat (tab=chat)
  return '/main?tab=chat';
}

/** Quick replies — persis chat_room_screen.dart jastiper. */
const QUICK_REPLIES = [
  'Sedang dalam perjalanan 🛵',
  'Sudah sampai lokasi jemput 📍',
  'Pesanan sudah diambil ✅',
  'Dalam perjalanan ke tujuan 🚀',
  'Hampir sampai, sekitar 5 menit lagi',
  'Terima kasih! Semoga puas 🙏',
];

const THREE_HOURS = 3 * 60 * 60 * 1000;

export default function ChatRoomScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const roomId = params.get('roomId') ?? '';

  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: roomsData } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: () => API.chat.rooms(),
  });
  const roomObj = roomsData?.rooms?.find((r: any) => r.id === roomId);
  const activeOrderId = (roomObj as any)?.activeOrderId;

  const { data: orderData } = useQuery({
    queryKey: ['order', activeOrderId || roomId],
    queryFn: () => API.orders.get(activeOrderId || roomId),
    enabled: !!(activeOrderId || (!roomId.startsWith('room_') && !roomId.startsWith('cs_'))),
  });
  const order = orderData?.order;

  const { data: msgData } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ['chat-messages', roomId],
    queryFn: () => API.chat.messages(roomId),
    enabled: !!roomId,
    refetchInterval: 4000,
  });
  const messages = msgData?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Invalidate chat-rooms to refresh activeOrderId if a new message (like payment) arrives
    void queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });

    if (roomId) {
      API.chat.read(roomId).catch(() => {});
    }
  }, [messages.length, queryClient, roomId]);

  // Banner expired — persis Flutter: input terkunci 3 jam setelah selesai.
  const expired =
    order?.status === 'completed' &&
    Date.now() - Date.parse(order.updatedAt ?? order.createdAt) >= THREE_HOURS;

  async function send(payload?: string) {
    const body = payload ?? text.trim();
    if (!body || !roomId) return;
    setText('');
    try {
      await API.chat.send(roomId, { text: body, messageType: 'text', senderRole: 'jastiper' });
      void queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal mengirim pesan'), { variant: 'error' });
    }
  }

  async function sendImage(file: File | undefined) {
    if (!file || !roomId) return;
    try {
      const res = await API.upload(file);
      await API.chat.send(roomId, {
        text: '',
        messageType: file.type.startsWith('video') ? 'video' : 'image',
        mediaUrl: res.url,
        senderRole: 'jastiper',
      });
      void queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal mengirim media'), { variant: 'error' });
    }
  }

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    title: '',
    items: '',
    belanja: '',
    jastipFee: '10000',
    ongkir: '8000',
  });
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  async function handleSendInvoice() {
    if (!invoiceForm.items.trim() || !invoiceForm.belanja) {
      enqueueSnackbar('Nama barang dan estimasi belanja wajib diisi', { variant: 'error' });
      return;
    }
    setCreatingInvoice(true);
    try {
      const belanjaNum = Number(invoiceForm.belanja.replace(/[^\d]/g, '')) || 0;
      const ongkirNum = Number(invoiceForm.ongkir.replace(/[^\d]/g, '')) || 0;
      const total = belanjaNum + ongkirNum;

      // Ambil user driver saat ini
      const driverUser = await API.auth.me().catch(() => null);
      const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const invoicePayload = {
        id: invoiceId,
        type: 'jastip_invoice',
        title: invoiceForm.title || 'Tagihan Titipan Jastip',
        items: invoiceForm.items,
        belanja: belanjaNum,
        ongkir: ongkirNum,
        total,
        jastiperId: driverUser?.user?.id || '',
        status: 'pending',
      };

      const messageText = `[INVOICE_JASTIP]${JSON.stringify(invoicePayload)}`;

      await API.chat.send(roomId, {
        text: messageText,
        messageType: 'text',
        senderRole: 'jastiper',
      });

      setShowInvoiceModal(false);
      setInvoiceForm({ title: '', items: '', belanja: '', jastipFee: '', ongkir: '10000' });
      enqueueSnackbar('Tagihan titipan berhasil dikirim ke customer!', { variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal membuat tagihan'), { variant: 'error' });
    } finally {
      setCreatingInvoice(false);
    }
  }

  // Ambil nama lawan bicara (customer) dari pesan terakhir atau order
  const otherMessage = messages.find((m) => !m.isMine);
  const customerName = order?.userName || otherMessage?.senderName || 'Customer';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Modern AppBar */}
      <header className="bg-primary px-4 py-3 sticky top-0 z-20 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(getBackUrl(roomId))}
            className="p-1.5 -ml-1 text-white/90 hover:text-white rounded-full hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Kembali"
          >
            <ArrowLeft size={22} />
          </button>
          {roomObj?.avatarUrl ? (
            <img
              src={roomObj.avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-white/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-base shadow-inner">
              👤
            </div>
          )}
          <div>
            <p className="text-white font-bold text-sm leading-tight">{customerName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-white/80 text-[9.5px] font-medium">
                Customer
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto max-w-lg w-full mx-auto">
        <div className="flex justify-center my-1">
          <span className="px-3 py-0.5 rounded-full bg-black/5 text-[10px] text-ink-secondary font-medium">
            Hari ini
          </span>
        </div>

        {messages.map((m, index) => {
          const isInvoice = m.text?.startsWith('[INVOICE_JASTIP]');
          let invData: any = null;
          if (isInvoice) {
            try {
              invData = JSON.parse(m.text.slice('[INVOICE_JASTIP]'.length));
            } catch {
              invData = null;
            }
          }

          if (isInvoice && invData) {
            const hasPaymentAfter = messages
              .slice(index + 1)
              .some((msg) => msg.text?.includes('[PEMBAYARAN DITERIMA] Tagihan'));
            const isPaid = invData.status === 'paid' || hasPaymentAfter;
            return (
              <div key={m.id} className={`flex ${m.isMine ? 'justify-end' : 'justify-start'} my-2`}>
                <div className="w-[280px] rounded-2xl bg-white border border-gray-200 shadow-sm p-4 text-gray-800">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-900 tracking-tight">
                      Tagihan Dikirim
                    </span>
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
                      {invData.items}
                    </p>
                  </div>

                  {/* Rincian Harga */}
                  <div className="space-y-1.5 py-2.5 border-t border-b border-gray-100 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Belanja</span>
                      <span className="font-medium text-gray-900">
                        {formatRupiah(invData.belanja)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Ongkir</span>
                      <span className="font-medium text-gray-900">
                        {formatRupiah(invData.ongkir)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-dashed border-gray-200 text-xs font-semibold">
                      <span className="text-gray-900">Total Tagihan</span>
                      <span className="text-primary font-bold text-sm">
                        {formatRupiah(invData.total)}
                      </span>
                    </div>
                  </div>

                  {/* Action / Status */}
                  <div className="pt-3">
                    {isPaid ? (
                      <div className="w-full py-2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-xl text-center flex items-center justify-center gap-1.5">
                        <span>✓ Lunas via TruzziPay</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 text-center">
                        Menunggu pembayaran customer
                      </p>
                    )}
                    <div className="flex justify-end pt-1.5">
                      <span className="text-[10px] text-gray-400">{formatTime(m.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] px-3.5 py-2.5 shadow-2xs ${
                  m.isMine
                    ? 'bg-primary text-white rounded-2xl rounded-br-xs'
                    : 'bg-white border border-border/80 text-ink rounded-2xl rounded-bl-xs'
                }`}
              >
                {m.messageType === 'image' && m.mediaUrl ? (
                  <img
                    src={m.mediaUrl}
                    alt="media"
                    className="rounded-xl max-h-56 object-cover mb-1"
                  />
                ) : m.messageType === 'video' && m.mediaUrl ? (
                  <video src={m.mediaUrl} controls className="rounded-xl max-h-56 mb-1" />
                ) : (
                  <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                    {m.text}
                  </p>
                )}
                <p
                  className={`text-right text-[9.5px] mt-1 ${m.isMine ? 'text-white/70' : 'text-ink-secondary'}`}
                >
                  {formatTime(m.timestamp)}
                  {m.isMine && ' ✓✓'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {!expired && (
        <div className="px-4 pb-1.5 flex gap-1.5 overflow-x-auto no-scrollbar max-w-lg w-full mx-auto">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              onClick={() => void send(q)}
              className="shrink-0 px-3 py-1 rounded-full bg-white border border-primary/30 text-primary text-[11px] font-medium hover:bg-primary/5 active:scale-95 transition-all shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      {expired ? (
        <div className="px-4 pb-6 pt-2 bg-white border-t border-divider max-w-lg w-full mx-auto">
          <p className="text-center text-small text-warning font-medium py-3">
            Sesi chat telah berakhir (melewati batas 3 jam setelah pesanan selesai).
          </p>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-2.5 bg-white border-t border-border sticky bottom-0 z-10 max-w-lg w-full mx-auto shadow-lg">
          {/* Action Bar for Jastiper - Clean full width pill */}
          <div className="mb-2.5 flex items-center justify-between bg-primary/5 border border-primary/15 rounded-2xl px-3.5 py-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🛍️</span>
              <div>
                <p className="text-xs font-bold text-ink leading-tight">Buat Tagihan Titipan</p>
                <p className="text-[10px] text-ink-secondary">
                  Kirim rincian harga hasil negosiasi
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowInvoiceModal(true)}
              className="text-xs font-bold text-white bg-primary hover:bg-primary/90 px-3.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all"
            >
              Buat Invoice
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => void sendImage(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-2.5 text-ink-secondary hover:text-primary rounded-full hover:bg-surface transition-colors"
              aria-label="Kirim media"
            >
              <ImageIcon size={22} />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-1 bg-[#F3F4F6] border border-border/80 rounded-full px-4 py-2.5 text-xs text-ink placeholder:text-ink-secondary focus:outline-none focus:border-primary focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="p-2.5 bg-primary text-white rounded-full disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all"
              aria-label="Kirim"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Modal Buat Tagihan / Invoice Titipan */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-0">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div>
                <h3 className="font-bold text-base text-ink">Buat Tagihan Titipan (Invoice)</h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Kirim rincian belanja hasil negosiasi ke customer
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="text-xs font-bold text-ink-secondary hover:text-ink px-2.5 py-1 rounded-lg hover:bg-surface"
              >
                Batal
              </button>
            </div>

            {/* Form Input */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-ink flex items-center gap-1">
                  <span>Rincian Barang Titipan</span>
                  <span className="text-primary">*</span>
                </label>
                <textarea
                  value={invoiceForm.items}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, items: e.target.value })}
                  placeholder="Cth: Bolen Pisang Kartika Sari Keju (2 box)"
                  rows={2}
                  className="w-full bg-[#F9FAFB] border border-border rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary focus:bg-white mt-1 resize-none leading-relaxed"
                />
              </div>

              {/* Rincian Biaya (2 Kolom: Estimasi Belanja & Ongkir) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label
                    className="text-[11px] font-bold text-ink truncate mb-1"
                    title="Estimasi Belanja"
                  >
                    Total Belanja (IDR) <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink-secondary">
                      Rp
                    </span>
                    <input
                      value={
                        invoiceForm.belanja
                          ? Number(invoiceForm.belanja.replace(/\D/g, '')).toLocaleString('id-ID')
                          : ''
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setInvoiceForm({ ...invoiceForm, belanja: raw });
                      }}
                      placeholder="80.000"
                      type="text"
                      className="w-full bg-[#F9FAFB] border border-border rounded-xl pl-7 pr-2.5 py-2 text-xs text-ink font-semibold focus:outline-none focus:border-primary focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label
                    className="text-[11px] font-bold text-ink truncate mb-1"
                    title="Ongkir Pengantaran"
                  >
                    Ongkir Flat (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink-secondary">
                      Rp
                    </span>
                    <input
                      value={
                        invoiceForm.ongkir
                          ? Number(invoiceForm.ongkir.replace(/\D/g, '')).toLocaleString('id-ID')
                          : ''
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setInvoiceForm({ ...invoiceForm, ongkir: raw });
                      }}
                      placeholder="10.000"
                      type="text"
                      className="w-full bg-[#F9FAFB] border border-border rounded-xl pl-7 pr-2.5 py-2 text-xs text-ink focus:outline-none focus:border-primary focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Box Total Tagihan */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-ink-secondary font-medium">Total Ditagihkan:</span>
                </div>
                <strong className="text-primary font-extrabold text-base">
                  {formatRupiahSpaced(
                    (Number(invoiceForm.belanja) || 0) + (Number(invoiceForm.ongkir) || 0),
                  )}
                </strong>
              </div>
            </div>

            {/* Tombol Kirim Tagihan */}
            <button
              type="button"
              onClick={handleSendInvoice}
              disabled={creatingInvoice}
              className="btn-primary w-full !h-12 text-xs font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              {creatingInvoice ? 'Mengirim Tagihan...' : 'Kirim Tagihan ke Chat Customer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
