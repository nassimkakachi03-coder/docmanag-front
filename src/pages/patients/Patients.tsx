import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Trash2, UserPlus, Pencil, Globe } from 'lucide-react';
import Modal from '../../components/Modal';

const API = import.meta.env.VITE_API_URL;

const emptyForm = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'Male',
  phone: '',
  email: '',
  address: '',
  medicalHistory: '',
};

export default function Patients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${API}/patients`, { headers });
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (token) fetchPatients(); }, [token]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      dateOfBirth: p.dateOfBirth?.substring(0, 10) || '',
      gender: p.gender || 'Male',
      phone: p.phone || '',
      email: p.email || '',
      address: p.address || '',
      medicalHistory: p.medicalHistory || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        const res = await axios.put(`${API}/patients/${editing._id}`, form, { headers });
        setPatients(patients.map(p => p._id === editing._id ? res.data : p));
        if (selectedPatient?._id === editing._id) setSelectedPatient(res.data);
      } else {
        const res = await axios.post(`${API}/patients`, form, { headers });
        setPatients([res.data, ...patients]);
      }
      setModalOpen(false);
    } catch (err) {
      alert("Erreur lors de l'enregistrement.");
    } finally { setLoading(false); }
  };

  const deletePatient = async (id: string) => {
    if (!confirm('Confirmer la suppression ?')) return;
    try { await axios.delete(`${API}/patients/${id}`, { headers }); } catch { }
    setPatients(patients.filter(p => p._id !== id));
    if (selectedPatient?._id === id) setSelectedPatient(null);
  };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q);
  });

  const field = (label: string, key: keyof typeof form, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}{required && ' *'}</label>
      <input
        required={required}
        type={type}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-teal-500 text-sm"
      />
    </div>
  );

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const isFromLanding = (p: any) =>
    (p.medicalHistory || '').toLowerCase().includes('demande de rdv');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dossier Patient Informatisé (DPI)</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez vos dossiers patients complets et leurs historiques.</p>
        </div>
        <button onClick={openAdd} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Nouveau Patient
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, téléphone, email..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">✕</button>}
      </div>

      <div className={`grid gap-6 ${selectedPatient ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1'}`}>
        {/* Table */}
        <div className={`${selectedPatient ? 'xl:col-span-2' : ''} bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Nom Complet', 'Téléphone', 'Email', 'Date Naissance', 'Genre', 'Source', 'Actions'].map(h => (
                    <th key={h} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-400 font-medium">
                    {search ? `Aucun résultat pour « ${search} »` : 'Aucun patient enregistré.'}
                  </td></tr>
                ) : filtered.map(p => (
                  <tr
                    key={p._id}
                    className={`hover:bg-teal-50/30 transition-colors cursor-pointer ${selectedPatient?._id === p._id ? 'bg-teal-50 border-l-4 border-teal-500' : ''}`}
                    onClick={() => setSelectedPatient(selectedPatient?._id === p._id ? null : p)}
                  >
                    <td className="p-4 text-sm font-bold text-slate-800">
                      <span>{p.firstName} {p.lastName}</span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{p.phone || '—'}</td>
                    <td className="p-4 text-sm text-slate-600">{p.email || '—'}</td>
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">{formatDate(p.dateOfBirth)}</td>
                    <td className="p-4 text-sm text-slate-600">
                      {p.gender === 'Male' ? 'Homme' : p.gender === 'Female' ? 'Femme' : '—'}
                    </td>
                    <td className="p-4">
                      {isFromLanding(p) ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full">
                          <Globe className="w-3 h-3" /> Site web
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Admin</span>
                      )}
                    </td>
                    <td className="p-4" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Modifier"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deletePatient(p._id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Patient detail panel */}
        {selectedPatient && (
          <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 self-start sticky top-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-slate-800">Fiche Patient</h2>
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕ Fermer</button>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow ${selectedPatient.gender === 'Female' ? 'bg-pink-500' : 'bg-teal-600'}`}>
                {selectedPatient.firstName?.[0]?.toUpperCase()}{selectedPatient.lastName?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                <p className="text-xs text-slate-400">
                  {selectedPatient.gender === 'Male' ? 'Homme' : selectedPatient.gender === 'Female' ? 'Femme' : 'Genre non renseigné'}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3 text-sm">
              {[
                { label: 'Date de naissance', value: formatDate(selectedPatient.dateOfBirth) },
                { label: 'Téléphone', value: selectedPatient.phone || '—' },
                { label: 'Email', value: selectedPatient.email || '—' },
                { label: 'Adresse', value: selectedPatient.address || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</span>
                  <span className="text-slate-700 break-all">{value}</span>
                </div>
              ))}
            </div>

            {selectedPatient.medicalHistory && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Motif / Historique</p>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{selectedPatient.medicalHistory}</p>
              </div>
            )}

            {isFromLanding(selectedPatient) && (
              <div className="flex items-center gap-1.5 text-xs text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2 font-semibold">
                <Globe className="w-3.5 h-3.5" /> Inscription via le site web
              </div>
            )}

            <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
              Créé le {formatDate(selectedPatient.createdAt)}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le Patient' : 'Nouveau Patient'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field('Prénom', 'firstName', 'text', true)}
            {field('Nom', 'lastName', 'text', true)}
            {field('Date de Naissance', 'dateOfBirth', 'date', true)}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Genre</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-teal-500 text-sm">
                <option value="Male">Homme</option>
                <option value="Female">Femme</option>
              </select>
            </div>
            {field('Téléphone', 'phone', 'text', true)}
            {field('Email', 'email', 'email')}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Adresse</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Historique Médical</label>
            <textarea
              value={form.medicalHistory}
              onChange={e => setForm({ ...form, medicalHistory: e.target.value })}
              rows={3}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
              placeholder="Antécédents, motif de consultation..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Annuler</button>
            <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold transition-colors">
              {loading ? 'Enregistrement...' : (editing ? 'Enregistrer les modifications' : 'Créer le dossier')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
