import React, { useState } from 'react';
import { Menu, X, Home, FileText, User, MapPin, CheckCircle2, ChevronRight, MessageCircle, Star, Search, CreditCard, ShoppingBag, MessageSquare, PlusCircle, ClipboardList, Navigation, History, Ticket, HelpCircle, Phone, Send, Info, ChevronDown, ArrowLeft } from 'lucide-react';

function PhoneFrame({ title, role, children, activeTab }: { title: string, role: 'customer' | 'jastiper', children: React.ReactNode, activeTab: number }) {
  return (
    <div className="w-[280px] shrink-0 snap-center flex flex-col items-center gap-4 group">
      <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider ${role === 'customer' ? 'bg-slate-100 text-slate-600' : 'bg-primary/10 text-primary'}`}>
        {role === 'customer' ? '📱 CUSTOMER APP' : '🛵 JASTIPER APP'}
      </div>
      
      <div className="w-[260px] aspect-[1/2.15] rounded-[2.5rem] border-[10px] border-slate-900 shadow-xl overflow-hidden bg-slate-50 relative group-hover:-translate-y-2 transition-transform duration-500">
        <div className="absolute top-0 inset-x-0 h-5 bg-slate-900 rounded-b-2xl w-32 mx-auto z-30" />
        
        <div className="pt-7 flex flex-col h-full relative z-10">
          <div className="px-4 py-3 bg-white shrink-0 shadow-sm flex items-center justify-center">
            <span className="text-xs font-bold">{title}</span>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            {children}
          </div>

          <div className="h-14 bg-white border-t border-slate-100 flex justify-around items-center px-4 shrink-0 relative z-20">
            <div className={`flex flex-col items-center gap-1 ${activeTab === 0 ? 'text-primary' : 'text-slate-300'}`}>
              <Home size={18} strokeWidth={activeTab === 0 ? 2.5 : 2} />
            </div>
            <div className={`flex flex-col items-center gap-1 ${activeTab === 1 ? 'text-primary' : 'text-slate-300'}`}>
              <FileText size={18} strokeWidth={activeTab === 1 ? 2.5 : 2} />
            </div>
            <div className={`flex flex-col items-center gap-1 ${activeTab === 2 ? 'text-primary' : 'text-slate-300'}`}>
              <User size={18} strokeWidth={activeTab === 2 ? 2.5 : 2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900 selection:bg-primary/20 relative">
      {/* Global Fixed Background */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.25] bg-cover md:bg-[length:100%_auto] bg-bottom bg-no-repeat pointer-events-none" 
        style={{ backgroundImage: "url('/hero-bg.png')" }} 
      />
      
      <div className="relative z-10 flex flex-col min-h-screen">
      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between relative">
          <div className="flex items-center">
            <img src="/logo.png" alt="Truzzi Logo" className="h-10 md:h-12 w-auto object-contain" />
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-primary transition-colors">Cara Kerja</a>
            <a href="#showcase" className="hover:text-primary transition-colors">Layanan</a>
            <a href="#jastiper" className="hover:text-primary transition-colors">Jadi Jastiper</a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-6">
            <a href="https://truzzi-web.vercel.app" className="text-[14px] font-medium text-slate-600 hover:text-primary transition-colors">Log In</a>
            <a href="https://truzzi-web.vercel.app" className="bg-slate-900 text-white px-5 py-2.5 rounded text-[14px] font-medium hover:bg-slate-800 transition-colors">
              Titip Sekarang
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 -mr-2 text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xl px-6 py-6 flex flex-col text-slate-700">
            <div className="flex flex-col gap-5 text-base font-medium mb-6">
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between hover:text-primary transition-colors">
                Cara Kerja <ChevronRight size={16} className="text-slate-300" />
              </a>
              <a href="#showcase" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between hover:text-primary transition-colors">
                Layanan <ChevronRight size={16} className="text-slate-300" />
              </a>
              <a href="#jastiper" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between hover:text-primary transition-colors">
                Jadi Jastiper <ChevronRight size={16} className="text-slate-300" />
              </a>
            </div>
            
            <div className="h-px bg-slate-200 mb-6" />
            
            <div className="flex flex-col gap-3">
              <a href="https://truzzi-web.vercel.app" className="w-full text-center py-3.5 font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Log In</a>
              <a href="https://truzzi-web.vercel.app" className="w-full text-center py-3.5 font-bold text-white bg-primary rounded-xl hover:bg-primary-hover shadow-sm">Titip Sekarang</a>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO */}
      <section className="pt-8 md:pt-20 pb-20 md:pb-24 border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
          
          <div className="max-w-xl text-center lg:text-left mx-auto lg:mx-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              Titip Apa Aja,<br />
              <span className="text-primary">Ada yang Bantuin.</span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-8 md:mb-10">
              Mau titip makanan, belanja barang, atau cari sesuatu yang jauh dari kamu? Temukan Jastiper terpercaya dan selesaikan semuanya tanpa ribet.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <a href="https://truzzi-web.vercel.app" className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded text-base font-medium hover:bg-primary-hover transition-colors text-center">
                Mulai Titip Sekarang
              </a>
              <a href="#how-it-works" className="w-full sm:w-auto text-slate-900 border border-slate-300 px-8 py-4 rounded text-base font-medium hover:bg-slate-50 transition-colors text-center">
                Lihat Cara Kerja
              </a>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end mt-4 lg:mt-0">
            <div className="w-full max-w-[260px] md:max-w-[300px] aspect-[1/2.1] rounded-[2.5rem] border-[10px] border-slate-900 shadow-xl overflow-hidden bg-slate-50 relative group">
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-5 bg-slate-900 rounded-b-2xl w-32 mx-auto z-30" />
              
              {/* Phone Content Simulation (Real HomeScreen) */}
              <div className="pt-8 flex flex-col h-full relative z-10 bg-slate-50">
                {/* Header burgundy melengkung */}
                <div className="bg-primary rounded-b-[28px] px-5 pt-5 pb-6 shrink-0 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-sm font-bold text-white leading-snug">
                        Hallo, <span className="font-normal">Budi</span> 👋
                      </h1>
                      <p className="text-[10px] text-white/70 mt-0.5">Mau dibantuin apa hari ini?</p>
                      <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white text-[9px] font-medium">
                        <MapPin size={10} className="shrink-0" />
                        <span className="truncate max-w-[120px]">Jakarta Selatan</span>
                        <ChevronRight size={10} className="text-white/60" />
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl overflow-hidden shadow-inner flex items-center justify-center text-white/50">
                       <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Budi&backgroundColor=e2e8f0" alt="avatar" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Search */}
                  <div className="mt-4 bg-white rounded-full flex items-center px-3 py-2 shadow-sm">
                    <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <span className="text-[10px] text-slate-400">Cari atau tulis sendiri...</span>
                  </div>
                </div>
                
                <div className="flex-1 p-4 space-y-5 overflow-hidden">
                  {/* Service card */}
                  <div className="bg-white p-3 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-[11px] text-slate-900 leading-tight">Yuk, Eksplore Open Trip & Jastip!</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Open Trip, Oleh-Oleh & Titip Belanja</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex justify-around px-2">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        <History size={18} className="text-primary" />
                      </div>
                      <span className="text-[9px] text-slate-600 font-medium">Riwayat</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        <PlusCircle size={18} className="text-primary" />
                      </div>
                      <span className="text-[9px] text-slate-600 font-medium">Buka Jastip</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        <Ticket size={18} className="text-primary" />
                      </div>
                      <span className="text-[9px] text-slate-600 font-medium">Voucher</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        <HelpCircle size={18} className="text-primary" />
                      </div>
                      <span className="text-[9px] text-slate-600 font-medium">Bantuan</span>
                    </div>
                  </div>

                  {/* Promo Banner */}
                  <div className="bg-gradient-to-br from-primary via-primary to-[#5C1A3A] rounded-2xl p-4 relative overflow-hidden shadow-md mx-1">
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[8px] font-bold mb-2">
                      <Star className="w-2.5 h-2.5" /> PROMO TRUZZI
                    </div>
                    <p className="text-white text-xs font-bold leading-snug">Diskon Ongkir Rp10.000</p>
                    <p className="text-white/80 text-[9px] mt-1">Khusus hari ini, tanpa minimal transaksi!</p>
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="h-14 bg-white border-t border-slate-100 grid grid-cols-5 px-2 shrink-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] pb-1">
                  <div className="flex flex-col items-center justify-center gap-0.5 text-primary">
                    <Home size={20} strokeWidth={2.5} />
                    <span className="text-[8px] font-bold">Beranda</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-0.5 text-slate-400">
                    <ClipboardList size={18} />
                    <span className="text-[8px]">Pesanan</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-0.5 text-slate-400">
                    <ShoppingBag size={18} />
                    <span className="text-[8px]">Jastip</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-0.5 text-slate-400 relative">
                    <MessageSquare size={18} />
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 border border-white" />
                    <span className="text-[8px]">Pesan</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-0.5 text-slate-400">
                    <User size={18} />
                    <span className="text-[8px]">Profil</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 3. WHAT TRUZZI HELPS YOU DO */}
      <section className="py-24 border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-12">
            Kadang kita cuma butuh seseorang untuk membantu.
          </h2>
          
          <div className="text-left max-w-xl mx-auto space-y-6 text-lg text-slate-600">
            <div className="flex items-start gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
              <p>Titip makanan yang tidak ada di aplikasi ojol.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
              <p>Belanja ke tempat yang tidak sempat kamu datangi.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
              <p>Cari barang dari lokasi tertentu atau toko spesifik.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-white/40 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-16">Cara Kerja</h2>
          
          <div className="relative">
            <div className="hidden md:block absolute top-[11px] left-0 right-0 h-[1px] bg-slate-200" />
            
            <div className="grid md:grid-cols-4 gap-12 md:gap-8">
              
              <div className="relative pt-8 md:pt-10">
                <div className="absolute top-0 left-0 text-sm font-bold text-slate-900 bg-slate-50 pr-4 z-10">01</div>
                <h4 className="text-lg font-bold mb-2">Buat Pesanan</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Tulis detail barang, lokasi, dan tentukan ongkos jastip.
                </p>
              </div>

              <div className="relative pt-8 md:pt-10">
                <div className="absolute top-0 left-0 text-sm font-bold text-slate-400 bg-slate-50 pr-4 z-10">02</div>
                <h4 className="text-lg font-bold mb-2">Jastiper Menerima</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Jastiper di sekitar lokasi akan menyetujui pesanan Anda.
                </p>
              </div>

              <div className="relative pt-8 md:pt-10">
                <div className="absolute top-0 left-0 text-sm font-bold text-slate-400 bg-slate-50 pr-4 z-10">03</div>
                <h4 className="text-lg font-bold mb-2">Barang Dibeli</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Jastiper berbelanja menggunakan sistem Escrow yang aman.
                </p>
              </div>

              <div className="relative pt-8 md:pt-10">
                <div className="absolute top-0 left-0 text-sm font-bold text-slate-400 bg-slate-50 pr-4 z-10">04</div>
                <h4 className="text-lg font-bold mb-2">Selesai</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Barang sampai. Uang diteruskan setelah Anda konfirmasi.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT SHOWCASE (6-SLIDE CAROUSEL) */}
      <section id="showcase" className="py-24 border-b border-slate-200/50 overflow-hidden bg-slate-100/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Kenali Aplikasinya</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Geser layar untuk melihat alur kerja antara Customer yang menitip pesanan dan Jastiper yang menyelesaikan tugasnya secara real-time.
          </p>
        </div>

        <div className="w-full overflow-x-auto snap-x snap-mandatory pb-16 pt-4 hide-scrollbar">
          <div className="flex gap-8 px-[10vw] md:px-[20vw] lg:px-[calc(50vw-440px)] min-w-max">
            
            {/* Slide 1: Customer Buat Pesanan */}
            <PhoneFrame title="Buat Jastip" role="customer" activeTab={0}>
              <div className="h-full bg-slate-50 flex flex-col">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-[9px] font-bold text-slate-400 mb-1.5 flex items-center gap-1"><MapPin size={10} /> Lokasi Pembelian (Opsional)</div>
                    <div className="text-[11px] font-semibold text-slate-900 pb-1 border-b border-slate-100">Pasar Santa, Jakarta Selatan</div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 mb-1.5">Apa yang ingin dibeli?</div>
                      <div className="p-2.5 bg-slate-50 rounded-xl text-[10px] text-slate-700 border border-slate-100">
                        Beli Kopi Tuku 2, Donat Kampung 3. Tolong pilih yang donatnya empuk ya. Kopi es dipisah.
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="text-[9px] font-bold text-slate-400 mb-1">Estimasi Harga</div>
                        <div className="h-8 bg-slate-50 rounded-lg border border-slate-100 flex items-center px-2 text-[10px] font-bold">Rp 50.000</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-[9px] font-bold text-slate-400 mb-1">Tawaran Ongkos</div>
                        <div className="h-8 bg-slate-50 rounded-lg border border-slate-100 flex items-center px-2 text-[10px] font-bold text-emerald-600">Rp 20.000</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <button className="w-full h-10 bg-primary text-white text-[11px] font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5">
                    <Search size={14} /> Cari Jastiper
                  </button>
                </div>
              </div>
            </PhoneFrame>

            {/* Slide 2: Jastiper Radar */}
            <PhoneFrame title="Daftar Pesanan" role="jastiper" activeTab={1}>
              <div className="h-full bg-slate-50 flex flex-col">
                <div className="px-4 pt-3">
                  {/* Tabs */}
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">Aktif (1)</div>
                    <div className="flex-1 h-8 rounded-full bg-white border border-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center">Riwayat (12)</div>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex gap-2 mt-3">
                    <div className="flex-1 h-8 bg-white border border-slate-200 rounded-lg flex items-center px-2 text-[9px] text-slate-500">Jenis: Semua <ChevronDown size={10} className="ml-auto" /></div>
                    <div className="flex-1 h-8 bg-white border border-slate-200 rounded-lg flex items-center px-2 text-[9px] text-slate-500">Urut: Terbaru <ChevronDown size={10} className="ml-auto" /></div>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  {/* Order Card */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-emerald-500">JASTIP</span>
                      <span className="text-[9px] text-slate-400">Baru saja</span>
                    </div>
                    <p className="font-bold text-xs text-slate-900 leading-tight">Beli Kopi Tuku 2, Donat Kampung 3</p>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Tolong pilih yang donatnya empuk ya. Kopi es dipisah.</p>
                    <p className="text-[10px] mt-2">
                      <span className="font-semibold text-slate-900">Ongkir:</span> <span className="text-slate-700">Rp 20.000</span>
                      <span className="text-slate-400"> (Belanja: Rp 50.000)</span>
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="flex gap-1.5 text-[9px] text-slate-500"><Navigation size={12} className="text-emerald-500" /> Antar ke: Jl. Sudirman No 1</p>
                    </div>
                    <button className="w-full h-8 mt-3 rounded-xl border border-primary text-primary text-[10px] font-bold">Lihat Detail</button>
                  </div>
                </div>
              </div>
            </PhoneFrame>

            {/* Slide 3: Jastiper Terima */}
            <PhoneFrame title="Detail Pesanan" role="jastiper" activeTab={1}>
              <div className="h-full bg-slate-50 flex flex-col">
                <div className="p-4 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mb-4">
                     <div className="flex items-center gap-2">
                       <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden">
                         <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Customer" alt="Customer" />
                       </div>
                       <div>
                         <p className="text-[11px] font-bold text-slate-900">Siska</p>
                         <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-0.5">
                           <Star size={10} className="text-amber-400 fill-amber-400" /> 5.0 (20 Pesanan)
                         </div>
                       </div>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                       <MessageCircle size={14} />
                     </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium mb-0.5">DETAIL BARANG</p>
                      <p className="text-[11px] font-bold text-slate-900">Beli Kopi Tuku 2, Donat Kampung 3</p>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2">
                      <span className="text-[10px] text-slate-500">Estimasi Dana</span>
                      <span className="text-[11px] font-bold text-slate-900">Rp 50.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">Tarif Jastip</span>
                      <span className="text-[11px] font-bold text-emerald-600">Rp 20.000</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <button className="w-full h-10 bg-primary text-white text-[11px] font-bold rounded-xl shadow-sm">Terima Pesanan</button>
                </div>
              </div>
            </PhoneFrame>

            {/* Slide 4: Customer Bayar Escrow */}
            <PhoneFrame title="Ringkasan Pesanan" role="customer" activeTab={1}>
              <div className="h-full bg-slate-50 flex flex-col">
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3 mb-4">
                    <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-primary" /> Informasi Pesanan</p>
                    <div className="mt-2 space-y-1.5 text-[11px]">
                      <div className="flex justify-between"><span className="text-slate-500">Jastiper</span><span className="font-semibold text-slate-900">Budi Setiawan</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Estimasi Belanja</span><span className="font-semibold text-slate-900">Rp 50.000</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Tarif Jastip</span><span className="font-semibold text-slate-900">Rp 20.000</span></div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-xs text-slate-900">Metode Pembayaran</h3>
                    <div className="flex items-center justify-between p-3 border border-primary bg-primary/5 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-primary" />
                        <div>
                          <p className="text-[11px] font-bold text-slate-900">TruzziPay</p>
                          <p className="text-[9px] text-slate-500">Saldo: Rp 150.000</p>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded-full border-[4px] border-primary" />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-slate-900">Total Tagihan</span>
                    <span className="text-lg font-black text-primary">Rp 70.000</span>
                  </div>
                </div>
                
                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <button className="w-full h-10 bg-primary text-white text-[11px] font-bold rounded-xl shadow-sm">Bayar Sekarang</button>
                </div>
              </div>
            </PhoneFrame>

            {/* Slide 5: Chat & Tracking */}
            <PhoneFrame title="ChatRoom" role="customer" activeTab={1}>
              <div className="h-full bg-slate-50 flex flex-col relative">
                {/* Header Chat */}
                <div className="bg-primary px-3 py-2.5 flex items-center gap-2 text-white shadow-sm shrink-0">
                  <ArrowLeft className="w-4 h-4 text-white" />
                  <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Budi" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[11px] truncate">Budi Setiawan</p>
                    <p className="text-[8px] text-white/80">Jastiper Aktif</p>
                  </div>
                  <Phone className="w-4 h-4" />
                </div>
                
                {/* Chat snippet */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50 flex flex-col justify-end">
                  <div className="flex justify-start">
                    <div className="max-w-[85%] px-3 py-2 text-[10px] bg-white text-slate-800 rounded-[12px_12px_12px_2px] border border-slate-200">
                      Halo kak, donat kampungnya habis, mau diganti donat coklat?
                      <div className="text-[8px] text-slate-400 text-right mt-1">12:45</div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[85%] px-3 py-2 text-[10px] bg-primary text-white rounded-[12px_12px_2px_12px]">
                      Boleh mas, harga sama kan?
                      <div className="text-[8px] text-white/70 text-right mt-1 flex justify-end gap-1 items-center">12:46 <CheckCircle2 size={10} /></div>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[85%] px-3 py-2 text-[10px] bg-white text-slate-800 rounded-[12px_12px_12px_2px] border border-slate-200">
                      Sama kak. Otw ya.
                      <div className="text-[8px] text-slate-400 text-right mt-1">12:47</div>
                    </div>
                  </div>
                </div>
                
                {/* Chat Input */}
                <div className="bg-white border-t border-slate-100 p-2.5 flex items-center gap-2 shrink-0">
                  <PlusCircle className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 bg-slate-50 rounded-full border border-slate-200 h-8 px-3 flex items-center text-[10px] text-slate-400">
                    Tulis pesan...
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                    <Send size={14} className="ml-0.5" />
                  </div>
                </div>
              </div>
            </PhoneFrame>

            {/* Slide 6: Selesai */}
            <PhoneFrame title="Order Selesai" role="customer" activeTab={1}>
              <div className="p-4 h-full bg-slate-50 flex flex-col justify-center text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center mb-3">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Pesanan Selesai!</h4>
                  <p className="text-[10px] text-slate-500 mt-1 px-4 leading-relaxed">Terima kasih telah menggunakan Truzzi. Dana jastip telah diteruskan ke Jastiper.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center mb-6">
                  <div className="text-[10px] font-bold text-slate-900 mb-3">Berikan Penilaian</div>
                  <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto mb-2 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Budi" alt="" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-900 mb-2">Budi Setiawan</p>
                  
                  <div className="flex justify-center gap-1.5 text-slate-200 mb-3">
                    <Star size={24} className="fill-amber-400 text-amber-400" />
                    <Star size={24} className="fill-amber-400 text-amber-400" />
                    <Star size={24} className="fill-amber-400 text-amber-400" />
                    <Star size={24} className="fill-amber-400 text-amber-400" />
                    <Star size={24} className="fill-amber-400 text-amber-400" />
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 text-[10px] text-slate-400 text-left">
                    Tuliskan ulasan Anda...
                  </div>
                </div>

                <button className="w-full h-10 bg-primary text-white text-[11px] font-bold rounded-xl shadow-sm">Kirim Penilaian</button>
              </div>
            </PhoneFrame>

          </div>
        </div>
      </section>

      {/* 6. FOR JASTIPER */}
      <section id="jastiper" className="py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Punya waktu luang? Bantu orang lain.</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            Jadilah Jastiper Truzzi. Ambil pesanan yang searah dengan tujuanmu, sepakati harga secara transparan, dan dapatkan penghasilan tambahan tanpa tekanan.
          </p>
          <a href="https://truzzi-jastiper.vercel.app" className="inline-block border-2 border-slate-900 text-slate-900 px-8 py-3 rounded font-medium hover:bg-slate-50 transition-colors">
            Daftar Jadi Jastiper
          </a>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="py-24 bg-white/40 backdrop-blur-md border-t border-slate-200/50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Pertanyaan yang Sering Diajukan</h2>
          <div className="space-y-4">
            <FaqItem 
              question="Apa bedanya Truzzi dengan ojek online?" 
              answer="Truzzi bukan layanan kurir dengan harga tetap, melainkan marketplace komunitas. Kamu bisa menitipkan belanjaan, minta dicarikan barang spesifik, atau nitip beli sesuatu di luar kota kepada Jastiper. Tarif ongkos jasa bisa kamu tawarkan sendiri dan disepakati bersama Jastiper." 
            />
            <FaqItem 
              question="Apakah uang saya aman?" 
              answer="Sangat aman. Dana pembayaranmu akan ditahan oleh sistem Escrow (rekening bersama) Truzzi. Dana baru akan diteruskan ke Jastiper HANYA setelah kamu mengonfirmasi bahwa barang telah diterima dengan baik." 
            />
            <FaqItem 
              question="Siapa saja yang bisa menjadi Jastiper?" 
              answer="Siapa saja bisa mendaftar! Baik kamu mahasiswa, pekerja kantoran yang sering bepergian, atau warga lokal yang tahu tempat-tempat bagus. Pendaftaran mudah dan fleksibel tanpa target pesanan." 
            />
            <FaqItem 
              question="Bagaimana jika barang yang dibelikan salah atau tidak sesuai?" 
              answer="Jika terjadi ketidaksesuaian, kamu bisa mengajukan komplain melalui sistem sebelum mengonfirmasi pesanan selesai. Dana akan tetap ditahan hingga masalah terselesaikan." 
            />
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="bg-primary/95 backdrop-blur-md py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-10">
            Titip Sekarang, Biar Kami yang Bantu.
          </h2>
          <a href="https://truzzi-web.vercel.app" className="inline-block bg-white text-primary px-10 py-4 rounded font-bold hover:bg-slate-100 transition-colors">
            Mulai Titip Sekarang
          </a>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Truzzi Logo" className="h-6 w-auto grayscale brightness-0 invert opacity-50" />
            <span className="text-sm font-medium opacity-50">© 2026</span>
          </div>
          <div className="flex gap-6 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Tentang</a>
            <a href="#" className="hover:text-white transition-colors">Bantuan</a>
            <a href="#" className="hover:text-white transition-colors">Privasi</a>
          </div>
        </div>
      </footer>

    </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button 
        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none" 
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-slate-900">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}
