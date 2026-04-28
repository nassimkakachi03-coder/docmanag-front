import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import axios from 'axios';
import {
  ArrowLeft,
  BadgeEuro,
  CalendarDays,
  Clock3,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Mail,
  Phone,
  ReceiptText,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL;

const timelineStyles: Record<string, string> = {
  appointment: 'bg-teal-50 text-teal-700 border-teal-200',
  prescription: 'bg-violet-50 text-violet-700 border-violet-200',
  invoice: 'bg-amber-50 text-amber-700 border-amber-200',
  payment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const appointmentStatus: Record<string, string> = {
  Scheduled: 'Planifié',
  Completed: 'Terminé',
  Cancelled: 'Annulé',
};

const invoiceStatus: Record<string, string> = {
  Pending: 'En attente',
  Paid: 'Payée',
  Overdue: 'En retard',
  Cancelled: 'Annulée',
};

const paymentMethods: Record<string, string> = {
  Cash: 'Espèces',
  'Credit Card': 'Carte bancaire',
  'Bank Transfer': 'Virement',
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Non renseigné';
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
};

export default function PatientHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const requestedTab = searchParams.get('tab');
  const initialTab =
    requestedTab === 'appointments' || requestedTab === 'prescriptions' || requestedTab === 'billing' || requestedTab === 'timeline'
      ? requestedTab
      : 'timeline';
  const [activeTab, setActiveTab] = useState<'timeline' | 'appointments' | 'prescriptions' | 'billing'>(initialTab);
  const [xRayUrl, setXRayUrl] = useState('');
  const [prescriptionUrl, setPrescriptionUrl] = useState('');
  const [savingUrls, setSavingUrls] = useState(false);

  const loadHistory = async () => {
    if (!token || !id) return;

    try {
      const response = await axios.get(`${API}/patients/${id}/history`, { headers });
      setData(response.data);
      setXRayUrl(response.data.patient?.xRayUrl || '');
      setPrescriptionUrl(response.data.patient?.prescriptionUrl || '');
    } catch (error) {
      console.error(error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, [token, id]);

  useEffect(() => {
    if (requestedTab === 'appointments' || requestedTab === 'prescriptions' || requestedTab === 'billing' || requestedTab === 'timeline') {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'xRay' | 'prescription') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        if (field === 'xRay') setXRayUrl(result);
        if (field === 'prescription') setPrescriptionUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveUrls = async () => {
    setSavingUrls(true);
    try {
      await axios.put(`${API}/patients/${id}`, { xRayUrl, prescriptionUrl }, { headers });
      await loadHistory();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Impossible de sauvegarder les documents.');
    } finally {
      setSavingUrls(false);
    }
  };

  const patient = data?.patient;
  const appointments = data?.appointments || [];
  const prescriptions = data?.prescriptions || [];
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];
  const careTimeline = data?.careTimeline || [];
  const stats = data?.stats || {};

  const summaryCards = useMemo(
    () => [
      { label: 'Soins / RDV', value: stats.appointmentCount || appointments.length, icon: CalendarDays },
      { label: 'Ordonnances', value: stats.prescriptionCount || prescriptions.length, icon: FileText },
      { label: 'Paiements', value: stats.paymentCount || payments.length, icon: BadgeEuro },
      { label: 'Total encaissé', value: `${(stats.totalPaid || 0).toLocaleString('fr-DZ')} DZD`, icon: ReceiptText },
    ],
    [appointments.length, payments.length, prescriptions.length, stats]
  );

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-900">Patient introuvable.</p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/patients')}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-teal-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux dossiers patients
      </button>

      <section className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.28),_transparent_60%)]" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-2">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                {patient.firstName} {patient.lastName}
              </h1>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <Phone className="h-4 w-4" />
                {patient.phone || 'Téléphone non renseigné'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <Mail className="h-4 w-4" />
                {patient.email || 'Email non renseigné'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <Clock3 className="h-4 w-4" />
                Dernier acte: {stats.lastCareDate ? formatDateTime(stats.lastCareDate) : 'Aucun'}
              </span>
            </div>
          </div>

          <div className="grid gap-3 rounded-[28px] bg-white/8 p-4 backdrop-blur-sm">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-100">Confidentialité</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-teal-200" />
                {patient.accountId ? 'Compte patient privé lié' : 'Aucun compte patient lié'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-100">Patient depuis</p>
              <p className="mt-2 text-sm font-semibold">{formatDateTime(patient.createdAt)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-100">Date de naissance</p>
              <p className="mt-2 text-sm font-semibold">{patient.dateOfBirth ? formatDateTime(patient.dateOfBirth) : 'Non renseignée'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black text-slate-900">{value}</span>
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_380px]">
        <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
            {[
              { key: 'timeline', label: 'Timeline du dossier' },
              { key: 'appointments', label: 'Soins / rendez-vous' },
              { key: 'prescriptions', label: 'Ordonnances' },
              { key: 'billing', label: 'Facturation & paiements' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  activeTab === tab.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'timeline' && (
              <div className="space-y-3">
                {careTimeline.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">Aucun élément historique pour ce dossier.</p>
                ) : (
                  careTimeline.map((item: any) => (
                    <article key={`${item.type}-${item.id}`} className="rounded-[26px] border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${timelineStyles[item.type] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {item.type === 'appointment'
                              ? 'Soin / RDV'
                              : item.type === 'prescription'
                                ? 'Ordonnance'
                                : item.type === 'invoice'
                                  ? 'Facture'
                                  : 'Paiement'}
                          </span>
                          <h3 className="mt-3 text-base font-black text-slate-900">{item.label}</h3>
                          {item.note && <p className="mt-2 text-sm text-slate-600">{item.note}</p>}
                        </div>
                        <div className="text-sm text-slate-500 lg:text-right">
                          <p className="font-semibold text-slate-900">{formatDateTime(item.date)}</p>
                          {item.status && <p className="mt-1">{appointmentStatus[item.status] || invoiceStatus[item.status] || paymentMethods[item.status] || item.status}</p>}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">Aucun soin enregistré.</p>
                ) : (
                  appointments.map((appointment: any) => (
                    <article key={appointment._id} className="rounded-[26px] border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="text-base font-black text-slate-900">{appointment.reason || 'Consultation'}</h3>
                          <p className="mt-2 text-sm text-slate-600">{appointment.notes || 'Aucune note associée.'}</p>
                        </div>
                        <div className="text-sm text-slate-500 lg:text-right">
                          <p className="font-semibold text-slate-900">{formatDateTime(appointment.date)}</p>
                          <p className="mt-1">{appointmentStatus[appointment.status] || appointment.status}</p>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <div className="space-y-3">
                {prescriptions.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">Aucune ordonnance enregistrée.</p>
                ) : (
                  prescriptions.map((prescription: any) => (
                    <article key={prescription._id} className="rounded-[26px] border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-base font-black text-slate-900">Ordonnance du {new Date(prescription.date || prescription.createdAt).toLocaleDateString('fr-FR')}</h3>
                            <p className="mt-2 text-sm text-slate-600">{prescription.notes || 'Aucune instruction complémentaire.'}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(prescription.medications || []).map((medication: any, index: number) => (
                              <div key={`${prescription._id}-${index}`} className="rounded-2xl bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700">
                                <p>{medication.name}</p>
                                <p className="text-xs font-medium text-violet-500">
                                  {medication.dosage}
                                  {medication.frequency ? ` • ${medication.frequency}` : ''}
                                  {medication.duration ? ` • ${medication.duration}` : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-slate-500 lg:text-right">
                          <p className="font-semibold text-slate-900">{formatDateTime(prescription.date || prescription.createdAt)}</p>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-4">
                <div className="rounded-[26px] border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-amber-600" />
                    <h3 className="text-base font-black text-slate-900">Factures</h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    {invoices.length === 0 ? (
                      <p className="text-sm text-slate-500">Aucune facture enregistrée.</p>
                    ) : (
                      invoices.map((invoice: any) => (
                        <div key={invoice._id} className="rounded-2xl bg-slate-50 p-4">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="font-bold text-slate-900">
                                {invoice.items?.map((item: any) => item.description).join(', ') || 'Facture'}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {new Date(invoice.createdAt).toLocaleDateString('fr-FR')} • {invoiceStatus[invoice.status] || invoice.status}
                              </p>
                            </div>
                            <p className="text-sm font-black text-slate-900">{(invoice.totalAmount || 0).toLocaleString('fr-DZ')} DZD</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[26px] border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <BadgeEuro className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-base font-black text-slate-900">Paiements enregistrés</h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    {payments.length === 0 ? (
                      <p className="text-sm text-slate-500">Aucun paiement enregistré.</p>
                    ) : (
                      payments.map((payment: any) => (
                        <div key={payment._id} className="rounded-2xl bg-slate-50 p-4">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="font-bold text-slate-900">{paymentMethods[payment.method] || payment.method}</p>
                              <p className="mt-1 text-sm text-slate-500">{formatDateTime(payment.date || payment.createdAt)}</p>
                            </div>
                            <p className="text-sm font-black text-slate-900">{(payment.amount || 0).toLocaleString('fr-DZ')} DZD</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-teal-600" />
              <h2 className="text-base font-black text-slate-900">Informations patient</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p><span className="font-bold text-slate-900">Nom:</span> {patient.firstName} {patient.lastName}</p>
              <p><span className="font-bold text-slate-900">Téléphone:</span> {patient.phone || 'Non renseigné'}</p>
              <p><span className="font-bold text-slate-900">Email:</span> {patient.email || 'Non renseigné'}</p>
              <p><span className="font-bold text-slate-900">Genre:</span> {patient.gender === 'Male' ? 'Homme' : patient.gender === 'Female' ? 'Femme' : 'Non renseigné'}</p>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-teal-600" />
              <h2 className="text-base font-black text-slate-900">Contexte clinique</h2>
            </div>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Antécédents</p>
                <p className="mt-2 whitespace-pre-wrap">{patient.medicalHistory || 'Aucun antécédent saisi.'}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Notes de suivi</p>
                <p className="mt-2 whitespace-pre-wrap">{patient.careNotes || 'Aucune note de suivi.'}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-teal-600" />
              <h2 className="text-base font-black text-slate-900">Radiographie</h2>
            </div>

            {xRayUrl ? (
              <div className="mt-4 space-y-3">
                <img src={xRayUrl} alt="Radiographie du patient" className="h-48 w-full rounded-[24px] border border-slate-200 object-cover" />
                <a
                  href={xRayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:underline"
                >
                  Voir la radio en grand
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Aucune radiographie enregistrée pour ce patient.</p>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Ajouter/Modifier Radiographie (Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'xRay')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
                {xRayUrl && xRayUrl !== data?.patient?.xRayUrl && <p className="mt-1 text-xs text-teal-600 font-bold">Nouvelle image prête à être sauvegardée ✓</p>}
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Ajouter/Modifier Ordonnance (PDF)</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, 'prescription')}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                  {prescriptionUrl && prescriptionUrl !== data?.patient?.prescriptionUrl && <p className="text-xs text-teal-600 font-bold">Nouveau fichier prêt à être sauvegardé ✓</p>}
                  {data?.patient?.prescriptionUrl && prescriptionUrl === data?.patient?.prescriptionUrl && (
                    <a
                      href={prescriptionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline mt-2"
                    >
                      <FileText className="h-4 w-4" />
                      Ouvrir l'ordonnance actuelle
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={saveUrls}
                disabled={savingUrls}
                className="w-full mt-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
              >
                {savingUrls ? 'Sauvegarde...' : 'Enregistrer les documents'}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
