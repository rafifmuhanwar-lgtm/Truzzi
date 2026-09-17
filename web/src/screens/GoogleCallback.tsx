import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { API, errMsg } from '../lib/api';

/** Callback Google OAuth — menukar kode di URL dengan sesi (engine postgres). */
export default function GoogleCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const code = q.get('code');

    const run = async () => {
      if (!code) {
        setStatus('error');
        setMessage('Kode OAuth tidak ditemukan');
        return;
      }
      try {
        const { user } = await API.auth.googleCallback(code);
        setUser(user);
        // bersihkan hash lalu ke /main
        window.location.hash = '#/main';
      } catch (e) {
        setStatus('error');
        setMessage(errMsg(e, 'Login Google gagal'));
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-error font-semibold">{message}</p>
        <button className="btn-primary max-w-[240px]" onClick={() => navigate('/login')}>
          Kembali ke Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
        <span className="text-white text-2xl font-black font-sans">S</span>
      </div>
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-ink-secondary">Menyelesaikan login Google...</p>
    </div>
  );
}