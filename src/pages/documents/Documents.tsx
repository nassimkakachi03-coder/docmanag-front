import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp, Download, Pencil, Pill, Plus, Search, Trash2, X } from 'lucide-react';
import jsPDF from 'jspdf';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL;

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const emptyMedication = (): Medication => ({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });

const COMMON_MEDS = [
  'Amoxicilline', 'Augmentin', 'Metronidazole', 'Ibuprofène', 'Paracétamol',
  'Doliprane', 'Prednisolone', 'Chlorhexidine', 'Voltarène', 'Codéine',
  'Tramadol', 'Eludril', 'Hexetidine', 'Nifluril',
];

const generatePrescriptionPDF = (prescription: any) => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const pn = prescription.patientName || (prescription.patientId?.firstName ? `${prescription.patientId.firstName} ${prescription.patientId.lastName}` : 'Patient');

  doc.setFillColor(15, 118, 110); doc.rect(0, 0, pw, 38, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
  doc.text('ORDONNANCE', pw / 2, 18, { align: 'center' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Cabinet Dentaire Dr Kakachi • ${new Date(prescription.date || Date.now()).toLocaleDateString('fr-FR')}`, pw / 2, 28, { align: 'center' });

  doc.setTextColor(30, 41, 59); doc.setFillColor(248, 250, 252); doc.rect(14, 48, pw - 28, 26, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Patient', 20, 60);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(pn, 20, 68);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Médicaments prescrits', 20, 92); doc.line(20, 94, 104, 94);

  let y = 106;
  (prescription.medications || []).forEach((m: any, i: number) => {
    doc.setFillColor(248, 250, 252); doc.roundedRect(14, y - 7, pw - 28, 28, 4, 4, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 118, 110);
    doc.text(`${i + 1}. ${m.name}`, 20, y);
    doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`Dosage: ${m.dosage || '-'} • Fréquence: ${m.frequency || '-'} • Durée: ${m.duration || '-'}`, 20, y + 8);
    if (m.instructions) { const ins = doc.splitTextToSize(`Conseil: ${m.instructions}`, pw - 48); doc.text(ins, 20, y + 15); y += 22 + ins.length * 4; } else { y += 32; }
  });

  if (prescription.notes) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('Notes générales', 20, y + 4);
    doc.setFont('helvetica', 'normal'); const nl = doc.splitTextToSize(prescription.notes, pw - 40); doc.text(nl, 20, y + 12); y += 12 + nl.length * 5;
  }
  y = Math.max(y + 28, 240); doc.line(pw - 80, y, pw - 16, y); doc.setFontSize(9); doc.text('Signature et cachet', pw - 80, y + 6);
  doc.save(`ordonnance-${pn.replace(/\s+/g, '_')}.pdf`);
};

export default function Documents() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [medications, setMedications] = useState<Medication[]>([emptyMedication()]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedMed, setExpandedMed] = useState<number | null>(0);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const [pr, pa] = await Promise.all([axios.get(`${API}/prescriptions`, { headers }), axios.get(`${API}/patients`, { headers })]);
      const sortedPrescriptions = (Array.isArray(pr.data) ? pr.data : []).sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
      setPrescriptions(sortedPrescriptions);
      setPatients(Array.isArray(pa.data) ? pa.data : []);
    } catch { /* skip */ }
  };

  useEffect(() => { if (token) void fetchData(); }, [token]);

  const filteredPrescriptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return prescriptions;
    return prescriptions.filter((p) => {
      const pn = p.patientName || `${p.patientId?.firstName || ''} ${p.patientId?.lastName || ''}`;
      return [pn, ...(p.medications || []).map((m: any) => m.name), p.notes].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [prescriptions, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const paginatedPrescriptions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPrescriptions.slice(start, start + itemsPerPage);
  }, [filteredPrescriptions, currentPage]);

  const addMedication = () => { setMedications((c) => [...c, emptyMedication()]); setExpandedMed(medications.length); };
  const removeMedication = (i: number) => { setMedications((c) => c.filter((_, ci) => ci !== i)); if (expandedMed === i) setExpandedMed(null); };
  const updateMedication = (i: number, f: keyof Medication, v: string) => { setMedications((c) => c.map((m, ci) => (ci === i ? { ...m, [f]: v } : m))); };

  const openCreateModal = () => {
    setEditing(null);
    setSelectedPatientId('');
    setMedications([emptyMedication()]);
    setNotes('');
    setError('');
    setExpandedMed(0);
    setModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditing(p);
    setSelectedPatientId(p.patientId?._id || p.patientId || '');
    setMedications(p.medications?.length > 0 ? p.medications : [emptyMedication()]);
    setNotes(p.notes || '');
    setError('');
    setExpandedMed(0);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setError('');
    if (!selectedPatientId) { setError('Veuillez sélectionner un patient.'); setLoading(false); return; }
    if (medications.some((m) => !m.name.trim() || !m.dosage.trim())) { setError('Chaque médicament doit contenir un nom et un dosage.'); setLoading(false); return; }

    const sp = patients.find((p) => p._id === selectedPatientId);
    const doctorId = typeof user?.id === 'string' && /^[a-fA-F0-9]{24}$/.test(user.id) ? user.id : undefined;
    
    try {
      const payload = {
        patientId: selectedPatientId, 
        patientName: sp ? `${sp.firstName} ${sp.lastName}` : '',
        doctorName: user?.name ? `Dr ${user.name}` : 'Cabinet Dr Kakachi', 
        medications, 
        notes,
        ...(doctorId ? { doctorId } : {}), 
        date: editing ? editing.date : new Date().toISOString(),
      };

      let responseData;
      if (editing) {
        const r = await axios.put(`${API}/prescriptions/${editing._id}`, payload, { headers });
        responseData = r.data;
      } else {
        const r = await axios.post(`${API}/prescriptions`, payload, { headers });
        responseData = r.data;
      }
      
      closeModal(); 
      await fetchData();
      
      if (!editing) {
        generatePrescriptionPDF({ ...responseData, patientName: sp ? `${sp.firstName} ${sp.lastName}` : responseData.patientName });
      }
    } catch (err: any) { setError(err.response?.data?.message || "Impossible de sauvegarder l'ordonnance."); }
    finally { setLoading(false); }
  };

  const removePrescription = async (id: string) => {
    if (!window.confirm('Supprimer cette ordonnance ?')) return;
    try { await axios.delete(`${API}/prescriptions/${id}`, { headers }); await fetchData(); } catch (err: any) { alert(err.response?.data?.message || 'Suppression impossible.'); }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-900 p-6 text-white shadow-xl sm:rounded-[32px] sm:p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(167,139,250,0.2),_transparent_60%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-xl font-black tracking-tight sm:text-2xl lg:text-3xl">Ordonnances</h1>
          </div>
          <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-violet-50">
            <Plus className="h-4 w-4" /> Nouvelle ordonnance
          </button>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm sm:rounded-[30px]">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 sm:text-lg">Historique des ordonnances</h2>
            <p className="text-xs text-slate-500 sm:text-sm">Les créations sont rechargées après enregistrement.</p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
                <th className="px-4 py-3 sm:px-5 sm:py-4">Date</th>
                <th className="px-4 py-3 sm:px-5 sm:py-4">Patient</th>
                <th className="hidden px-5 py-4 sm:table-cell">Médicaments</th>
                <th className="hidden px-5 py-4 md:table-cell">Notes</th>
                <th className="px-4 py-3 text-right sm:px-5 sm:py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPrescriptions.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-16 text-center text-sm font-medium text-slate-400">
                  {search ? `Aucune ordonnance pour « ${search} ».` : 'Aucune ordonnance enregistrée.'}
                </td></tr>
              ) : paginatedPrescriptions.map((p) => (
                <tr key={p._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 sm:px-5 sm:py-4">{new Date(p.date || p.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 sm:px-5 sm:py-4">{p.patientName || `${p.patientId?.firstName || ''} ${p.patientId?.lastName || ''}`}</td>
                  <td className="hidden px-5 py-4 text-sm text-slate-600 sm:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {(p.medications || []).slice(0, 3).map((m: any, i: number) => (
                        <span key={`${p._id}-${i}`} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">{m.name}</span>
                      ))}
                      {(p.medications || []).length > 3 && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">+{p.medications.length - 3}</span>}
                    </div>
                  </td>
                  <td className="hidden px-5 py-4 text-sm text-slate-500 md:table-cell">{p.notes || '-'}</td>
                  <td className="px-4 py-3 sm:px-5 sm:py-4">
                    <div className="flex justify-end gap-1.5 sm:gap-2">
                      <button onClick={() => generatePrescriptionPDF(p)} className="rounded-xl bg-violet-50 p-2 text-violet-700 transition hover:bg-violet-100" title="Télécharger PDF"><Download className="h-4 w-4" /></button>
                      <button onClick={() => openEditModal(p)} className="rounded-xl bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100" title="Modifier"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => removePrescription(p._id)} className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage} 
          totalItems={filteredPrescriptions.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </section>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? "Modifier l'ordonnance" : "Créer une ordonnance"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Patient *</label>
            <select required value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10">
              <option value="">Sélectionner un patient...</option>
              {patients.map((p) => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">Médicaments ({medications.length})</p>
                <p className="text-xs text-slate-500">Cliquez sur un médicament pour voir/modifier les détails.</p>
              </div>
              <button type="button" onClick={addMedication} className="inline-flex items-center gap-1.5 rounded-2xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </button>
            </div>

            <div className="space-y-2">
              {medications.map((med, i) => {
                const isExpanded = expandedMed === i;
                return (
                  <div key={i} className={`rounded-[20px] border transition-all ${isExpanded ? 'border-violet-200 bg-violet-50/30 shadow-sm' : 'border-slate-200 bg-slate-50'}`}>
                    {/* Header — always visible */}
                    <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpandedMed(isExpanded ? null : i)}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Pill className="h-3.5 w-3.5" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{med.name || `Médicament ${i + 1}`}</p>
                        {med.dosage && <p className="text-xs text-slate-500 truncate">{med.dosage}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        {medications.length > 1 && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeMedication(i); }} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-slate-200/60 p-3 pt-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nom *</label>
                            <div className="relative">
                              <input required value={med.name} onChange={(e) => updateMedication(i, 'name', e.target.value)} placeholder="Ex: Amoxicilline" list={`med-suggestions-${i}`}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10" />
                              <datalist id={`med-suggestions-${i}`}>
                                {COMMON_MEDS.filter((m) => !medications.some((ex, ei) => ei !== i && ex.name === m)).map((m) => <option key={m} value={m} />)}
                              </datalist>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dosage *</label>
                            <input required value={med.dosage} onChange={(e) => updateMedication(i, 'dosage', e.target.value)} placeholder="Ex: 500mg"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fréquence</label>
                            <input value={med.frequency} onChange={(e) => updateMedication(i, 'frequency', e.target.value)} placeholder="Ex: 3x/jour"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Durée</label>
                            <input value={med.duration} onChange={(e) => updateMedication(i, 'duration', e.target.value)} placeholder="Ex: 7 jours"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10" />
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Instructions</label>
                          <textarea rows={2} value={med.instructions} onChange={(e) => updateMedication(i, 'instructions', e.target.value)} placeholder="Conseil spécifique..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Notes générales</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: prendre après les repas, revoir dans 7 jours..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10" />
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <button type="button" onClick={closeModal} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200">Annuler</button>
            <button type="submit" disabled={loading} className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {loading ? 'Sauvegarde...' : editing ? 'Mettre à jour' : 'Créer et télécharger'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
