import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import { API } from '../lib/api';
import { formatRupiah, formatRelativeTime, orderTypeLabel, haversineKm } from '../lib/format';
import type { Order } from '../types';

type Tab = 'aktif' | 'riwayat';
type JenisFilter = 'Semua' | 'Jastip' | 'Suruh';
type SortOption = 'Terbaru' | 'Terdekat' | 'Termahal' | 'Termurah';

const JENIS_OPTIONS: JenisFilter[] = ['Semua', 'Jastip', 'Suruh'];
const SORT_OPTIONS: SortOption[] = ['Terbaru', 'Terdekat', 'Termahal', 'Termurah'];

/** Daftar pesanan driver (Aktif & Riwayat) — trip pesanan langsung ditugaskan ke jastiper. */
export default function Orders() {
  const [tab, setTab] = useState<Tab>('aktif');
  const [jenis, setJenis] = useState<JenisFilter>('Semua');
  const [sort, setSort] = useState<SortOption>('Terbaru');

  const {
    data: mineData,
    refetch: refetchMine,
    isFetching: fetchingMine,
  } = useQuery<{ orders: Order[] }>({
    queryKey: ['jastiper-mine'],
    queryFn: () => API.jastiper.myOrders(),
    refetchInterval: 4000,
  });

  const mine = mineData?.orders ?? [];
  const aktif = mine.filter((o) => o.status === 'ongoing' || o.status === 'waiting_confirmation');
  const riwayat = mine.filter((o) => o.status === 'completed' || o.status === 'cancelled');

  const list = tab === 'aktif' ? aktif : riwayat;

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  // Saat pilih 'Terdekat': minta posisi GPS sekali
  useEffect(() => {
    if (sort !== 'Terdekat' || userPos) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
    );
  }, [sort, userPos]);

  const filtered = useMemo(() => {
    let arr = [...list];
    if (jenis !== 'Semua') {
      const t = jenis === 'Jastip' ? 'jastip' : 'suruh';
      arr = arr.filter((o) => (o.orderType ?? o.type) === t);
    }
    if (sort === 'Termahal') arr.sort((a, b) => b.totalAmount - a.totalAmount);
    else if (sort === 'Termurah') arr.sort((a, b) => a.totalAmount - b.totalAmount);
    else if (sort === 'Terdekat' && userPos) {
      const dist = (o: Order) =>
        o.pickupLat != null && o.pickupLng != null
          ? haversineKm(userPos.lat, userPos.lng, o.pickupLat, o.pickupLng)
          : Infinity;
      arr.sort((a, b) => dist(a) - dist(b));
    }
    return arr;
  }, [list, jenis, sort, userPos]);

  function refresh() {
    void refetchMine();
  }

  return (
    <div className="px-5 py-5">
      <h1 className="text-display font-bold">Daftar Pesanan</h1>

      {/* Tabs + counts */}
      <div className="flex gap-2 mt-4">
        <TabBtn
          label={`Aktif (${aktif.length})`}
          active={tab === 'aktif'}
          onClick={() => setTab('aktif')}
        />
        <TabBtn
          label={`Riwayat (${riwayat.length})`}
          active={tab === 'riwayat'}
          onClick={() => setTab('riwayat')}
        />
      </div>

      {/* Filter row */}
      <div className="flex gap-2 mt-3">
        <select
          value={jenis}
          onChange={(e) => setJenis(e.target.value as JenisFilter)}
          className="input-base !py-2 text-small flex-1"
        >
          <option disabled>Jenis Pesanan</option>
          {JENIS_OPTIONS.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="input-base !py-2 text-small flex-1"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              Urut: {s}
            </option>
          ))}
        </select>
        <button
          onClick={refresh}
          className="card w-10 flex items-center justify-center"
          aria-label="Refresh"
        >
          <RefreshCw
            size={16}
            className={fetchingMine ? 'animate-spin text-primary' : 'text-ink-secondary'}
          />
        </button>
      </div>

      <div className="mt-4 space-y-3 pb-6">
        {filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          filtered.map((o) => <OrderCard key={o.$id ?? o.id} order={o} />)
        )}
      </div>
    </div>
  );
}

function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-9 rounded-full text-small font-semibold transition-colors ${
        active ? 'bg-primary text-white' : 'bg-white border border-border text-ink-secondary'
      }`}
    >
      {label}
    </button>
  );
}

function OrderCard({ order }: { order: Order }) {
  const navigate = useNavigate();
  const id = order.$id ?? order.id;
  const type = order.orderType ?? order.type;
  return (
    <div className="card-pad space-y-2">
      <div className="flex items-center justify-between">
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold text-white ${type === 'jastip' ? 'bg-success' : 'bg-warning'}`}
        >
          {orderTypeLabel(type)}
        </span>
        <span className="text-small text-ink-secondary">{formatRelativeTime(order.createdAt)}</span>
      </div>
      {order.status === 'waiting_confirmation' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-amber-700">
            Menunggu Konfirmasi Customer
          </span>
        </div>
      )}

      <p className="font-bold text-base text-ink">{order.title}</p>
      {order.description && (
        <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed whitespace-pre-line">
          {order.description}
        </p>
      )}

      {type !== 'jastip' ? (
        <p className="text-body2 pt-0.5">
          <span className="font-semibold">Tarif:</span> {formatRupiah(order.totalAmount)}
        </p>
      ) : (
        <p className="text-body2 pt-0.5">
          <span className="font-semibold">Belanja:</span> {formatRupiah(order.danaBelanja || 0)}
          {Number(order.ongkir) > 0 && (
            <span className="text-ink-secondary"> (Ongkir: {formatRupiah(order.ongkir)})</span>
          )}
        </p>
      )}

      <div className="space-y-1 text-small text-ink-secondary">
        {type !== 'jastip' && (
          <p className="flex gap-1.5">
            <MapPin size={14} className="shrink-0 mt-0.5 text-primary" /> Pickup:{' '}
            {order.pickupAddress}
          </p>
        )}
        <p className="flex gap-1.5">
          <Navigation size={14} className="shrink-0 mt-0.5 text-success" /> Antar ke:{' '}
          {order.deliveryAddress}
        </p>
      </div>

      <button onClick={() => navigate(`/order/detail?id=${id}`)} className="btn-outline !h-11 mt-1">
        Lihat Detail
      </button>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const map = {
    aktif: ['Belum ada pesanan aktif', 'Pesanan masuk dari trip kamu akan tampil di sini'],
    riwayat: ['Belum ada riwayat pesanan', 'Pesanan yang telah selesai akan muncul di sini'],
  } as const;
  const [title, sub] = map[tab];
  return (
    <div className="py-16 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="text-small text-ink-secondary mt-1">{sub}</p>
    </div>
  );
}
