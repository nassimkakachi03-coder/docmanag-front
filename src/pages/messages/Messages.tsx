import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import {
  Clock3,
  Mail,
  MailOpen,
  MessageSquare,
  Phone,
  Trash2,
  UserRound,
} from 'lucide-react';

interface ContactMessage {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  read: boolean;
  patientId?: string;
  createdAt: string;
}

const API = import.meta.env.VITE_API_URL;

const formatDate = (value: string) =>
  new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function Messages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const unreadCount = useMemo(() => messages.filter((message) => !message.read).length, [messages]);

  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/contact`, { headers });
      setMessages(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMessages();
  }, []);

  const openMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);

    if (!message.read) {
      try {
        await axios.put(`${API}/contact/${message._id}/read`, {}, { headers });
        setMessages((current) => current.map((item) => (item._id === message._id ? { ...item, read: true } : item)));
        setSelectedMessage((current) => (current && current._id === message._id ? { ...current, read: true } : current));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const removeMessage = async (id: string) => {
    if (!window.confirm('Supprimer ce message ?')) return;

    try {
      await axios.delete(`${API}/contact/${id}`, { headers });
      setMessages((current) => current.filter((message) => message._id !== id));
      if (selectedMessage?._id === id) setSelectedMessage(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-900 p-8 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.22),_transparent_60%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Messages du Site Web</h1>
          </div>
          <div className="rounded-[24px] bg-white/10 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">Non lus</p>
            <p className="mt-2 text-3xl font-black">{unreadCount}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-[30px] border border-slate-200 bg-white p-16 text-center shadow-sm">
          <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-lg font-bold text-slate-900">Aucun message pour le moment.</p>
          <p className="mt-2 text-sm text-slate-500">Les nouveaux contacts envoyés depuis le site apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{messages.length} messages</p>
            </div>
            <ul className="max-h-[720px] divide-y divide-slate-100 overflow-y-auto">
              {messages.map((message) => {
                const fullName = `${message.firstName || ''} ${message.lastName || ''}`.trim() || message.name;

                return (
                  <li
                    key={message._id}
                    onClick={() => openMessage(message)}
                    className={`cursor-pointer px-5 py-4 transition hover:bg-slate-50 ${selectedMessage?._id === message._id ? 'bg-teal-50/60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-2xl ${message.read ? 'bg-slate-100 text-slate-400' : 'bg-teal-100 text-teal-700'}`}>
                        {message.read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className={`truncate text-sm ${message.read ? 'font-semibold text-slate-700' : 'font-black text-slate-900'}`}>{fullName}</p>
                          {!message.read && <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />}
                        </div>
                        <p className="truncate text-sm text-slate-500">{message.subject}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
            {selectedMessage ? (
              <>
                <div className="flex flex-col gap-5 border-b border-slate-100 p-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-600">Message sélectionné</p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900">{selectedMessage.subject}</h2>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                        <UserRound className="h-4 w-4 text-slate-400" />
                        {`${selectedMessage.firstName || ''} ${selectedMessage.lastName || ''}`.trim() || selectedMessage.name}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {selectedMessage.email}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {selectedMessage.phone || 'Téléphone non renseigné'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{formatDate(selectedMessage.createdAt)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedMessage.patientId && (
                      <button
                        onClick={() => navigate(`/patients/${selectedMessage.patientId}/history`)}
                        className="rounded-2xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
                      >
                        Ouvrir le dossier patient
                      </button>
                    )}
                    <button
                      onClick={() => removeMessage(selectedMessage._id)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="rounded-[26px] bg-slate-50 p-5 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      <Mail className="h-4 w-4" />
                      Répondre par email
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <Mail className="h-10 w-10 text-slate-300" />
                <p className="mt-4 text-lg font-bold text-slate-900">Sélectionnez un message</p>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Ouvrez une conversation à gauche pour lire le contenu, répondre au patient ou accéder directement à son dossier.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
