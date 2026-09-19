import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API, errMsg } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { formatRupiah, parseRupiah } from '../lib/format';
import { ArrowLeft, ShieldCheck, MapPin, Ticket, ChevronRight } from '../components/icons';
import { VoucherPickerSheet } from '../components/VoucherPickerSheet';
import { consumeAddressPicked } from '../lib/address-picker';

interface SummaryData {
  item: string;
  notes: string;
  tripTitle?: string;
  budget: string;
  pickup: string;
  pickupLat: number;
  pickupLng: number;
  dropoff: string;
  dropoffData?: Record<string, unknown> | null;
  jastipFee?: number;
  ongkirCustom?: number;
  totalCustom?: number;
  isDirectInvoice?: boolean;
  invoiceId?: string;
  jastiperId?: string;
}

function hitungBiayaLayanan(_ongkir: number) {
  return 2000;
}

/** Ringkasan + pembayaran Jastip — perhitungan identik Flutter / Direct Invoice. */
export default function JastipSummary() {
  const { state } = useLocation() as { state: SummaryData };
  const navigate = useNavigate();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [danaBelanja] = useState(() => parseRupiah(state?.budget ?? '0'));
  const [deliveryAddress, setDeliveryAddress] = useState(state?.dropoff || '');
  const [selectedAddressObj, setSelectedAddressObj] = useState<any>(state?.dropoffData || null);
  const [calc, setCalc] = useState(!state?.isDirectInvoice);
  const [paying, setPaying] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Ambil daftar alamat tersimpan customer jika ada
  const { data: addrData } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => API.addresses.list().then((r) => r.addresses as any[]),
    enabled: !!user,
  });

  // Ambil daftar voucher di dompet
  const { data: claimsData } = useQuery({
    queryKey: ['my-promos'],
    queryFn: () => API.promos.mine(),
    enabled: !!user,
  });
  const myClaims: any[] = claimsData?.claims ?? [];
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  useEffect(() => {
    const p = consumeAddressPicked();
    if (p) {
      setDeliveryAddress(p.address);
      setSelectedAddressObj(p.data);
      return;
    }

    if (!deliveryAddress && addrData?.length) {
      const primary = addrData.find((a: any) => a.isPrimary) || addrData[0];
      if (primary) {
        setDeliveryAddress(primary.fullAddress);
        setSelectedAddressObj(primary);
      }
    }
  }, [addrData, deliveryAddress]);

  // Jika invoice hasil chat atau order via trip jastiper: gunakan ongkir flat jastiper
  const isInvoice = !!state?.isDirectInvoice;
  const feeJastip = isInvoice ? Number(state?.jastipFee || 0) : 0;
  const ongkir =
    state?.ongkirCustom !== undefined ? Number(state.ongkirCustom) : isInvoice ? 0 : 10000;
  const biayaLayanan = hitungBiayaLayanan(ongkir);
  const totalSebelumDiskon = isInvoice
    ? (Number(state?.totalCustom) || danaBelanja + feeJastip + ongkir) + biayaLayanan
    : danaBelanja + ongkir + biayaLayanan;
  const diskonPromo = appliedPromo?.discountAmount || 0;
  const total = totalSebelumDiskon - diskonPromo;

  const handleApplyPromo = async (code: string) => {
    if (!code) return;
    setValidatingPromo(true);
    setPromoCode(code);
    try {
      const res = await API.promos.validate({
        code: code,
        cartAmount: totalSebelumDiskon,
        category: 'jastip',
      });
      if (res.valid) {
        setAppliedPromo(res);
        enqueueSnackbar(res.message, { variant: 'success' });
      }
    } catch (e: any) {
      setAppliedPromo(null);
      setPromoCode('');
      enqueueSnackbar(e.response?.data?.message || errMsg(e, 'Gagal memvalidasi promo'), {
        variant: 'error',
      });
    } finally {
      setValidatingPromo(false);
    }
  };

  useEffect(() => {
    setCalc(false);
  }, []);

  const pay = async () => {
    if (!user) return;
    if (!deliveryAddress.trim()) {
      enqueueSnackbar('Mohon isi alamat pengantaran pesanan', { variant: 'warning' });
      return;
    }
    setPaying(true);
    try {
      const orderTitle = state.tripTitle ? state.tripTitle : state.item || 'Barang Jastip';
      const orderDescription = state.item
        ? state.notes
          ? `${state.item}\n\nCatatan: ${state.notes}`
          : state.item
        : state.notes || '';

      const { order } = await API.orders.create({
        orderType: 'jastip',
        title: orderTitle,
        description: orderDescription,
        danaBelanja,
        ongkir,
        biayaLayanan: biayaLayanan,
        totalAmount: total,
        totalPrice: total,
        jastiperId: state.jastiperId || state.jastiperId || '',
        pickupAddress: state.pickup,
        deliveryAddress: deliveryAddress.trim(),
        pickupLat: Number(state.pickupLat) || -6.2383,
        pickupLng: Number(state.pickupLng) || 106.9756,
        dropoffLat: selectedAddressObj?.lat || state.dropoffData?.lat,
        dropoffLng: selectedAddressObj?.lng || state.dropoffData?.lng,
        voucherCode: appliedPromo?.code || promoCode, // Add to track
      });

      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['wallet', user.id] });

      const jId = state.jastiperId || '';
      const unifiedRoomId =
        user && user.id < jId ? `room_${user.id}_${jId}` : `room_${jId}_${user?.id}`;

      // Jika pembayaran berasal dari invoice chat, tandai invoice sebagai paid
      if (state.invoiceId) {
        try {
          const paidList = JSON.parse(localStorage.getItem('truzzi_paid_invoices') || '[]');
          if (!paidList.includes(state.invoiceId)) {
            paidList.push(state.invoiceId);
            localStorage.setItem('truzzi_paid_invoices', JSON.stringify(paidList));
          }
          // Kirim konfirmasi otomatis ke chat
          if (unifiedRoomId) {
            void API.chat
              .send(unifiedRoomId, {
                text: `✅ [PEMBAYARAN DITERIMA] Tagihan "${state.item || 'Titipan Jastip'}" sebesar ${formatRupiah(total)} telah berhasil dibayar via TruzziPay.`,
                messageType: 'text',
                senderRole: 'customer',
              })
              .catch(() => {});
          }
        } catch {
          /* ignore */
        }
      }

      // Send automated first message to create chat room for jastiper
      if (order && !state.invoiceId && unifiedRoomId) {
        try {
          await API.chat.send(unifiedRoomId, {
            text: `Halo, saya telah membuat pesanan jastip: ${orderTitle}. Mohon segera diproses ya!`,
            messageType: 'text',
            senderRole: 'customer',
          });
        } catch {
          /* ignore */
        }
      }

      navigate(`/chat/room?roomId=${unifiedRoomId}`, {
        state: {
          room: {
            id: unifiedRoomId,
            recipientId: order.jastiperId || '',
            senderName: order.jastiperName || 'Jastiper Truzzi',
            avatarUrl: order.jastiperAvatar || '',
            lastMessage: state.invoiceId
              ? `✅ [PEMBAYARAN DITERIMA] Tagihan`
              : `Halo, saya telah membuat pesanan jastip...`,
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0,
            isOnline: true,
            lastSeenText: 'Aktif',
            serviceType: 'Jastip',
            isSupport: false,
            orderStatus: order.status,
            orderUpdatedAt: new Date().toISOString(),
            orderTitle: orderTitle,
            activeOrderId: order.id,
          },
        },
        replace: true,
      });
    } catch (e) {
      const msg = errMsg(e);
      if ((e as { code?: string }).code === 'INSUFFICIENT_BALANCE') {
        enqueueSnackbar(msg, {
          variant: 'error',
          autoHideDuration: 6000,
          action: (key) => (
            <button
              onClick={() => {
                closeSnackbar(key);
                navigate('/wallet/topup');
              }}
              className="text-white font-semibold text-xs underline"
            >
              Top Up
            </button>
          ),
        });
      } else {
        enqueueSnackbar(`Gagal memproses pembayaran: ${msg}`, {
          variant: 'error',
          autoHideDuration: 6000,
        });
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali">
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="font-semibold text-base">Ringkasan Pesanan</h1>
      </header>

      {calc ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-secondary">Memuat ringkasan tagihan...</p>
        </div>
      ) : (
        <div className="flex-1 max-w-lg w-full mx-auto px-6 py-5 space-y-4 pb-32">
          {/* Detail pesanan */}
          <div className="card-pad">
            <h3 className="font-bold text-sm mb-2">Detail Pesanan</h3>
            <div className="flex justify-between py-1">
              <span className="text-sm text-ink-secondary">Item</span>
              <span className="text-sm font-medium">{state?.item || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-sm text-ink-secondary">Catatan</span>
              <span className="text-sm font-medium max-w-[55%] text-right">
                {state?.notes || '-'}
              </span>
            </div>
          </div>

          {/* Alamat Pengantaran (Shopee Style) */}
          <div
            onClick={() => navigate('/jastip/delivery-address')}
            className="bg-white rounded-2xl border border-slate-200 p-4 cursor-pointer active:bg-slate-50 transition-colors shadow-sm"
          >
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink-secondary mb-1">
                  Alamat Pengantaran Customer *
                </p>
                {selectedAddressObj ? (
                  <>
                    <p className="font-bold text-sm text-ink mb-1">
                      {selectedAddressObj.recipientName || selectedAddressObj.label}
                    </p>
                    <p className="text-[13px] text-ink-secondary leading-relaxed">
                      {selectedAddressObj.fullAddress}{' '}
                      {selectedAddressObj.details && `(${selectedAddressObj.details})`}
                    </p>
                    {(selectedAddressObj.village ||
                      selectedAddressObj.district ||
                      selectedAddressObj.city ||
                      selectedAddressObj.province) && (
                      <p className="text-[13px] text-ink-secondary uppercase mt-0.5">
                        {[
                          selectedAddressObj.village,
                          selectedAddressObj.district,
                          selectedAddressObj.city,
                          selectedAddressObj.province,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                        {selectedAddressObj.postalCode
                          ? `, ID ${selectedAddressObj.postalCode}`
                          : ''}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-ink-secondary mt-1">
                    {deliveryAddress || 'Pilih Alamat Pengantaran...'}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-ink-secondary shrink-0 self-center" />
            </div>
            {/* Shopee-style striped border at the bottom */}
            <div
              className="h-1 w-full mt-4 rounded-full"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #ef4444 0, #ef4444 10px, transparent 10px, transparent 20px, #3b82f6 20px, #3b82f6 30px, transparent 30px, transparent 40px)',
              }}
            />
          </div>

          {/* Promo Code Section */}
          <div className="card-pad border border-slate-200">
            <h3 className="font-bold text-sm mb-2">Makin Hemat Pakai Promo!</h3>
            <button
              onClick={() => setIsVoucherOpen(true)}
              disabled={validatingPromo}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-[#F9FAFB] active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Ticket className="w-5 h-5" />
                </span>
                <div className="text-left">
                  {appliedPromo ? (
                    <>
                      <p className="text-sm font-bold text-ink leading-none">
                        {appliedPromo.promoDetails?.title || appliedPromo.message}
                      </p>
                      <p className="text-xs text-success font-semibold mt-1">
                        Diskon: -{formatRupiah(diskonPromo)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-ink leading-none">
                        Pilih Promo / Voucher
                      </p>
                      <p className="text-[11px] text-ink-secondary mt-1">
                        Kamu punya {myClaims.length} voucher tersimpan
                      </p>
                    </>
                  )}
                </div>
              </div>
              <span className="text-xs font-bold text-primary">
                {validatingPromo ? 'Mengecek...' : appliedPromo ? 'Ganti' : 'Pilih'}
              </span>
            </button>
          </div>

          {/* Rincian biaya */}
          <div className="card-pad border border-primary/20">
            <h3 className="font-bold text-sm mb-2 flex items-center justify-between">
              <span>Rincian Biaya</span>
              {isInvoice && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  HASIL DEAL CHAT
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {danaBelanja > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-secondary">Dana Belanja</span>
                  <span className="font-semibold">{formatRupiah(danaBelanja)}</span>
                </div>
              )}
              {isInvoice && feeJastip > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-secondary">Jasa Titip (Fee)</span>
                  <span className="font-semibold">{formatRupiah(feeJastip)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">Ongkir Pengantaran</span>
                <span className="font-semibold">{formatRupiah(ongkir)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">Biaya Layanan</span>
                <span className="font-semibold">{formatRupiah(biayaLayanan)}</span>
              </div>
              {appliedPromo && diskonPromo > 0 && (
                <div className="flex justify-between text-sm text-success font-bold">
                  <span>Diskon Promo ({promoCode})</span>
                  <span>-{formatRupiah(diskonPromo)}</span>
                </div>
              )}
              <div className="h-px bg-divider" />
              <div className="flex justify-between items-center">
                <span className="font-bold">Total Dibayar</span>
                <span className="font-bold text-primary text-lg">{formatRupiah(total)}</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> Dana Belanja &amp; Fee Diamankan oleh Escrow
            </span>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-6 pt-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-lg mx-auto">
          <button
            className="btn-primary flex items-center justify-center gap-2"
            onClick={pay}
            disabled={paying || calc}
          >
            {paying && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
            )}
            {paying ? 'Memproses...' : `Bayar Sekarang - ${formatRupiah(total)}`}
          </button>
        </div>
      </div>

      {/* Voucher Sheet */}
      <VoucherPickerSheet
        isOpen={isVoucherOpen}
        onClose={() => setIsVoucherOpen(false)}
        claims={myClaims}
        onSelect={handleApplyPromo}
        selectedCode={promoCode}
      />
    </div>
  );
}
