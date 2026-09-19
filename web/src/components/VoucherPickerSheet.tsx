import { Sparkles, Ticket } from 'lucide-react';

interface VoucherPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  claims: any[];
  onSelect: (code: string) => void;
  selectedCode?: string | null;
}

export function VoucherPickerSheet({
  isOpen,
  onClose,
  claims,
  onSelect,
  selectedCode,
}: VoucherPickerSheetProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1500] bg-black/40 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-background w-full max-w-lg rounded-t-3xl overflow-hidden animate-[slideUp_0.25s_ease-out] flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        <div className="flex justify-center pt-3 shrink-0 bg-white">
          <span className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="p-4 bg-white border-b border-border shrink-0 flex items-center justify-between">
          <h2 className="font-bold text-base text-ink">Dompet Voucher Kamu</h2>
          <button onClick={onClose} className="text-xs text-ink-secondary font-semibold">
            Tutup
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 bg-slate-50">
          {claims.length === 0 ? (
            <div className="py-10 text-center">
              <Ticket className="w-12 h-12 text-ink-secondary/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-ink-secondary">
                Yah, belum ada voucher nih :(
              </p>
              <p className="text-xs text-ink-secondary/70 mt-1">
                Klaim voucher di halaman depan ya!
              </p>
            </div>
          ) : (
            claims.map((c: any) => {
              const p = c.promo;
              const isSelected = selectedCode === p.code;
              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-2xl border-2 p-4 transition-all ${isSelected ? 'border-primary shadow-soft' : 'border-transparent shadow-sm'}`}
                  onClick={() => {
                    onSelect(p.code);
                    onClose();
                  }}
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-ink mb-1">{p.title}</h3>
                      <p className="text-xs text-ink-secondary line-clamp-2">{p.subtitle}</p>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded-md">
                          {p.category === 'all' ? 'Semua Layanan' : p.category.toUpperCase()}
                        </span>

                        {isSelected ? (
                          <span className="text-xs font-bold text-primary">Dipilih</span>
                        ) : (
                          <span className="text-xs font-bold text-ink-secondary">Pilih</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
