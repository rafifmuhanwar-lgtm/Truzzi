import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API, errMsg } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { formatRupiah, parseRupiah } from '../lib/format';
import { ArrowLeft, Clock, Ruler, ShieldCheck, Flag, Store, Ticket } from '../components/icons';
import { VoucherPickerSheet } from '../components/VoucherPickerSheet';

interface SuruhData {
  task: string;
  notes: string;
  budget: string;
  pickup: string;
  pickupLat: number;
  pickupLng: number;
  dropoff: string;
  dropoffData?: Record<string, unknown> | null;
}

function roundUp(n: number, nearest: number) {
  const factor = 1 / nearest;
  return Math.ceil(n * factor) / factor;
}
function hitungOngkir(jarakKm: number) {
  const raw = jarakKm * 2000;
  const rounded = roundUp(raw, 500);
  return rounded > 5000 ? rounded : 5000;
}

export default function SuruhSummary() {
  const { state } = useLocation() as { state: SuruhData };
  const navigate = useNavigate();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [danaBelanja] = useState(() => parseRupiah(state?.budget ?? '20000') || 20000);
  const [jarakKm, setJarakKm] = useState(3.0);
  const [estimasiMenit, setEstimasiMenit] = useState(30);
  const [calc, setCalc] = useState(true);
  const [paying, setPaying] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Ambil daftar voucher di dompet
  const { data: claimsData } = useQuery({
    queryKey: ['my-promos'],
    queryFn: () => API.promos.mine(),
    enabled: !!user,
  });
  const myClaims: any[] = claimsData?.claims ?? [];
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  const ongkir = hitungOngkir(jarakKm);
  const biayaLayanan = 2000;
  const totalSebelumDiskon = danaBelanja + ongkir + biayaLayanan;
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
        category: 'suruh'
      });
      if (res.valid) {
        setAppliedPromo(res);
        enqueueSnackbar(res.message, { variant: 'success' });
      }
    } catch (e: any) {
      setAppliedPromo(null);
      setPromoCode('');
      enqueueSnackbar(e.response?.data?.message || errMsg(e, 'Gagal memvalidasi promo'), { variant: 'error' });
    } finally {
      setValidatingPromo(false);
    }
  };

  useEffect(() => {
    async function calcDistance() {
      const pickupLat = Number(state?.pickupLat);
      const pickupLng = Number(state?.pickupLng);
      let dropoffLat = Number.NaN;
      let dropoffLng = Number.NaN;
      if (state?.dropoff) {
        try {
          const { result } = await API.location.geocode(state.dropoff);
          if (result) { dropoffLat = result.lat; dropoffLng = result.lng; }
        } catch { /* ignore */ }
      }
      if (Number.isFinite(pickupLat) && Number.isFinite(pickupLng) && Number.isFinite(dropoffLat) && Number.isFinite(dropoffLng)) {
        try {
          const dist = await API.location.distance({ fromLat: pickupLat, fromLng: pickupLng, toLat: dropoffLat, toLng: dropoffLng });
          setJarakKm(dist.jarakKm);
          setEstimasiMenit(dist.estimasiMenit);
        } catch {
          setJarakKm(3.0);
          setEstimasiMenit(30);
        }
      } else {
        setJarakKm(3.0);
        setEstimasiMenit(30);
      }
      setCalc(false);
    }
    void calcDistance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pay = async () => {
    if (!user) return;
    setPaying(true);
    try {
      const { order } = await API.orders.create({
        orderType: 'suruh',
        title: state.task || 'Tugas Suruh',
        description: state.notes || '',
        danaBelanja,
        pickupAddress: state.pickup,
        deliveryAddress: state.dropoff,
        pickupLat: Number(state.pickupLat),
        pickupLng: Number(state.pickupLng),
        voucherCode: appliedPromo?.code || promoCode, // Add to track
      });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['wallet', user.id] });
      navigate('/jastip/success', { state: { order } });
    } catch (e) {
      const msg = errMsg(e);
      if ((e as { code?: string }).code === 'INSUFFICIENT_BALANCE') {
        enqueueSnackbar(msg, { variant: 'error', autoHideDuration: 6000, action: (key) => (
          <button onClick={() => { closeSnackbar(key); navigate('/wallet/topup'); }} className="text-white font-semibold text-xs underline">Top Up</button>
        ) });
      } else {
        enqueueSnackbar(`Gagal: ${msg}`, { variant: 'error', autoHideDuration: 6000 });
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali"><ArrowLeft className="w-6 h-6 text-ink" /></button>
        <h1 className="font-semibold text-base">Ringkasan Pesanan</h1>
      </header>

      {calc ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-secondary">Menghitung ongkir...</p>
        </div>
      ) : (
        <div className="flex-1 max-w-lg w-full mx-auto px-6 py-5 space-y-4 pb-32">
          <div className="card-pad">
            <h3 className="font-bold text-sm mb-2">Tugas</h3>
            <div className="flex justify-between py-1"><span className="text-sm text-ink-secondary">Tugas</span><span className="text-sm font-medium max-w-[60%] text-right">{state.task || '-'}</span></div>
            <div className="flex justify-between py-1"><span className="text-sm text-ink-secondary">Catatan</span><span className="text-sm font-medium max-w-[55%] text-right">{state.notes || '-'}</span></div>
          </div>

          <div className="card-pad">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-primary/10"><Store className="w-4 h-4 text-primary" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-secondary">Lokasi Penjemputan</p>
                <p className="text-sm font-medium line-clamp-1">{state.pickup || 'Lokasi Penjemputan'}</p>
              </div>
            </div>
            <div className="w-0.5 h-6 bg-border mx-[19px]" />
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-error/10"><Flag className="w-4 h-4 text-error" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-secondary">Lokasi Tujuan</p>
                <p className="text-sm font-medium line-clamp-1">{state.dropoff || 'Lokasi Tujuan'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-divider">
              <span className="inline-flex items-center gap-1.5 text-sm"><Ruler className="w-4 h-4 text-primary" /><span className="font-bold">{jarakKm.toFixed(1)} km</span></span>
              <span className="inline-flex items-center gap-1.5 text-sm"><Clock className="w-4 h-4 text-primary" /><span className="font-bold">~{estimasiMenit} menit</span></span>
            </div>
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
                        <p className="text-sm font-bold text-ink leading-none">{appliedPromo.promoDetails?.title || appliedPromo.message}</p>
                        <p className="text-xs text-success font-semibold mt-1">Diskon: -{formatRupiah(diskonPromo)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-ink leading-none">Pilih Promo / Voucher</p>
                        <p className="text-[11px] text-ink-secondary mt-1">Kamu punya {myClaims.length} voucher tersimpan</p>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold text-primary">
                  {validatingPromo ? 'Mengecek...' : (appliedPromo ? 'Ganti' : 'Pilih')}
                </span>
             </button>
          </div>

          <div className="card-pad border border-primary/20">
            <h3 className="font-bold text-sm mb-2">Rincian Biaya</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-ink-secondary">Biaya Tugas</span><span className="font-semibold">{formatRupiah(danaBelanja)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-secondary">Ongkir</span><span className="font-semibold">{formatRupiah(ongkir)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-secondary">Biaya Layanan</span><span className="font-semibold">{formatRupiah(biayaLayanan)}</span></div>
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
              <ShieldCheck className="w-4 h-4" /> Dana Diamankan oleh Escrow
            </span>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 bg-white px-6 pt-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-lg mx-auto">
          <button className="btn-primary flex items-center justify-center gap-2" onClick={pay} disabled={paying || calc}>
            {paying && <span className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />}
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