import { useAuth } from '../../contexts/AuthContext';
import { Users, CalendarCheck, Package, DollarSign, TrendingUp, Clock, AlertTriangle, Activity, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';

const API = import.meta.env.VITE_API_URL;

export default function DashboardOverview() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [, setStats] = useState({ totalPatients: 0, todayAppointments: 0, lowStockItems: 0, totalRevenue: 0 });
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const [statsRes, patRes, apptRes, invRes, itemRes] = await Promise.all([
          axios.get(`${API}/dashboard/stats?_t=${Date.now()}`, { headers }),
          axios.get(`${API}/patients?_t=${Date.now()}`, { headers }),
          axios.get(`${API}/appointments?_t=${Date.now()}`, { headers }),
          axios.get(`${API}/billing/invoices?_t=${Date.now()}`, { headers }),
          axios.get(`${API}/inventory?_t=${Date.now()}`, { headers }),
        ]);
        setStats(statsRes.data || { totalPatients: 0, todayAppointments: 0, lowStockItems: 0, totalRevenue: 0 });
        setPatients(Array.isArray(patRes.data) ? patRes.data : []);
        setAppointments(Array.isArray(apptRes.data) ? apptRes.data : []);
        setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
        setItems(Array.isArray(itemRes.data) ? itemRes.data : []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const todayAppts = appointments.filter(a => new Date(a.date).toDateString() === now.toDateString())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const recentPatients = [...patients].reverse().slice(0, 5);

  const lowStock = items.filter(i => i.quantity <= i.threshold);

  const recentInvoices = [...invoices].reverse().slice(0, 4);

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const monthRevenue = invoices.filter(i => {
    const d = new Date(i.createdAt || Date.now());
    return d.getMonth() === now.getMonth() && i.status === 'Paid';
  }).reduce((s, i) => s + (i.totalAmount || 0), 0);

  const statCards = [
    {
      label: 'Total Patients', value: patients.length, icon: <Users className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600',
      sub: `+${recentPatients.length} récemment ajoutés`, action: () => navigate('/patients')
    },
    {
      label: "RDV Aujourd'hui", value: todayAppts.length, icon: <CalendarCheck className="w-6 h-6" />,
      color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50', text: 'text-teal-600',
      sub: todayAppts.length === 0 ? 'Aucun RDV planifié' : `Prochain: ${todayAppts[0] ? new Date(todayAppts[0].date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}`,
      action: () => navigate('/agenda')
    },
    {
      label: 'Revenus Totaux', value: `${totalRevenue.toLocaleString()} €`, icon: <DollarSign className="w-6 h-6" />,
      color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600',
      sub: `${monthRevenue.toLocaleString()} € ce mois`, action: () => navigate('/billing')
    },
    {
      label: 'Alertes Stock', value: lowStock.length, icon: <Package className="w-6 h-6" />,
      color: lowStock.length > 0 ? 'from-red-500 to-red-600' : 'from-slate-400 to-slate-500',
      bg: lowStock.length > 0 ? 'bg-red-50' : 'bg-slate-50',
      text: lowStock.length > 0 ? 'text-red-600' : 'text-slate-600',
      sub: lowStock.length > 0 ? `${lowStock[0]?.name} en stock critique` : 'Inventaire en ordre',
      action: () => navigate('/stock')
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header greeting */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute right-16 -bottom-8 w-24 h-24 bg-white/10 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-teal-100 text-sm font-medium capitalize">{dateStr}</p>
            <h1 className="text-2xl font-black mt-1">{greeting}, Kakachi 👋</h1>
            <p className="text-teal-100 text-sm mt-1">Voici votre tableau de bord de la clinique dentaire.</p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-white/15 rounded-xl px-4 py-3 backdrop-blur-sm">
            <Activity className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-sm">{appointments.length} RDV au total</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map(card => (
          <button key={card.label} onClick={card.action} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all text-left group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <div className={card.text}>{card.icon}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
            </div>
            <p className={`text-3xl font-black text-slate-800 mb-1`}>{card.value}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-xs text-slate-400 truncate">{card.sub}</p>
          </button>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Today's appointments */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 rounded-xl"><CalendarCheck className="w-5 h-5 text-teal-600" /></div>
              <h2 className="font-bold text-slate-800">Rendez-vous du Jour</h2>
            </div>
            <button onClick={() => navigate('/agenda')} className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {todayAppts.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun rendez-vous prévu aujourd'hui</p>
              <p className="text-xs mt-1">Planifiez un nouveau RDV dans l'Agenda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppts.slice(0, 5).map(appt => (
                <div key={appt._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-50 hover:border-slate-100">
                  <div className="flex-shrink-0 w-14 text-center">
                    <span className="text-sm font-black text-teal-600">{new Date(appt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{appt.patientName || 'Patient inconnu'}</p>
                    <p className="text-xs text-slate-500 truncate">{appt.reason}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {appt.duration} min
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : appt.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'}`}>
                    {appt.status === 'Scheduled' ? 'Planifié' : appt.status === 'Completed' ? 'Terminé' : 'Annulé'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent patients */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl"><Users className="w-5 h-5 text-blue-600" /></div>
              <h2 className="font-bold text-slate-800">Derniers Patients</h2>
            </div>
            <button onClick={() => navigate('/patients')} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Voir <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recentPatients.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Aucun patient enregistré</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPatients.map(p => (
                <div key={p._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {(p.firstName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-slate-500 truncate">{p.phone || p.email || '-'}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${p.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-sky-100 text-sky-600'}`}>
                    {p.gender === 'Female' ? 'F' : 'H'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Low stock alerts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${lowStock.length > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                <AlertTriangle className={`w-5 h-5 ${lowStock.length > 0 ? 'text-red-500' : 'text-slate-400'}`} />
              </div>
              <h2 className="font-bold text-slate-800">Alertes Stock</h2>
              {lowStock.length > 0 && <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{lowStock.length}</span>}
            </div>
            <button onClick={() => navigate('/stock')} className="text-xs font-bold text-slate-500 hover:text-teal-600 flex items-center gap-1">
              Gérer <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {lowStock.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Inventaire en ordre ✓</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 5).map(item => (
                <div key={item._id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.supplier || 'Fournisseur inconnu'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-red-600 text-sm">{item.quantity} <span className="font-normal text-xs">{item.unit}</span></p>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide">Seuil: {item.threshold}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent billing */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
              <h2 className="font-bold text-slate-800">Dernières Factures</h2>
            </div>
            <button onClick={() => navigate('/billing')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Aucune facture créée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map(inv => (
                <div key={inv._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{inv.patientName || 'Patient'}</p>
                      <p className="text-xs text-slate-500">{inv.items?.[0]?.description || '-'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800 text-sm">{(inv.totalAmount || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">{inv.currency}</span></p>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${inv.status === 'Paid' ? 'text-emerald-600' : inv.status === 'Overdue' ? 'text-red-600' : 'text-amber-600'}`}>
                      {inv.status === 'Paid' ? '✓ Payée' : inv.status === 'Overdue' ? '⚠ En retard' : '⏳ En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
