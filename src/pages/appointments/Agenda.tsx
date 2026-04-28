import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL;

const MOTIFS = [
  'Douleur dentaire',
  'Problème de gencives',
  'Détartrage',
  'Caries',
  'Sensibilités dentaires',
  'Orthodontie',
  'Contrôle / Prévention',
  'Mauvaise haleine',
  'Autres',
];

const emptyForm = {
  patientId: '',
  reason: '',
  otherReason: '',
  date: '',
  time: '',
  status: 'EnCours' as 'EnCours' | 'Termine',
  notes: '',
};

const statusLabels: Record<string, string> = {
  EnCours: 'En cours',
  Termine: 'Terminé',
  // legacy
  Scheduled: 'En cours',
  Pending: 'En cours',
  Completed: 'Terminé',
  Cancelled: 'Annulé',
};

const statusStyles: Record<string, string> = {
  EnCours: 'bg-amber-50 text-amber-700 border-amber-200',
  Termine: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

type SortKey = 'date' | 'patientName' | 'reason' | 'status';
type SortDir = 'asc' | 'desc';

export default function Agenda() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const [aRes, pRes] = await Promise.all([
        axios.get(`${API}/appointments`, { headers }),
        axios.get(`${API}/patients`, { headers }),
      ]);
      setAppointments(Array.isArray(aRes.data) ? aRes.data : []);
      setPatients(Array.isArray(pRes.data) ? pRes.data : []);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { if (token) void fetchData(); }, [token]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <ArrowUpDown className={`inline h-3 w-3 ml-1 ${sortKey === col ? 'text-teal-600' : 'text-slate-400'}`} />
  );

  const filteredSortedAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = query
      ? appointments.filter(a =>
          [a.patientName, a.patientId?.firstName, a.patientId?.lastName, a.reason, a.notes]
            .filter(Boolean).join(' ').toLowerCase().includes(query)
        )
      : [...appointments];

    list.sort((a, b) => {
      let va: any, vb: any;
      if (sortKey === 'date') { va = new Date(a.date).getTime(); vb = new Date(b.date).getTime(); }
      else if (sortKey === 'patientName') { va = (a.patientName || '').toLowerCase(); vb = (b.patientName || '').toLowerCase(); }
      else if (sortKey === 'reason') { va = (a.reason || '').toLowerCase(); vb = (b.reason || '').toLowerCase(); }
      else { va = (a.status || '').toLowerCase(); vb = (b.status || '').toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [appointments, search, sortKey, sortDir]);

  useEffect(() => { setCurrentPage(1); }, [search, sortKey, sortDir]);

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSortedAppointments.slice(start, start + itemsPerPage);
  }, [filteredSortedAppointments, currentPage]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return appointments.filter(a => new Date(a.date).toDateString() === today);
  }, [appointments]);

  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm); };

  const openCreateModal = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };

  const openEditModal = (appointment: any) => {
    const d = new Date(appointment.date);
    const rawStatus = appointment.status || 'EnCours';
    const normalizedStatus: 'EnCours' | 'Termine' =
      ['Completed', 'Termine'].includes(rawStatus) ? 'Termine' : 'EnCours';
    setEditing(appointment);
    setForm({
      patientId: appointment.patientId?._id || appointment.patientId || '',
      reason: MOTIFS.includes(appointment.reason) ? appointment.reason : 'Autres',
      otherReason: MOTIFS.includes(appointment.reason) ? '' : (appointment.reason || ''),
      date: d.toISOString().slice(0, 10),
      time: d.toTimeString().slice(0, 5),
      status: normalizedStatus,
      notes: appointment.notes || '',
    });
    setModalOpen(true);
  };

  const toggleStatus = async (appointment: any) => {
    const next = ['EnCours', 'Scheduled', 'Pending'].includes(appointment.status) ? 'Termine' : 'EnCours';
    try {
      await axios.put(`${API}/appointments/${appointment._id}`, { status: next }, { headers });
      await fetchData();
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    if (!form.patientId || !form.date || !form.time) {
      alert('Veuillez renseigner le patient, la date et l\'heure.');
      setLoading(false); return;
    }
    const finalReason = form.reason === 'Autres' ? form.otherReason.trim() : form.reason;
    if (!finalReason) { alert('Veuillez préciser le motif.'); setLoading(false); return; }
    const selectedPatient = patients.find(p => p._id === form.patientId);
    const doctorId = typeof user?.id === 'string' && /^[a-fA-F0-9]{24}$/.test(user.id) ? user.id : undefined;
    try {
      const payload = {
        patientId: form.patientId,
        patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '',
        reason: finalReason,
        date: new Date(`${form.date}T${form.time}`).toISOString(),
        status: form.status,
        notes: form.notes,
        ...(doctorId ? { doctorId } : {}),
      };
      if (editing) {
        await axios.put(`${API}/appointments/${editing._id}`, payload, { headers });
      } else {
        await axios.post(`${API}/appointments`, payload, { headers });
      }
      closeModal();
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Impossible d'enregistrer ce rendez-vous.");
    } finally { setLoading(false); }
  };

  const removeAppointment = async (id: string) => {
    if (!window.confirm('Supprimer ce rendez-vous ?')) return;
    try {
      await axios.delete(`${API}/appointments/${id}`, { headers });
      await fetchData();
    } catch (error: any) { alert(error.response?.data?.message || 'Suppression impossible.'); }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_60%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-3xl font-black tracking-tight">Agenda Clinique</h1>
          <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-teal-50">
            <Plus className="h-4 w-4" /> Nouveau rendez-vous
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Rendez-vous totaux', value: appointments.length, icon: CalendarDays },
          { label: "Aujourd'hui", value: todayAppointments.length, icon: Clock3 },
          { label: 'Patients concernés', value: new Set(appointments.map(a => a.patientId?._id || a.patientId)).size, icon: UserRound },
        ].map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-teal-50 p-3 text-teal-700"><Icon className="h-5 w-5" /></div>
              <span className="text-3xl font-black text-slate-900">{value}</span>
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Planning des rendez-vous</h2>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un rendez-vous..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('date')}>Date <SortIcon col="date" /></th>
                <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('patientName')}>Patient <SortIcon col="patientName" /></th>
                <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('reason')}>Motif <SortIcon col="reason" /></th>
                <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('status')}>Statut <SortIcon col="status" /></th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-16 text-center text-sm font-medium text-slate-400">
                  {search ? `Aucun rendez-vous pour « ${search} ».` : 'Aucun rendez-vous planifié.'}
                </td></tr>
              ) : paginatedAppointments.map(appointment => (
                <tr key={appointment._id} className="border-t border-slate-100">
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                    {new Date(appointment.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {appointment.patientName || `${appointment.patientId?.firstName || ''} ${appointment.patientId?.lastName || ''}`}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{appointment.reason}</p>
                    <p className="mt-1 text-xs text-slate-500">{appointment.notes || 'Sans note'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleStatus(appointment)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition hover:opacity-80 ${statusStyles[appointment.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {['EnCours', 'Scheduled', 'Pending'].includes(appointment.status)
                        ? <Circle className="h-3 w-3" />
                        : <CheckCircle2 className="h-3 w-3" />}
                      {statusLabels[appointment.status] || appointment.status}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(appointment)} className="rounded-xl bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeAppointment(appointment._id)} className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalItems={filteredSortedAppointments.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </section>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Patient *</label>
            <select required value={form.patientId} onChange={e => setForm(c => ({ ...c, patientId: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10">
              <option value="">Sélectionner un patient...</option>
              {patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Motif *</label>
            <select required value={form.reason} onChange={e => setForm(c => ({ ...c, reason: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10">
              <option value="">Sélectionner un motif...</option>
              {MOTIFS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {form.reason === 'Autres' && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Précisez le motif *</label>
              <textarea required rows={2} value={form.otherReason} onChange={e => setForm(c => ({ ...c, otherReason: e.target.value }))} placeholder="Décrivez..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Date *</label>
              <input required type="date" value={form.date} onChange={e => setForm(c => ({ ...c, date: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Heure *</label>
              <input required type="time" value={form.time} onChange={e => setForm(c => ({ ...c, time: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Statut</label>
            <div className="flex gap-3">
              {(['EnCours', 'Termine'] as const).map(s => (
                <button key={s} type="button" onClick={() => setForm(c => ({ ...c, status: s }))}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-bold transition ${form.status === s ? (s === 'Termine' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 text-amber-700') : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                  {s === 'EnCours' ? '🔵 En cours' : '✅ Terminé'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Notes de consultation</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(c => ({ ...c, notes: e.target.value }))} placeholder="Précisions..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={closeModal} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200">Annuler</button>
            <button type="submit" disabled={loading} className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60">
              {loading ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le rendez-vous'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
