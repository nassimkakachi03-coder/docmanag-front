import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Archive, CalendarDays, FileText, ReceiptText, Search, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL;

const formatDateTime = (value?: string) => {
  if (!value) return 'Non renseigne';
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
};

const formatDate = (value?: string) => {
  if (!value) return 'Non renseigne';
  return new Date(value).toLocaleDateString('fr-FR');
};

export default function Archives() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [archives, setArchives] = useState<any[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<any | null>(null);
  const [selectedArchiveId, setSelectedArchiveId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArchives = async () => {
      if (!token) return;

      try {
        const response = await axios.get(`${API}/patients/archives`, { headers });
        const list = Array.isArray(response.data) ? response.data : [];
        setArchives(list);
        setSelectedArchiveId((current) => current || list[0]?._id || '');
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadArchives();
  }, [token]);

  useEffect(() => {
    const loadArchiveDetails = async () => {
      if (!selectedArchiveId) {
        setSelectedArchive(null);
        return;
      }

      try {
        const response = await axios.get(`${API}/patients/archives/${selectedArchiveId}`, { headers });
        setSelectedArchive(response.data);
      } catch (error) {
        console.error(error);
        setSelectedArchive(null);
      }
    };

    void loadArchiveDetails();
  }, [selectedArchiveId, token]);

  const filteredArchives = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return archives;

    return archives.filter((archive) => {
      const patient = archive.patient || {};
      return [patient.firstName, patient.lastName, patient.phone, patient.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [archives, search]);

  useEffect(() => {
    if (filteredArchives.length === 0) {
      setSelectedArchiveId('');
      return;
    }

    if (!filteredArchives.find((archive) => archive._id === selectedArchiveId) && filteredArchives[0]) {
      setSelectedArchiveId(filteredArchives[0]._id);
    }
  }, [filteredArchives, selectedArchiveId]);

  const stats = useMemo(() => {
    const totalAppointments = archives.reduce((sum, archive) => sum + (archive.stats?.appointmentCount || 0), 0);
    return [
      { label: 'Dossiers archives', value: archives.length, icon: Archive },
      { label: 'RDV conserves', value: totalAppointments, icon: CalendarDays },
      { label: 'Ordonnances', value: archives.reduce((sum, archive) => sum + (archive.stats?.prescriptionCount || 0), 0), icon: FileText },
      { label: 'Factures / paiements', value: archives.reduce((sum, archive) => sum + (archive.stats?.invoiceCount || 0) + (archive.stats?.paymentCount || 0), 0), icon: ReceiptText },
    ];
  }, [archives]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-8 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(148,163,184,0.25),_transparent_60%)]" />
        <div className="relative">
          <h1 className="text-3xl font-black tracking-tight">Archive</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200">
            Les dossiers supprimes sont conserves ici avec leurs informations et leurs rendez-vous precedents.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-3xl font-black text-slate-900">{value}</span>
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.4fr)]">
        <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5">
            <h2 className="text-lg font-black text-slate-900">Dossiers archives</h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher dans l'archive..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredArchives.length === 0 ? (
              <div className="p-8 text-sm text-slate-500">Aucun dossier archive.</div>
            ) : (
              filteredArchives.map((archive) => {
                const patient = archive.patient || {};
                const isActive = selectedArchiveId === archive._id;
                return (
                  <button
                    key={archive._id}
                    type="button"
                    onClick={() => setSelectedArchiveId(archive._id)}
                    className={`flex w-full items-start justify-between gap-4 p-5 text-left transition ${isActive ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                  >
                    <div>
                      <p className="text-base font-black text-slate-900">
                        {patient.firstName || 'Patient'} {patient.lastName || ''}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{patient.phone || patient.email || 'Aucune coordonnee'}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Archive le {formatDateTime(archive.deletedAt)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{archive.stats?.appointmentCount || 0} RDV</p>
                      <p>{archive.stats?.prescriptionCount || 0} ordonnances</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          {!selectedArchive ? (
            <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">Selectionnez un dossier archive.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Dossier archive</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">
                    {selectedArchive.patient?.firstName} {selectedArchive.patient?.lastName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Archive le {formatDateTime(selectedArchive.deletedAt)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p>Supprime par: {selectedArchive.deletedBy?.role || 'Admin'}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <UserRound className="h-4 w-4" />
                    <p className="font-black">Informations patient</p>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-900">Telephone:</span> {selectedArchive.patient?.phone || 'Non renseigne'}</p>
                    <p><span className="font-semibold text-slate-900">Email:</span> {selectedArchive.patient?.email || 'Non renseigne'}</p>
                    <p><span className="font-semibold text-slate-900">Date de naissance:</span> {formatDate(selectedArchive.patient?.dateOfBirth)}</p>
                    <p><span className="font-semibold text-slate-900">Source:</span> {selectedArchive.patient?.source || 'admin'}</p>
                  </div>
                </div>

                <div className="rounded-[24px] bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="font-black">Contexte medical</p>
                  </div>
                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    <p className="whitespace-pre-wrap">{selectedArchive.patient?.medicalHistory || 'Aucun antecedent enregistre.'}</p>
                    <p className="whitespace-pre-wrap">{selectedArchive.patient?.careNotes || 'Aucune note interne.'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 p-4">
                <h3 className="text-base font-black text-slate-900">Rendez-vous precedents</h3>
                <div className="mt-4 space-y-3">
                  {(selectedArchive.appointments || []).length === 0 ? (
                    <p className="text-sm text-slate-500">Aucun rendez-vous archive.</p>
                  ) : (
                    selectedArchive.appointments.map((appointment: any) => (
                      <article key={appointment._id || `${appointment.date}-${appointment.reason}`} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="font-bold text-slate-900">{appointment.reason || 'Consultation'}</p>
                            <p className="mt-1 text-sm text-slate-600">{appointment.notes || 'Sans note'}</p>
                          </div>
                          <div className="text-sm text-slate-500 lg:text-right">
                            <p className="font-semibold text-slate-900">{formatDateTime(appointment.date)}</p>
                            <p className="mt-1">{appointment.status || 'Archive'}</p>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <article className="rounded-[24px] bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ordonnances</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{selectedArchive.stats?.prescriptionCount || 0}</p>
                </article>
                <article className="rounded-[24px] bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Factures</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{selectedArchive.stats?.invoiceCount || 0}</p>
                </article>
                <article className="rounded-[24px] bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Paiements</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{selectedArchive.stats?.paymentCount || 0}</p>
                </article>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
