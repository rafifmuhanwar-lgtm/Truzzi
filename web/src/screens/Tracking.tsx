import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { API } from '../lib/api';

import type { Order } from '../types';
import {
  ArrowLeft,
  Check,
  Phone,
  MapPin,
  Bike,
  ShoppingBag,
  User as UserIcon,
} from '../components/icons';
import { getStep } from './OrderDetail';

export default function Tracking() {
  const { state } = useLocation() as { state?: { order?: Order } };
  const [params] = useSearchParams();
  const orderIdFromUrl = params.get('id') || params.get('orderId') || '';
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(state?.order ?? null);
  const [loading, setLoading] = useState<boolean>(!state?.order && !!orderIdFromUrl);
  const [jastiper, setJastiper] = useState<{
    name?: string;
    phone?: string;
    photoUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (!order && orderIdFromUrl) {
      setLoading(true);
      API.orders
        .get(orderIdFromUrl)
        .then((res) => setOrder(res.order))
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }
  }, [order, orderIdFromUrl]);

  // Polling 3 detik realtime
  useEffect(() => {
    if (!order) return;
    const t = setInterval(async () => {
      try {
        const { order: fresh } = await API.orders.get(order.id);
        if (fresh) setOrder(fresh);
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  useEffect(() => {
    if (order?.jastiperId) {
      API.orders
        .jastiper(order.id)
        .then(({ jastiper: c }) => setJastiper(c))
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.jastiperId]);

  if (loading)
    return <p className="p-6 text-center text-sm text-ink-secondary">Memuat pesanan...</p>;
  if (!order)
    return <p className="p-6 text-center text-sm text-ink-secondary">Pesanan tidak ditemukan</p>;

  const currentStep = getStep(order);
  const hasJastiper = !!order.jastiperId;
  const statusLabel =
    order.status === 'completed'
      ? 'Pesanan telah selesai ✓'
      : order.statusText ||
        (hasJastiper
          ? 'Jastiper sedang menuju lokasi belanja'
          : 'Sedang mencari jastiper terdekat...');

  const steps = JASTIP_STEPS;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali">
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="font-semibold text-base">Lacak Pesanan Jastip</h1>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-5 py-4 space-y-4 pb-10">
        {/* Jastiper card */}
        <div className={`card-pad ${hasJastiper ? 'border-primary/30' : ''}`}>
          <div className="flex items-center gap-3">
            {order.jastiperAvatar || jastiper?.photoUrl ? (
              <img
                src={order.jastiperAvatar || jastiper?.photoUrl}
                alt=""
                className="w-[52px] h-[52px] rounded-full object-cover"
              />
            ) : (
              <span className="w-[52px] h-[52px] rounded-full bg-primary/10 flex items-center justify-center">
                {hasJastiper ? (
                  <Bike className="w-6 h-6 text-primary" />
                ) : (
                  <UserIcon className="w-6 h-6 text-primary" />
                )}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold">
                {jastiper?.name || order.jastiperName || 'Mencari Jastiper...'}
              </p>
              <p className="text-xs text-ink-secondary mt-0.5">{statusLabel}</p>
              {jastiper?.phone && (
                <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {jastiper.phone}
                </p>
              )}
            </div>
            {order.status === 'completed' ? (
              <span className="px-2 py-1 rounded-lg bg-success/10 text-success text-xs font-bold">
                Selesai ✓
              </span>
            ) : (
              <span className="px-2 py-1 rounded-lg bg-primary/8 text-primary text-xs font-bold">
                {order.estimasiWaktu ?? '~30 min'}
              </span>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="card-pad">
          <h3 className="font-bold text-sm mb-3">Status Pengiriman</h3>
          {steps.map((s, i) => {
            const done = currentStep >= i;
            const current = currentStep === i;
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex gap-3 relative pb-4 last:pb-0">
                {i < steps.length - 1 && (
                  <div
                    className={`absolute left-4 top-8 bottom-0 w-0.5 ${done ? 'bg-primary' : 'bg-border'}`}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    done
                      ? 'bg-primary text-white'
                      : current
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-surface border border-border text-ink-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`text-xs font-bold ${done ? 'text-ink' : 'text-ink-secondary'}`}>
                    {s.title}
                  </p>
                  <p className="text-[11px] text-ink-secondary mt-0.5">{s.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bukti Foto Barang (jika sudah diupload jastiper) */}
        {(order.strukImageUrl || order.deliveryProofUrl) && (
          <div className="card-pad border-primary/20 space-y-3">
            <h3 className="font-bold text-sm text-ink">Foto Bukti Barang &amp; Pengiriman</h3>
            {order.strukImageUrl && (
              <div>
                <p className="text-xs text-ink-secondary mb-1.5 font-medium">
                  Foto Barang yang Dibeli Jastiper
                </p>
                <img
                  src={order.strukImageUrl}
                  alt="Barang dibeli"
                  className="w-full max-h-56 object-cover rounded-xl border border-border shadow-xs"
                />
              </div>
            )}
            {order.deliveryProofUrl && (
              <div>
                <p className="text-xs text-ink-secondary mb-1.5 font-medium">
                  Bukti Penerimaan Barang
                </p>
                <img
                  src={order.deliveryProofUrl}
                  alt="Bukti Pengiriman"
                  className="w-full max-h-56 object-cover rounded-xl border border-border shadow-xs"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const JASTIP_STEPS = [
  { title: 'Pesanan Dibuat', sub: 'Pesanan berhasil dibuat & diteruskan ke jastiper', icon: Check },
  {
    title: 'Jastiper Menuju Toko',
    sub: 'Jastiper sedang dalam perjalanan ke lokasi pembelian',
    icon: Bike,
  },
  {
    title: 'Sedang Dibelikan Jastiper',
    sub: 'Jastiper membelikan barang pesanan kamu di toko',
    icon: ShoppingBag,
  },
  {
    title: 'Dalam Perjalanan ke Customer',
    sub: 'Jastiper menuju lokasi pengantaran kamu',
    icon: Bike,
  },
  { title: 'Pesanan Selesai', sub: 'Barang telah diterima dengan baik', icon: MapPin },
];
