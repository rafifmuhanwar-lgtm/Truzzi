import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '../store/auth';

/** Register jastiper — field & validasi persis register_screen.dart. */
export default function Register() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { register, status, errorMessage } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const loading = status === 'loading';

  function validate(): string | null {
    if (name.trim().length < 3) return 'Nama minimal 3 karakter';
    if (!email.trim()) return 'Email tidak boleh kosong';
    if (!email.includes('@') || !email.includes('.')) return 'Format email tidak valid';
    if (phone.trim().length < 10) return 'Nomor telepon tidak valid';
    if (password.length < 8) return 'Password minimal 8 karakter';
    if (confirm !== password) return 'Konfirmasi password tidak cocok';
    if (!agree) return 'Harap setujui Syarat & Ketentuan';
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
      await register(name.trim(), email.trim(), password, phone.trim());
      enqueueSnackbar('Pendaftaran berhasil! Lengkapi data dan verifikasi.', { variant: 'success' });
      navigate('/kyc', { replace: true });
    } catch {
      /* errorMessage sudah di-set store */
    }
  }

  const error = localError ?? errorMessage;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary rounded-b-[32px] px-6 pt-14 pb-10 text-center">
        <h1 className="text-white text-display font-bold">Daftar</h1>
        <p className="text-white/70 text-body2 mt-1">Buat akun jastiper Truzzi</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-6 py-8 space-y-4 max-w-lg w-full mx-auto">
        {error && (
          <div className="rounded-btn bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-ink">Nama Lengkap</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama sesuai KTP" className="input-base mt-1.5" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className="input-base mt-1.5" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Nomor Telepon</label>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="08xxxxxxxxxx"
            className="input-base mt-1.5"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" className="input-base mt-1.5" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Konfirmasi Password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Ulangi password" className="input-base mt-1.5" />
        </div>

        <label className="flex items-start gap-3 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span className="text-small text-ink-secondary leading-relaxed">
            Saya menyetujui Syarat &amp; Ketentuan serta Kebijakan Privasi Truzzi
          </span>
        </label>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Memproses...' : 'Daftar'}
        </button>

        <p className="text-center text-sm text-ink-secondary">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary font-semibold">
            Masuk
          </Link>
        </p>
      </form>
    </div>
  );
}

