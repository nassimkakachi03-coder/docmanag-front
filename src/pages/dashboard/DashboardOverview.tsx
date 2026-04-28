import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CreditCard,
  Package,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL;

export default function DashboardOverview() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };

  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const loadDashboard = async () => {
      try {
        const [patientsResponse, appointmentsResponse, invoicesResponse, inventoryResponse] = await Promise.all([
          axios.get(`${API}/patients`, { headers }),
          axios.get(`${API}/appointments`, { headers }),
          axios.get(`${API}/billing/invoices`, { headers }),
          axios.get(`${API}/inventory`, { headers }),
        ]);

        setPatients(Array.isArray(patientsResponse.data) ? patientsResponse.data : []);
        setAppointments(Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : []);
        setInvoices(Array.isArray(invoicesResponse.data) ? invoicesResponse.data : []);
        setItems(Array.isArray(inventoryResponse.data) ? inventoryResponse.data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [token]);

  const today = new Date();
  const todayAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => new Date(appointment.date).toDateString() === today.toDateString())
        .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()),
    [appointments]
  );

  const latestPatients = useMemo(() => patients.slice(0, 5), [patients]);
  const lowStock = useMemo(() => items.filter((item) => item.quantity <= item.threshold), [items]);
  const recentInvoices = useMemo(() => invoices.slice(0, 4), [invoices]);

  const totalRevenue = invoices.filter((invoice) => invoice.status === 'Paid').reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
  const monthlyRevenue = invoices
    .filter((invoice) => {
      const date = new Date(invoice.createdAt || Date.now());
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear() && invoice.status === 'Paid';
    })
    .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

  const quickCards = [
    {
      label: 'Patients suivis',
      value: patients.length,
      detail: `${patients.filter((patient) => patient.accountId).length} comptes privés liés`,
      icon: Users,
      color: 'bg-cyan-50 text-cyan-700',
      action: () => navigate('/patients'),
    },
    {
      label: "Rendez-vous aujourd'hui",
      value: todayAppointments.length,
      detail: todayAppointments[0] ? `Prochain à ${new Date(todayAppointments[0].date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Aucun rendez-vous prévu',
      icon: CalendarCheck,
      color: 'bg-teal-50 text-teal-700',
      action: () => navigate('/agenda'),
    },
    {
      label: 'Encaissement total',
      value: `${totalRevenue.toLocaleString('fr-DZ')} DZD`,
      detail: `${monthlyRevenue.toLocaleString('fr-DZ')} DZD encaissés ce mois`,
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-700',
      action: () => navigate('/billing'),
    },
    {
      label: 'Alertes stock',
      value: lowStock.length,
      detail: lowStock.length > 0 ? `${lowStock[0]?.name} sous le seuil` : 'Alerte stock inactive',
      icon: Package,
      color: lowStock.length > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700',
      action: () => navigate('/stock'),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-slate-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.24),_transparent_60%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black tracking-tight">Tableau de Bord</h1>
            <p className="mt-3 text-sm text-slate-300">
              {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="rounded-[26px] bg-white/10 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-100">Activité globale</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-bold">
              <Activity className="h-5 w-5 text-teal-200" />
              {appointments.length} rendez-vous suivis
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickCards.map(({ label, value, detail, icon: Icon, color, action }) => (
          <button key={label} onClick={action} className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className={`rounded-2xl p-3 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300" />
            </div>
            <p className="mt-4 text-3xl font-black text-slate-900">{value}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="mt-2 text-sm text-slate-500">{detail}</p>
          </button>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Rendez-vous du jour</h2>

            </div>
            <button onClick={() => navigate('/agenda')} className="text-sm font-bold text-teal-600 hover:underline">
              Voir l'agenda
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {todayAppointments.length === 0 ? (
              <div className="rounded-[26px] bg-slate-50 p-6 text-sm text-slate-500">Aucun rendez-vous prévu aujourd'hui.</div>
            ) : (
              todayAppointments.slice(0, 5).map((appointment) => (
                <article key={appointment._id} className="rounded-[26px] border border-slate-200 p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-base font-black text-slate-900">{appointment.patientName || 'Patient'}</p>
                      <p className="mt-1 text-sm text-slate-600">{appointment.reason || 'Consultation'}</p>
                    </div>
                    <div className="text-sm text-slate-500 lg:text-right">
                      <p className="font-semibold text-slate-900">
                        {new Date(appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                        ['EnCours','Scheduled','Pending'].includes(appointment.status)
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {['EnCours','Scheduled','Pending'].includes(appointment.status) ? 'En cours' : 'Terminé'}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6">
          <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Derniers dossiers patients</h2>
              <button onClick={() => navigate('/patients')} className="text-sm font-bold text-cyan-600 hover:underline">
                Voir les dossiers
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {latestPatients.length === 0 ? (
                <p className="rounded-[26px] bg-slate-50 p-6 text-sm text-slate-500">Aucun patient enregistré.</p>
              ) : (
                latestPatients.map((patient) => (
                  <button
                    key={patient._id}
                    onClick={() => navigate(`/patients/${patient._id}/history`)}
                    className="flex w-full items-center justify-between rounded-[24px] border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{patient.firstName} {patient.lastName}</p>
                      <p className="text-sm text-slate-500">{patient.caseSummary || patient.phone || patient.email || 'Dossier à compléter'}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </button>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Factures récentes</h2>
              <button onClick={() => navigate('/billing')} className="text-sm font-bold text-emerald-600 hover:underline">
                Ouvrir la facturation
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {recentInvoices.length === 0 ? (
                <p className="rounded-[26px] bg-slate-50 p-6 text-sm text-slate-500">Aucune facture enregistrée.</p>
              ) : (
                recentInvoices.map((invoice) => (
                  <div key={invoice._id} className="flex items-start justify-between rounded-[24px] border border-slate-200 px-4 py-3">
                    <div>
                      <p className="font-bold text-slate-900">{invoice.patientName || 'Patient'}</p>
                      <p className="text-sm text-slate-500">{invoice.items?.map((item: any) => item.description).join(', ') || 'Facture'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{(invoice.totalAmount || 0).toLocaleString('fr-DZ')} DZD</p>
                      <p className="text-xs text-slate-500">{invoice.status === 'Paid' ? 'Payée' : invoice.status === 'Overdue' ? 'En retard' : 'En attente'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${lowStock.length > 0 ? 'text-red-500' : 'text-slate-400'}`} />
              <h2 className="text-lg font-black text-slate-900">Stock sous surveillance</h2>
            </div>
            <div className="mt-5 space-y-3">
              {lowStock.length === 0 ? (
                <p className="rounded-[26px] bg-slate-50 p-6 text-sm text-slate-500">Aucune alerte stock active.</p>
              ) : (
                lowStock.slice(0, 4).map((item) => (
                  <div key={item._id} className="flex items-start justify-between rounded-[24px] border border-red-100 bg-red-50 px-4 py-3">
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.supplier || 'Fournisseur non renseigné'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-red-600">{item.quantity}</p>
                      <p className="text-xs text-red-500">Seuil {item.threshold}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
