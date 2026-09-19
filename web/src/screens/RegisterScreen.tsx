import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '../store/auth';
import { ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff } from '../components/icons';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { register, status } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const busy = status === 'loading';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!agreed) return enqueueSnackbar('Harap setujui Syarat & Ketentuan', { variant: 'warning' });
    if (name.trim().length < 3)
      return enqueueSnackbar('Nama minimal 3 karakter', { variant: 'error' });
    if (emailInvalid(email))
      return enqueueSnackbar('Format email tidak valid', { variant: 'error' });
    if (phone.trim().length < 10)
      return enqueueSnackbar('Nomor telepon tidak valid', { variant: 'error' });
    if (password.length < 8)
      return enqueueSnackbar('Password minimal 8 karakter', { variant: 'error' });
    if (confirm !== password) return enqueueSnackbar('Password tidak cocok', { variant: 'error' });

    const area = localStorage.getItem('sg_selected_area') || undefined;
    await register(name.trim(), email.trim(), password, phone.trim(), area);
    if (useAuthStore.getState().status === 'authenticated') {
      enqueueSnackbar('Akun berhasil dibuat 🎉', { variant: 'success' });
      navigate('/main', { replace: true });
    } else if (useAuthStore.getState().errorMessage) {
      enqueueSnackbar(useAuthStore.getState().errorMessage, { variant: 'error' });
    }
  };

  const field = (label: string, icon: JSX.Element, input: JSX.Element) => (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <div className="relative">
        {icon}
        {input}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0">
        <button onClick={() => navigate('/login')} aria-label="Kembali">
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="font-semibold text-base">Truzzi</h1>
      </header>

      <div className="flex-1 flex flex-col max-w-md w-full mx-auto px-6 pt-6 pb-10">
        <h2 className="text-[28px] font-bold font-sans">Daftar</h2>
        <p className="text-sm text-ink-secondary mt-1">
          Buat akun baru untuk mulai menggunakan Truzzi.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {field(
            'Nama Lengkap',
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />,
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              className="input-base pl-10"
              autoComplete="name"
            />,
          )}
          {field(
            'Email',
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />,
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="input-base pl-10"
              autoComplete="email"
            />,
          )}
          {field(
            'Nomor Telepon',
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />,
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="input-base pl-10"
              autoComplete="tel"
            />,
          )}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="input-base pl-10 pr-11"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Tampilkan password"
              >
                {showPass ? (
                  <EyeOff className="w-5 h-5 text-ink-secondary" />
                ) : (
                  <Eye className="w-5 h-5 text-ink-secondary" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Konfirmasi Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Ulangi password"
                className="input-base pl-10"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAgreed((v) => !v)}
            className="flex items-start gap-2 text-left w-full"
          >
            <span
              className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${agreed ? 'bg-primary border-primary' : 'border-border bg-white'}`}
            >
              {agreed && <span className="text-white text-xs">✓</span>}
            </span>
            <span className="text-sm leading-relaxed">
              Saya menyetujui{' '}
              <span className="text-primary font-semibold">Syarat &amp; Ketentuan</span> dan{' '}
              <span className="text-primary font-semibold">Kebijakan Privasi</span>
            </span>
          </button>

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Memuat...' : 'Daftar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary font-semibold">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

function emailInvalid(email: string): boolean {
  return !email.trim() || !email.includes('@') || !email.includes('.');
}
