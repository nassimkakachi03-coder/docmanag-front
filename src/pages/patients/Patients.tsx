import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import {
  Archive,
  ArrowUpDown,
  BadgeCheck,
  FileText,
  Globe,
  Mail,
  Pencil,
  Phone,
  Search,
  ShieldCheck,
  Stethoscope,
  UserPlus,
} from 'lucide-react';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL;

const emptyForm = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  email: '',
  medicalHistory: '',
  caseSummary: '',
  careNotes: '',
  xRayUrl: '',
  prescriptionUrl: '',
};

const sourceConfig: Record<string, { label: string; className: string }> = {
  admin: { label: 'Cree au cabinet', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  landing: { label: 'Depuis le site', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'patient-portal': { label: 'Compte patient', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const formatDate = (value?: string) => {
  if (!value) return 'Non renseigne';
  return new Date(value).toLocaleDateString('fr-FR');
};

export default function Patients() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };

  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<'name' | 'phone' | 'source' | 'updatedAt'>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  const handleSort = (key: 'name' | 'phone' | 'source' | 'updatedAt') => {
    if (sortKey === key) setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: string }) => (
    <ArrowUpDown className={`ml-1 inline h-3 w-3 ${sortKey === col ? 'text-teal-600' : 'text-slate-400'}`} />
  );

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`, { headers });
      setPatients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) void fetchPatients();
  }, [token]);

  const stats = useMemo(() => {
    const withPortal = patients.filter((patient) => Boolean(patient.accountId)).length;
    const fromLanding = patients.filter((patient) => patient.source === 'landing').length;
    const withXRay = patients.filter((patient) => Boolean(patient.xRayUrl)).length;

    return [
      { label: 'Dossiers actifs', value: patients.length, icon: FileText },
      { label: 'Comptes prives', value: withPortal, icon: ShieldCheck },
      { label: 'Demandes web', value: fromLanding, icon: Globe },
      { label: 'Radios disponibles', value: withXRay, icon: Stethoscope },
    ];
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = query
      ? patients.filter((patient) =>
          [patient.firstName, patient.lastName, patient.phone, patient.email, patient.caseSummary, patient.medicalHistory]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(query)
        )
      : [...patients];

    list.sort((left, right) => {
      let leftValue: any;
      let rightValue: any;

      if (sortKey === 'name') {
        leftValue = `${left.firstName} ${left.lastName}`.toLowerCase();
        rightValue = `${right.firstName} ${right.lastName}`.toLowerCase();
      } else if (sortKey === 'phone') {
        leftValue = (left.phone || '').toLowerCase();
        rightValue = (right.phone || '').toLowerCase();
      } else if (sortKey === 'source') {
        leftValue = (left.source || '').toLowerCase();
        rightValue = (right.source || '').toLowerCase();
      } else {
        leftValue = new Date(left.updatedAt || left.createdAt).getTime();
        rightValue = new Date(right.updatedAt || right.createdAt).getTime();
      }

      if (leftValue < rightValue) return sortDir === 'asc' ? -1 : 1;
      if (leftValue > rightValue) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [patients, search, sortKey, sortDir]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortKey, sortDir]);

  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(start, start + itemsPerPage);
  }, [filteredPatients, currentPage]);

  const openCreateModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (patient: any) => {
    setEditing(patient);
    setForm({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      dateOfBirth: patient.dateOfBirth?.slice(0, 10) || '',
      gender: patient.gender || '',
      phone: patient.phone || '',
      email: patient.email || '',
      medicalHistory: patient.medicalHistory || '',
      caseSummary: patient.caseSummary || '',
      careNotes: patient.careNotes || '',
      xRayUrl: patient.xRayUrl || '',
      prescriptionUrl: patient.prescriptionUrl || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: 'xRayUrl' | 'prescriptionUrl') => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result;
      if (typeof result === 'string') {
        setForm((current) => ({ ...current, [field]: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload: Record<string, any> = {
        ...form,
        gender: form.gender || '',
      };

      if (!payload.dateOfBirth) delete payload.dateOfBirth;

      if (editing) {
        await axios.put(`${API}/patients/${editing._id}`, payload, { headers });
      } else {
        await axios.post(`${API}/patients`, payload, { headers });
      }

      await fetchPatients();
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.message || "Impossible d'enregistrer le dossier patient.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Archiver ce dossier patient ?')) return;

    try {
      await axios.delete(`${API}/patients/${id}`, { headers });
      await fetchPatients();
    } catch (error: any) {
      alert(error.response?.data?.message || "Archivage impossible.");
    }
  };

  const renderInput = (
    label: string,
    key: keyof typeof form,
    options?: { type?: string; required?: boolean; placeholder?: string }
  ) => (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-slate-700">
        {label}
        {options?.required ? ' *' : ''}
      </label>
      <input
        required={options?.required}
        type={options?.type || 'text'}
        value={form[key]}
        onChange={(inputEvent) => setForm((current) => ({ ...current, [key]: inputEvent.target.value }))}
        placeholder={options?.placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.25),_transparent_60%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black tracking-tight">Dossiers Patients</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/archives')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-teal-50"
            >
              <UserPlus className="h-4 w-4" />
              Nouveau dossier
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-3xl font-black text-slate-900">{value}</span>
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Base patients</h2>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un patient..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('name')}>
                  Patient <SortIcon col="name" />
                </th>
                <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('phone')}>
                  Contact <SortIcon col="phone" />
                </th>
                <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('source')}>
                  Origine <SortIcon col="source" />
                </th>
                <th className="px-5 py-4">Compte</th>
                <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('updatedAt')}>
                  Mise a jour <SortIcon col="updatedAt" />
                </th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm font-medium text-slate-400">
                    {search ? `Aucun resultat pour "${search}".` : 'Aucun patient enregistre pour le moment.'}
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => {
                  const source = sourceConfig[patient.source || 'admin'] || sourceConfig.admin;
                  const initials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase();

                  return (
                    <tr
                      key={patient._id}
                      className="border-t border-slate-100 transition hover:bg-slate-50"
                      onDoubleClick={() => navigate(`/patients/${patient._id}/history`)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-sm font-black text-white">
                            {initials || 'P'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{patient.caseSummary || 'Aucun resume de cas saisi'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-sm text-slate-600">
                          <p className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {patient.phone || 'Non renseigne'}
                          </p>
                          <p className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {patient.email || 'Non renseigne'}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${source.className}`}>{source.label}</span>
                      </td>
                      <td className="px-5 py-4">
                        {patient.accountId ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Prive
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Aucun compte</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{formatDate(patient.updatedAt || patient.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                          <button
                            onClick={() => openEditModal(patient)}
                            className="rounded-xl bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(patient._id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                            title="Archiver"
                          >
                            <Archive className="h-4 w-4" />
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredPatients.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </section>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Mettre a jour le dossier patient' : 'Creer un dossier patient'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {renderInput('Prenom', 'firstName', { required: true, placeholder: 'Ex: Yasmine' })}
            {renderInput('Nom', 'lastName', { required: true, placeholder: 'Ex: Benali' })}
            {renderInput('Telephone', 'phone', { required: true, placeholder: '0550 00 00 00' })}
            {renderInput('Email', 'email', { type: 'email', placeholder: 'patient@email.com' })}
            {renderInput('Date de naissance', 'dateOfBirth', { type: 'date' })}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Genre</label>
              <select
                value={form.gender}
                onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              >
                <option value="">Non renseigne</option>
                <option value="Male">Homme</option>
                <option value="Female">Femme</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Radiographie (Image)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleFileChange(event, 'xRayUrl')}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 file:mr-4 file:rounded-full file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
              />
              {form.xRayUrl && <p className="text-xs font-bold text-teal-600">Image prete</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Ordonnance (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(event) => handleFileChange(event, 'prescriptionUrl')}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 file:mr-4 file:rounded-full file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
              />
              {form.prescriptionUrl && <p className="text-xs font-bold text-teal-600">Fichier pret</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Resume du cas</label>
              <textarea
                rows={4}
                value={form.caseSummary}
                onChange={(event) => setForm((current) => ({ ...current, caseSummary: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                placeholder="Ce qu'il faut retenir rapidement du dossier..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Notes de suivi</label>
              <textarea
                rows={4}
                value={form.careNotes}
                onChange={(event) => setForm((current) => ({ ...current, careNotes: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                placeholder="Informations pratiques, sensibilites, remarques cliniques..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Antecedents / historique medical</label>
            <textarea
              rows={5}
              value={form.medicalHistory}
              onChange={(event) => setForm((current) => ({ ...current, medicalHistory: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              placeholder="Antecedents, allergies, contexte ou demandes du patient..."
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? 'Enregistrement...' : editing ? 'Enregistrer les changements' : 'Creer le dossier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
