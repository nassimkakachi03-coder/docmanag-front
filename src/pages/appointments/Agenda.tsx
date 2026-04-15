import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, CalendarDays, Search, Pencil } from 'lucide-react';
import Modal from '../../components/Modal';

const API = import.meta.env.VITE_API_URL;

const emptyForm = { patientId: '', reason: '', date: '', time: '', duration: 30, status: 'Scheduled' };

const statusBadge = (status: string) => {
  const map: Record<string, string> = { Scheduled: 'bg-teal-100 text-teal-700', Completed: 'bg-emerald-100 text-emerald-700', Cancelled: 'bg-red-100 text-red-700' };
  return <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
};

export default function Agenda() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [aRes, patRes] = await Promise.all([
        axios.get(`${API}/appointments`, { headers }),
        axios.get(`${API}/patients`, { headers })
      ]);
      setAppointments(aRes.data);
      setPatients(patRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (a: any) => {
    setEditing(a);
    const d = new Date(a.date);
    setForm({
      patientId: a.patientId?._id || a.patientId || '',
      reason: a.reason || '',
      date: d.toISOString().substring(0, 10),
      time: d.toTimeString().substring(0, 5),
      duration: a.duration || 30,
      status: a.status || 'Scheduled'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const selectedPatient = patients.find(p => p._id === form.patientId);
    const payload = {
      ...form,
      patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '',
      doctorId: user?.id,
      date: new Date(`${form.date}T${form.time}`).toISOString(),
    };
    try {
      if (editing) {
        const res = await axios.put(`${API}/appointments/${editing._id}`, payload, { headers });
        setAppointments(appointments.map(a => a._id === editing._id ? res.data : a));
      } else {
        const res = await axios.post(`${API}/appointments`, payload, { headers });
        setAppointments([res.data, ...appointments]);
      }
      setModalOpen(false);
    } catch (err) { alert('Erreur lors de l\'enregistrement.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return;
    try { await axios.delete(`${API}/appointments/${id}`, { headers }); } catch { }
    setAppointments(appointments.filter(a => a._id !== id));
  };

  const filtered = appointments.filter(a => {
    const q = search.toLowerCase();
    return (a.patientName || '').toLowerCase().includes(q) || (a.reason || '').toLowerCase().includes(q);
  });

  const todayCount = appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda Médical & Planification</h1>
          <p className="text-sm text-slate-500 mt-1">Planifiez et gérez les rendez-vous de la clinique.</p>
        </div>
        <button onClick={openAdd} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouveau RDV
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par patient ou motif..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">✕</button>}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 border border-slate-100">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><CalendarDays className="w-5 h-5 text-teal-500" /></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total RDV</p><p className="text-xl font-black text-slate-800">{appointments.length}</p></div>
        </div>
        <div className="bg-teal-50 rounded-xl p-4 flex items-center gap-4 border border-teal-100">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><CalendarDays className="w-5 h-5 text-teal-600" /></div>
          <div><p className="text-xs font-bold text-teal-600 uppercase tracking-wide">Aujourd'hui</p><p className="text-xl font-black text-slate-800">{todayCount}</p></div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Date & Heure', 'Patient', 'Motif', 'Durée', 'Statut', 'Actions'].map(h => (
                <th key={h} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">
                {search ? `Aucun résultat pour « ${search} »` : 'Aucun rendez-vous planifié.'}
              </td></tr>
            ) : filtered.map(app => (
              <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-sm font-black text-slate-800 whitespace-nowrap">{new Date(app.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td className="p-4 text-sm font-bold text-teal-700">{app.patientName || `${app.patientId?.firstName || ''} ${app.patientId?.lastName || ''}`}</td>
                <td className="p-4 text-sm text-slate-600">{app.reason}</td>
                <td className="p-4 text-sm text-slate-500 font-semibold">{app.duration} min</td>
                <td className="p-4">{statusBadge(app.status)}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(app)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(app._id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le Rendez-vous' : 'Nouveau Rendez-vous'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Patient *</label>
            <select required value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} className="w-full border border-slate-300 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500 text-sm">
              <option value="">Sélectionner un patient...</option>
              {patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Motif *</label>
            <input required value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" placeholder="Ex: Douleur dentaire..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Date *</label>
              <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Heure *</label>
              <input required type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Durée (min)</label>
              <input type="number" min={5} value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          {editing && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Statut</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-slate-300 bg-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500">
                <option value="Scheduled">Planifié</option>
                <option value="Completed">Terminé</option>
                <option value="Cancelled">Annulé</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">Annuler</button>
            <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold">
              {loading ? 'Enregistrement...' : (editing ? 'Enregistrer les modifications' : 'Confirmer le RDV')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
