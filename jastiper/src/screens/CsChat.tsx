import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ArrowLeft, Headset, Send } from 'lucide-react';
import { API, errMsg } from '../lib/api';
import { formatTime } from '../lib/format';
import { useAuthStore } from '../store/auth';
import type { ChatMessage } from '../types';

/** Quick replies CS — persis cs_chat_screen.dart. */
const QUICK_REPLIES = [
  'Saya ingin bertanya tentang pesanan',
  'Ada kendala dengan aplikasi',
  'Cara tarik saldo?',
  'Hubungkan dengan CS',
];

/** Live CS jastiper — roomId `cs_chat_{jastiperId}`; bot-reply server (deviasi sadar dari Flutter yang manual). */
export default function CsChat() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const roomId = `cs_chat_${user?.id ?? ''}`;
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: msgData } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ['chat-messages', roomId],
    queryFn: () => API.chat.messages(roomId),
    refetchInterval: 4000,
  });
  const messages = msgData?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(payload?: string) {
    const body = payload ?? text.trim();
    if (!body) return;
    setText('');
    try {
      await API.chat.send(roomId, { text: body, messageType: 'text', senderRole: 'jastiper' });
      // Balasan bot CS (delay singkat seperti Flutter 1500ms).
      setTimeout(async () => {
        try {
          await API.chat.csBot(body);
          void queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
        } catch {
          /* ignore */
        }
      }, 1500);
      void queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal mengirim pesan'), { variant: 'error' });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* AppBar */}
      <div className="bg-primary px-4 pt-4 pb-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-white rounded-full hover:bg-white/10"
          >
            <ArrowLeft size={22} />
          </button>
          <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <Headset size={20} className="text-white" />
          </span>
          <div>
            <p className="text-white font-semibold leading-tight">Customer Service</p>
            <p className="text-success text-small flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" /> Online
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto max-w-lg w-full mx-auto">
        {messages.length === 0 && (
          <div className="py-12 text-center">
            <button
              onClick={() => void send('Halo, saya ingin bertanya')}
              className="btn-outline !w-auto px-6 mx-auto"
            >
              Mulai Chat
            </button>
          </div>
        )}
        {messages.map((m) => {
          const isSupport = m.senderRole === 'support' || !m.isMine;
          return (
            <div key={m.id} className={`flex ${isSupport ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[78%] rounded-card px-3.5 py-2 ${
                  isSupport
                    ? 'bg-white border border-border rounded-bl-sm'
                    : 'bg-primary text-white rounded-br-sm'
                }`}
              >
                {isSupport && (
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-primary mb-0.5">
                    <Headset size={12} /> Customer Service
                  </p>
                )}
                <p className={`text-body2 whitespace-pre-wrap break-words ${isSupport ? '' : ''}`}>
                  {m.text}
                </p>
                <p
                  className={`text-right text-[10px] mt-1 ${isSupport ? 'text-ink-secondary' : 'text-white/70'}`}
                >
                  {formatTime(m.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar max-w-lg w-full mx-auto">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => void send(q)}
            className="shrink-0 px-3 py-1.5 rounded-full border border-primary/40 text-primary text-small font-medium hover:bg-primary/5"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="px-4 pb-6 pt-2 bg-white border-t border-divider flex items-center gap-2 max-w-lg w-full mx-auto"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis pesan..."
          className="input-base !py-2.5 flex-1"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2.5 text-primary disabled:text-ink-secondary/40"
          aria-label="Kirim"
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
}
