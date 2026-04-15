import { useEffect, useState } from 'react';
import axios from 'axios';
import { Mail, MailOpen, Trash2, Phone, User, Clock, MessageSquare } from 'lucide-react';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/contact`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleOpen = async (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.read) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${import.meta.env.VITE_API_URL}/contact/${msg._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, read: true } : m));
      } catch (err) { console.error(err); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/contact/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(prev => prev.filter(m => m._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch (err) { console.error(err); }
  };

  const unreadCount = messages.filter(m => !m.read).length;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Messages de Contact</h1>
          <p className="text-sm text-slate-500 mt-1">Messages envoyés par les patients via le site web</p>
        </div>
        {unreadCount > 0 && (
          <span className="bg-teal-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow">
            {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
          <MessageSquare className="w-12 h-12 opacity-30" />
          <p className="text-base font-semibold">Aucun message pour l'instant</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Message list */}
          <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-700">{messages.length} message{messages.length > 1 ? 's' : ''}</p>
            </div>
            <ul className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
              {messages.map(msg => (
                <li
                  key={msg._id}
                  onClick={() => handleOpen(msg)}
                  className={`flex items-start gap-3 px-5 py-4 cursor-pointer transition-all hover:bg-teal-50/50 ${
                    selected?._id === msg._id ? 'bg-teal-50 border-l-4 border-teal-500' : ''
                  }`}
                >
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.read ? 'bg-slate-100 text-slate-400' : 'bg-teal-100 text-teal-600'
                  }`}>
                    {msg.read ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${msg.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                        {msg.name}
                      </p>
                      {!msg.read && <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{msg.subject}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(msg.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Message detail */}
          <div className="xl:col-span-2">
            {selected ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-full">
                <div className="flex items-start justify-between p-6 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selected.subject}</h2>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-teal-500" /> {selected.name}</span>
                      <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-teal-500" /> {selected.email}</span>
                      {selected.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-teal-500" /> {selected.phone}</span>}
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-teal-500" /> {formatDate(selected.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(selected._id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="bg-slate-50 rounded-xl p-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </div>
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Répondre par email
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 gap-3 py-24">
                <Mail className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">Sélectionnez un message pour le lire</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
