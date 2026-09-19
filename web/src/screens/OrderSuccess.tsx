import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Store, MapPin } from '../components/icons';
import { formatRupiah } from '../lib/format';
import type { Order } from '../types';

/** Sukses buat order — /jastip/success & /suruh digabung (kirim state.order). */
export default function OrderSuccess() {
  const { state } = useLocation() as { state: { order?: Order } };
  const navigate = useNavigate();
  const order = state?.order;
  const isCustomRequest =
    order?.serviceName?.toLowerCase().includes('jastip') &&
    !order?.jastiperId &&
    !order?.danaBelanja;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-8">
        <span className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </span>
        <h1 className="text-2xl font-bold mt-5 text-center font-sans">
          {isCustomRequest ? 'Permintaan Titip Berhasil Diposting!' : 'Pesanan Berhasil Dibuat!'}
        </h1>
        <p className="text-sm text-ink-secondary mt-2 text-center leading-relaxed">
          {isCustomRequest ? (
            <>
              Permintaan titip barang kamu sudah terkirim ke jastiper terdekat.
              <br />
              Jastiper akan menghubungi via Chat untuk konfirmasi barang &amp; tagihan.
            </>
          ) : (
            <>
              Dana Anda telah diamankan oleh sistem escrow Truzzi.
              <br />
              Jastiper/Jastiper akan segera memproses pesanan Anda.
            </>
          )}
        </p>

        {order && (
          <div className="card-pad w-full mt-7">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold">
                {isCustomRequest ? 'Request Titip Bebas' : order.serviceName}
              </span>
              <span className="text-xs text-ink-secondary font-semibold">{order.id}</span>
            </div>
            <p className="font-bold text-base text-ink mt-3">{order.title}</p>
            {order.description && (
              <p className="text-xs text-ink-secondary mt-1 line-clamp-2 leading-relaxed whitespace-pre-line">
                {order.description}
              </p>
            )}
            <div className="h-px bg-divider my-3" />
            {order.pickupAddress && (
              <div className="flex items-center gap-2 text-sm">
                <Store className="w-4 h-4 text-primary shrink-0" />
                <span className="text-ink-secondary line-clamp-1">{order.pickupAddress}</span>
              </div>
            )}
            {order.pickupAddress && <div className="w-0.5 h-4 bg-border ml-[7px] my-1" />}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-error shrink-0" />
              <span className="text-ink-secondary line-clamp-1">{order.deliveryAddress}</span>
            </div>

            {!isCustomRequest && Number(order.totalAmount) > 0 && (
              <>
                <div className="h-px bg-divider my-3" />
                <div className="flex justify-between">
                  <span className="text-sm text-ink-secondary">Total Dibayar</span>
                  <span className="font-bold text-primary">{formatRupiah(order.totalAmount)}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white px-6 pt-4 pb-6 border-t border-divider">
        <div className="max-w-lg mx-auto space-y-2">
          <button
            className="btn-primary"
            onClick={() =>
              order ? navigate('/tracking', { state: { order } }) : navigate('/main')
            }
          >
            Lihat Status
          </button>
          <button className="btn-outline" onClick={() => navigate('/main')}>
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
