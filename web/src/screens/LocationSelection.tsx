import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Pilih area — default 'Kota Bekasi', lalu Lanjutkan → /login. (identik Flutter) */
export default function LocationSelection() {
  const [selected, setSelected] = useState('Jakarta');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <div className="flex-1 relative overflow-y-auto flex flex-col px-6 pt-10 pb-10 scrollbar-hide">
        <svg
          className="absolute bottom-0 left-0 w-full pointer-events-none"
          viewBox="0 0 400 140"
          preserveAspectRatio="none"
          style={{ opacity: 0.35 }}
        >
          <path d="M0,140 L0,90 C60,70 90,110 140,85 C190,60 220,40 270,75 C320,110 350,80 400,55 L400,140 Z" fill="white" />
          <path d="M0,110 L0,140 L400,140 L400,90 C350,115 320,140 270,95 C220,50 190,80 140,105 C90,130 60,90 0,110 Z" fill="white" opacity="0.6" />
        </svg>
        <h1 className="text-white text-[28px] font-bold leading-tight mt-4 font-sans">
          Mau mulai di
          <br />
          area mana?
        </h1>
        <p className="text-white/80 text-base leading-relaxed mt-3 font-sans">
          Pilih area untuk pengalaman
          <br />
          yang lebih relevan.
        </p>

        <div className="mt-10 space-y-3 relative z-10">
          {['Jakarta', 'Bogor', 'Depok', 'Tangerang', 'Bekasi', 'Kota Lainnya'].map((area) => {
            const isSel = selected === area;
            return (
              <button
                key={area}
                onClick={() => setSelected(area)}
                className="w-full flex items-center justify-between px-[18px] py-[18px] rounded-[14px] transition-colors duration-200"
                style={{
                  backgroundColor: isSel ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                  border: isSel ? '1.5px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <span
                  className={`font-sans text-[17px] ${isSel ? 'font-semibold text-white' : 'font-normal text-white'}`}
                >
                  {area}
                </span>
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200"
                  style={{
                    backgroundColor: isSel ? 'white' : 'transparent',
                    border: isSel ? 'none' : '2px solid rgba(255,255,255,0.4)',
                  }}
                >
                  {isSel ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#7F1D3A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bagian bawah putih lengkung */}
      <div className="bg-white rounded-t-[28px] px-6 pt-7 pb-8">
        <button className="btn-primary" onClick={() => {
          localStorage.setItem('sg_selected_area', selected);
          navigate('/login');
        }}>
          Lanjutkan
        </button>
      </div>
    </div>
  );
}