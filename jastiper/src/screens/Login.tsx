import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '../store/auth';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from '../components/icons';

export default function Login() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { login, status, errorMessage } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const loading = status === 'loading';

  function validate(): string | null {
    if (!email.trim()) return 'Email tidak boleh kosong';
    if (!email.includes('@') || !email.includes('.')) return 'Format email tidak valid';
    if (password.length < 8) return 'Password minimal 8 karakter';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const err = validate();
    if (err) {
      setLocalError(err);
      enqueueSnackbar(err, { variant: 'warning' });
      return;
    }
    try {
      await login(email.trim(), password);
      enqueueSnackbar('Selamat bertugas! 🛵', { variant: 'success' });
      navigate('/main', { replace: true });
    } catch {
      /* errorMessage sudah di-set store */
    }
  }

  const error = localError ?? errorMessage;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 shadow-sm z-10">
        <button onClick={() => navigate('/')} aria-label="Kembali">
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="font-semibold text-base">Truzzi Jastiper</h1>
      </header>

      <div className="flex-1 flex flex-col max-w-md w-full mx-auto px-6 pt-6 pb-10">
        <h2 className="text-[28px] font-bold font-sans">Masuk</h2>
        <p className="text-sm text-ink-secondary mt-1">Silakan masuk ke akun Anda.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-btn bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="input-base pl-10 w-full"
                autoComplete="email"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="input-base pl-10 pr-11 w-full"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Tampilkan password"
              >
                {showPass ? <EyeOff className="w-5 h-5 text-ink-secondary" /> : <Eye className="w-5 h-5 text-ink-secondary" />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Belum punya akun?{' '}
          <Link to="/register" className="text-primary font-semibold">
            Daftar
          </Link>
        </p>

        <p className="mt-8 text-center text-xs leading-relaxed text-ink-secondary">
          Dengan melanjutkan, kamu menyetujui
          <br />
          <span className="text-primary font-semibold">Syarat &amp; Ketentuan</span> dan{' '}
          <span className="text-primary font-semibold">Kebijakan Privasi</span>
        </p>
      </div>
    </div>
  );
}
