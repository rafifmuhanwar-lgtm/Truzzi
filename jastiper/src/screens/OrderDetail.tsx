import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ArrowLeft, Navigation, MessageCircle } from 'lucide-react';
import { API, errMsg } from '../lib/api';
import { formatRupiahSpaced } from '../lib/format';
import { useAuthStore } from '../store/auth';
import type { Order } from '../types';

export default function OrderDetail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthStore();
  const orderId = params.get('id') ?? '';

  const { data, refetch } = useQuery<{ order: Order }>({
    queryKey: ['order', orderId],
    queryFn: () => API.orders.get(orderId),
    enabled: !!orderId,
    refetchInterval: 3000,
  });
  const order = data?.order;
  const [accepting, setAccepting] = useState(false);

  // Live location saat order aktif milik jastiper ini
  useEffect(() => {
    if (!order || order.jastiperId === '' || order.status !== 'ongoing') return;
    if (!order.jastiperId) return; // belum diterima siapa pun
    let stop = false;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (stop) return;
        void API.jastiper.sendLocation(order.$id ?? order.id, pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000 },
    );
    return () => {
      stop = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [order?.jastiperId, order?.status]);

  const isMine = !!order?.jastiperId && order.jastiperId === user?.id;
  const takenByOther = !!order?.jastiperId && order.jastiperId !== user?.id;

  const actionInfo = useMemo(() => {
    if (!order || order.status !== 'ongoing') return null;
    const st = order.statusText ?? '';

    if (
      st === 'Menuju Lokasi' ||
      st === 'Dana Diamankan — Mencari Jastiper' ||
      st === 'Jastiper Menuju Lokasi Belanja' ||
      st.toLowerCase().includes('menuju lokasi')
    ) {
      return {
        label: 'Sampai di Lokasi Belanja',
        action: async () => {
          await API.jastiper.updateStatus(order.$id ?? order.id, 'Sampai di Lokasi');
          enqueueSnackbar('Status diperbarui: Sampai di Lokasi', { variant: 'success' });
          await refetch();
        },
      };
    }

    if (st === 'Sampai di Lokasi') {
      return {
        label: 'Foto Bukti Barang Dibeli',
        action: () => navigate(`/order/pickup-proof?id=${order.$id ?? order.id}`),
      };
    }

    if (st === 'Barang Dibeli' || st === 'Barang Dibeli / Tugas Selesai') {
      return {
        label: 'Antar ke Tujuan',
        action: async () => {
          await API.jastiper.updateStatus(order.$id ?? order.id, 'Dalam Perjalanan ke Tujuan');
          enqueueSnackbar('Status diperbarui: Dalam Perjalanan ke Tujuan', { variant: 'success' });
          await refetch();
        },
      };
    }

    if (
      st === 'Dalam Perjalanan ke Tujuan' ||
      st.startsWith('Pengiriman dengan no resi') ||
      st.toLowerCase().includes('resi') ||
      st.toLowerCase().includes('pengiriman')
    ) {
      return {
        label: 'Selesaikan Pesanan (Bukti Penerimaan)',
        action: () => navigate(`/order/delivery-proof?id=${order.$id ?? order.id}`),
      };
    }

    return {
      label: 'Selesaikan Pesanan (Bukti Penerimaan)',
      action: () => navigate(`/order/delivery-proof?id=${order.$id ?? order.id}`),
    };
  }, [order, navigate, enqueueSnackbar, refetch]);

  async function accept() {
    if (!order) return;
    setAccepting(true);
    try {
      await API.jastiper.acceptOrder(order.$id ?? order.id);
      enqueueSnackbar('✅ Pesanan berhasil diterima!', { variant: 'success' });
      await refetch();
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal menerima pesanan'), { variant: 'error' });
    } finally {
      setAccepting(false);
    }
  }

  function openNavigation() {
    if (!order) return;
    const target =
      (order.statusText ?? '') === 'Menuju Lokasi'
        ? { lat: order.pickupLat, lng: order.pickupLng }
        : { lat: order.dropoffLat, lng: order.dropoffLng };
    if (target.lat == null || target.lng == null) {
      enqueueSnackbar('Koordinat tidak tersedia', { variant: 'warning' });
      return;
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=driving`, '_blank');
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-ink-secondary">Memuat pesanan...</p>
      </div>
    );
  }

  const type = order.orderType ?? order.type;
  return (
    <div className="min-h-screen bg-background pb-6">
      {/* AppBar */}
      <div className="bg-primary px-4 pt-4 pb-5 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white rounded-full hover:bg-white/10">
            <ArrowLeft size={22} />
          </button>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold text-white ${type === 'jastip' ? 'bg-success' : 'bg-warning'}`}>
            {type === 'jastip' ? 'Jastip' : 'Suruh'}
          </span>
          <h1 className="text-white font-semibold truncate">{order.title}</h1>
        </div>
      </div>

      <div className="px-5 py-5 space-y-4 max-w-lg mx-auto">
        {/* Tombol Navigasi Cepat Google Maps */}
        <div className="card-pad bg-gradient-to-r from-primary to-primary-light text-white space-y-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase opacity-90">RUTE &amp; NAVIGASI</span>
            <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Google Maps</span>
          </div>
          <p className="text-xs opacity-90 leading-relaxed">
            Gunakan navigasi Google Maps untuk petunjuk arah real-time ke lokasi {(order.statusText ?? '') === 'Menuju Lokasi' ? 'Pengambilan' : 'Tujuan'}.
          </p>
          <button
            onClick={openNavigation}
            className="w-full h-11 rounded-xl bg-white text-primary font-bold text-xs hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Navigation size={16} /> Buka Navigasi ke {(order.statusText ?? '') === 'Menuju Lokasi' ? 'Pickup' : 'Tujuan'}
          </button>
        </div>

        {/* Alamat */}
        <div className="card-pad space-y-3">
          {type !== 'jastip' && (
            <div>
              <p className="text-small font-semibold text-success">Alamat Pickup</p>
              <p className="text-body2 mt-0.5">{order.pickupAddress || '-'}</p>
            </div>
          )}
          <div className={type !== 'jastip' ? 'border-t border-divider pt-3' : ''}>
            <p className="text-small font-semibold text-error">Alamat Tujuan</p>
            <p className="text-body2 mt-0.5">{order.deliveryAddress || '-'}</p>
          </div>
          <div className="border-t border-divider pt-3">
            <p className="text-small font-semibold text-ink">Deskripsi Pesanan</p>
            <p className="text-body2 mt-0.5 whitespace-pre-line">{order.description || 'Tidak ada deskripsi'}</p>
          </div>
        </div>

        {/* Rincian biaya */}
        <div className="card-pad space-y-2">
          <p className="font-semibold text-body">Rincian Biaya</p>
          <Row label="Dana Belanja" value={formatRupiahSpaced(order.danaBelanja)} />
          <Row label="Ongkir" value={formatRupiahSpaced(order.ongkir)} />
          <Row label="Biaya Layanan" value={formatRupiahSpaced(order.biayaLayanan)} />
          <div className="border-t border-divider pt-2">
            <Row label="Total" value={formatRupiahSpaced(order.totalAmount)} bold />
          </div>
        </div>

        {/* Aksi */}
        {!isMine && !takenByOther && order.status === 'ongoing' ? (
          <button onClick={() => void accept()} disabled={accepting} className="btn-primary">
            {accepting ? 'Memproses...' : 'Terima Pesanan'}
          </button>
        ) : isMine && order.status === 'ongoing' ? (
          <div className="space-y-3">
            <p className="text-small text-ink-secondary">Langkah Selanjutnya</p>
            <p className="text-small text-ink-secondary">Status saat ini: {order.statusText}</p>
            {actionInfo && (
              <button onClick={() => void actionInfo.action()} className="btn-primary">
                {actionInfo.label}
              </button>
            )}
            <button
              onClick={() => navigate(`/chat/room?roomId=${order.$id ?? order.id}`)}
              className="btn-outline flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} /> Chat dengan Customer
            </button>
          </div>
        ) : (
          <div className="rounded-btn bg-success/10 border border-success/30 px-4 py-3 text-center">
            <p className="font-semibold text-success">Pesanan Telah Selesai</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-body2 ${bold ? 'font-bold' : 'text-ink-secondary'}`}>{label}</span>
      <span className={`${bold ? 'font-bold text-primary' : 'font-semibold'} text-body2`}>{value}</span>
    </div>
  );
}

