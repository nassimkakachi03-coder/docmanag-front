import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Trash2, Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import Modal from '../../components/Modal';

const API = import.meta.env.VITE_API_URL;

function generatePrescriptionPDF(prescription: any) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(13, 148, 136); // teal-600
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDONNANCE MÉDICALE', pageW / 2, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Dental Clinic Management System', pageW / 2, 28, { align: 'center' });
  doc.text(`Date: ${new Date(prescription.date || Date.now()).toLocaleDateString('fr-FR')}`, pageW / 2, 36, { align: 'center' });

  doc.setTextColor(30, 41, 59);

  // Patient section
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 48, pageW - 28, 28, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS PATIENT', 20, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const patientName = prescription.patientName || (prescription.patientId?.firstName ? `${prescription.patientId.firstName} ${prescription.patientId.lastName}` : 'N/A');
  doc.text(`Nom Complet: ${patientName}`, 20, 68);
  doc.text(`Date de Naissance: ${prescription.patientDob || prescription.patientId?.dateOfBirth?.substring(0, 10) || 'N/A'}`, pageW / 2, 68);

  // Doctor section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PRESCRIPTEUR', 20, 90);
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(0.5);
  doc.line(20, 92, 80, 92);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const doctorName = prescription.doctorName || (prescription.doctorId?.name ? `Dr. ${prescription.doctorId.name}` : 'Administrateur');
  doc.text(`${doctorName}`, 20, 100);

  // Medications
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('MÉDICAMENTS PRESCRITS', 20, 118);
  doc.line(20, 120, 120, 120);

  let y = 130;
  const meds = prescription.medications || [];
  if (meds.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Aucun médicament spécifié.', 20, y);
    y += 10;
  } else {
    meds.forEach((med: any, idx: number) => {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 6, pageW - 28, 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(13, 148, 136);
      doc.text(`${idx + 1}. ${med.name || 'Médicament'}`, 20, y + 2);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Dosage: ${med.dosage || '-'} | Fréquence: ${med.frequency || '-'} | Durée: ${med.duration || '-'}`, 26, y + 12);
      y += 28;
    });
  }

  // Notes
  if (prescription.notes) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes / Instructions:', 20, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(prescription.notes, pageW - 40);
    doc.text(lines, 20, y + 8);
    y += 8 + lines.length * 6;
  }

  // Signature zone
  y = Math.max(y + 20, 230);
  doc.setDrawColor(100, 116, 139);
  (doc as any).setLineDash([2, 2]);
  doc.line(pageW - 80, y, pageW - 14, y);
  (doc as any).setLineDash([]);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Signature & Cachet du Médecin', pageW - 80, y + 7);

  // Footer
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 282, pageW, 15, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Document généré automatiquement par le Système de Gestion de Clinique Dentaire', pageW / 2, 290, { align: 'center' });
  doc.text(`Réf: PRESC-${prescription._id?.substring(0, 8).toUpperCase() || 'N/A'}`, pageW / 2, 295, { align: 'center' });

  doc.save(`ordonnance-${patientName.replace(/\s/g, '_')}-${new Date().toLocaleDateString('fr-FR').replace(/\//g,'')}.pdf`);
}

export default function Documents() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [pRes, patRes] = await Promise.all([
        axios.get(`${API}/prescriptions`, { headers }),
        axios.get(`${API}/patients`, { headers })
      ]);
      setPrescriptions(pRes.data);
      setPatients(patRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const patientId = fd.get('patientId') as string;
    const selectedPatient = patients.find(p => p._id === patientId);

    const data = {
      patientId,
      patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '',
      patientDob: selectedPatient?.dateOfBirth?.substring(0, 10) || '',
      doctorId: user?.id,
      doctorName: user?.name ? `Dr. ${user.name}` : 'Administrateur',
      medications: [{
        name: fd.get('medName') as string,
        dosage: fd.get('medDosage') as string,
        frequency: fd.get('medFreq') as string,
        duration: fd.get('medDuration') as string
      }],
      notes: fd.get('notes') as string,
      date: new Date().toISOString()
    };

    try {
      const res = await axios.post(`${API}/prescriptions`, data, { headers });
      setModalOpen(false);
      const newPrescriptions = [res.data, ...prescriptions];
      setPrescriptions(newPrescriptions);
      // Auto-generate PDF immediately after creation
      generatePrescriptionPDF(res.data);
    } catch (err: any) {
      setError(`Erreur lors de la création: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette ordonnance ?')) return;
    try {
      await axios.delete(`${API}/prescriptions/${id}`, { headers });
      setPrescriptions(prescriptions.filter(p => p._id !== id));
    } catch (err) { alert('Erreur lors de la suppression.'); }
  };

  const filtered = prescriptions.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.patientName || '').toLowerCase().includes(q) ||
      (`${p.patientId?.firstName || ''} ${p.patientId?.lastName || ''}`).toLowerCase().includes(q) ||
      (p.medications?.[0]?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ordonnances & Certificats</h1>
          <p className="text-sm text-slate-500 mt-1">Rédigez des ordonnances et générez un PDF automatiquement.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2">
          <FileText className="w-4 h-4"/> Nouvelle Ordonnance
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par patient ou médicament..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">✕</button>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Patient</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Médicament</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Notes</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium">
                {search ? `Aucun résultat pour « ${search} »` : 'Aucune ordonnance enregistrée.'}
              </td></tr>
            ) : filtered.map(doc => (
              <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-sm font-semibold text-slate-700">{new Date(doc.date || Date.now()).toLocaleDateString('fr-FR')}</td>
                <td className="p-4 text-sm font-bold text-teal-700">{doc.patientName || `${doc.patientId?.firstName || ''} ${doc.patientId?.lastName || ''}`}</td>
                <td className="p-4 text-sm text-slate-600">{doc.medications?.[0]?.name || '-'}</td>
                <td className="p-4 text-sm text-slate-500 max-w-[200px] truncate">{doc.notes || '-'}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => generatePrescriptionPDF(doc)} className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors" title="Télécharger PDF">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(doc._id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setError(''); }} title="Nouvelle Ordonnance" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Patient *</label>
            <select required name="patientId" className="w-full border border-slate-300 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500 text-sm">
              <option value="">Sélectionnez un patient...</option>
              {patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>)}
            </select>
            {patients.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠ Aucun patient trouvé. Ajoutez d'abord un patient.</p>}
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-bold text-slate-700 mb-3">Médicament prescrit</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du médicament *</label>
                <input required name="medName" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500 text-sm" placeholder="Ex: Doliprane 1000mg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dosage *</label>
                <input required name="medDosage" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500 text-sm" placeholder="Ex: 1000mg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fréquence *</label>
                <input required name="medFreq" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500 text-sm" placeholder="Ex: 3 fois par jour" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Durée du traitement *</label>
                <input required name="medDuration" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500 text-sm" placeholder="Ex: 5 jours" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes / Instructions</label>
            <textarea name="notes" rows={2} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none" placeholder="Ex: Prendre au milieu des repas..." />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">Annuler</button>
            <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2">
              <Download className="w-4 h-4" />
              {loading ? 'Génération...' : 'Créer & Télécharger PDF'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
