import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '../store/auth';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, GoogleIcon } from '../components/icons';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { login, googleLogin, status, errorMessage } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const busy = status === 'loading';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (emailInvalid(email)) return enqueueSnackbar('Format email tidak valid', { variant: 'error' });
    if (!password) return enqueueSnackbar('Password tidak boleh kosong', { variant: 'error' });
    if (password.length < 8) return enqueueSnackbar('Password minimal 8 karakter', { variant: 'error' });
    await login(email.trim(), password);
    if (useAuthStore.getState().status === 'authenticated') navigate('/main', { replace: true });
    else if (useAuthStore.getState().errorMessage) enqueueSnackbar(useAuthStore.getState().errorMessage, { variant: 'error' });
  };

  const handleGoogle = async () => {
    await googleLogin();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0">
        <button onClick={() => navigate('/')} aria-label="Kembali">
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="font-semibold text-base">Truzzi</h1>
      </header>

      <div className="flex-1 flex flex-col max-w-md w-full mx-auto px-6 pt-6 pb-10">
        <h2 className="text-[28px] font-bold font-sans">Masuk</h2>
        <p className="text-sm text-ink-secondary mt-1">Silakan masuk ke akun Anda.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="input-base pl-10"
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
                placeholder="••••••••"
                className="input-base pl-10 pr-11"
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

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Memuat...' : 'Masuk'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-divider" />
          <span className="text-sm text-ink-secondary">atau</span>
          <div className="flex-1 h-px bg-divider" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full h-[50px] rounded-btn border border-border bg-white flex items-center justify-center gap-3 font-semibold text-sm hover:border-primary transition-colors disabled:opacity-50"
        >
          <GoogleIcon className="w-7 h-7" />
          Lanjutkan dengan Google
        </button>

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
        {errorMessage && <p className="mt-3 text-center text-xs text-error">{errorMessage}</p>}
      </div>
    </div>
  );
}

function emailInvalid(email: string): boolean {
  return !email.trim() || !email.includes('@') || !email.includes('.');
}