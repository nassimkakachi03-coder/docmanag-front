import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, ReceiptText, Trash2, Search, Pencil } from 'lucide-react';
import Modal from '../../components/Modal';

const API = import.meta.env.VITE_API_URL;

const statusBadge = (status: string) => {
  if (status === 'Paid') return <span className="text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider">Payée</span>;
  if (status === 'Pending') return <span className="text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider">En Attente</span>;
  if (status === 'Overdue') return <span className="text-red-700 bg-red-100 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider">En Retard</span>;
  return <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase">{status}</span>;
};

const emptyForm = { patientId: '', description: '', amount: 0, currency: 'EUR', status: 'Pending' };

export default function Billing() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [iRes, patRes] = await Promise.all([
        axios.get(`${API}/billing/invoices`, { headers }),
        axios.get(`${API}/patients`, { headers })
      ]);
      setInvoices(iRes.data);
      setPatients(patRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (inv: any) => {
    setEditing(inv);
    setForm({
      patientId: inv.patientId?._id || inv.patientId || '',
      description: inv.items?.[0]?.description || '',
      amount: inv.totalAmount || 0,
      currency: inv.currency || 'EUR',
      status: inv.status || 'Pending'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const selectedPatient = patients.find(p => p._id === form.patientId);
    const payload = {
      patientId: form.patientId,
      patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '',
      totalAmount: form.amount,
      currency: form.currency,
      status: form.status,
      items: [{ description: form.description, amount: form.amount }]
    };
    try {
      if (editing) {
        const updated = { ...editing, ...payload };
        setInvoices(invoices.map(i => i._id === editing._id ? updated : i));
      } else {
        const res = await axios.post(`${API}/billing/invoices`, payload, { headers });
        setInvoices([res.data, ...invoices]);
      }
      setModalOpen(false);
    } catch (err) { alert('Erreur lors de l\'enregistrement.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette facture ?')) return;
    setInvoices(invoices.filter(i => i._id !== id));
  };

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    return (inv.patientName || '').toLowerCase().includes(q) ||
      (inv.items?.[0]?.description || '').toLowerCase().includes(q);
  });

  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + (i.totalAmount || 0), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Facturation & Paiements</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez vos factures et paiements multi-devises.</p>
        </div>
        <button onClick={openAdd} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Nouvelle Facture
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par patient ou description..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">✕</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Factures', value: invoices.length, color: 'bg-slate-50', icon: <ReceiptText className="w-5 h-5 text-slate-500" /> },
          { label: 'Total Encaissé', value: `${totalPaid.toLocaleString()} €`, color: 'bg-emerald-50', icon: <CreditCard className="w-5 h-5 text-emerald-500" /> },
          { label: 'En Attente', value: `${totalPending.toLocaleString()} €`, color: 'bg-amber-50', icon: <ReceiptText className="w-5 h-5 text-amber-500" /> },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 flex items-center gap-4 border border-slate-100`}>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">{s.icon}</div>
            <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{s.label}</p><p className="text-xl font-black text-slate-800">{s.value}</p></div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Référence', 'Patient', 'Description', 'Montant', 'Statut', 'Actions'].map(h => (
                <th key={h} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">
                {search ? `Aucun résultat pour « ${search} »` : 'Aucune facture créée.'}
              </td></tr>
            ) : filtered.map(inv => (
              <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-sm font-black text-slate-700">#{inv._id.toString().substring(0, 8).toUpperCase()}</td>
                <td className="p-4 text-sm font-bold text-teal-700">{inv.patientName || `${inv.patientId?.firstName || ''} ${inv.patientId?.lastName || ''}`}</td>
                <td className="p-4 text-sm text-slate-600">{inv.items?.[0]?.description || '-'}</td>
                <td className="p-4 text-sm font-black text-slate-800">{(inv.totalAmount || 0).toLocaleString()} <span className="text-xs font-semibold text-slate-500">{inv.currency}</span></td>
                <td className="p-4">{statusBadge(inv.status)}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(inv._id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier la Facture' : 'Nouvelle Facture'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Patient *</label>
            <select required value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} className="w-full border border-slate-300 bg-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Sélectionner un patient...</option>
              {patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Description *</label>
            <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex: Détartrage, Pose d'appareil..." className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Montant *</label>
              <input required type="number" min={0} step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Devise</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full border border-slate-300 bg-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500">
                <option value="EUR">Euros (€)</option>
                <option value="MAD">Dirhams (DH)</option>
                <option value="USD">Dollars ($)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Statut</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-slate-300 bg-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500">
              <option value="Pending">En attente</option>
              <option value="Paid">Payé</option>
              <option value="Overdue">En retard</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">Annuler</button>
            <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold">
              {loading ? 'Enregistrement...' : (editing ? 'Enregistrer' : 'Créer la Facture')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
