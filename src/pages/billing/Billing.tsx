import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ArrowUpDown,
  BadgeEuro,
  CreditCard,
  Landmark,
  Pencil,
  ReceiptText,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL;

const emptyInvoiceForm = {
  patientId: '',
  description: '',
  amount: 0,
  status: 'Pending',
};

const emptyPaymentForm = {
  invoiceId: '',
  amount: 0,
  method: 'Cash',
  date: new Date().toISOString().slice(0, 10),
};

const paymentMethodLabels: Record<string, string> = {
  Cash: 'Espèces',
  'Credit Card': 'Carte bancaire',
  'Bank Transfer': 'Virement',
};

const invoiceStatusLabels: Record<string, string> = {
  Pending: 'En attente',
  Paid: 'Payée',
  Overdue: 'En retard',
  Cancelled: 'Annulée',
};

const invoiceStatusStyles: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Overdue: 'bg-red-50 text-red-700 border-red-200',
  Cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function Billing() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const SortIcon = ({ col }: { col: string }) => (
    <ArrowUpDown className={`inline h-3 w-3 ml-1 ${sortKey === col ? 'text-emerald-600' : 'text-slate-400'}`} />
  );

  const fetchData = async () => {
    try {
      const [invoiceResponse, patientResponse, paymentResponse] = await Promise.all([
        axios.get(`${API}/billing/invoices`, { headers }),
        axios.get(`${API}/patients`, { headers }),
        axios.get(`${API}/billing/payments`, { headers }),
      ]);

      setInvoices(Array.isArray(invoiceResponse.data) ? invoiceResponse.data : []);
      setPatients(Array.isArray(patientResponse.data) ? patientResponse.data : []);
      setPayments(Array.isArray(paymentResponse.data) ? paymentResponse.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) void fetchData();
  }, [token]);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = query
      ? invoices.filter(inv =>
          [inv.patientName, inv.patientId?.firstName, inv.patientId?.lastName, inv.items?.map((i: any) => i.description).join(' ')]
            .filter(Boolean).join(' ').toLowerCase().includes(query)
        )
      : [...invoices];
    list.sort((a, b) => {
      let va: any, vb: any;
      if (sortKey === 'patient') { va = (a.patientName || '').toLowerCase(); vb = (b.patientName || '').toLowerCase(); }
      else if (sortKey === 'amount') { va = a.totalAmount || 0; vb = b.totalAmount || 0; }
      else if (sortKey === 'status') { va = (a.status || '').toLowerCase(); vb = (b.status || '').toLowerCase(); }
      else { va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [invoices, search, sortKey, sortDir]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = query
      ? payments.filter(p =>
          [p.invoiceId?.patientName, p.invoiceId?.patientId?.firstName, p.invoiceId?.patientId?.lastName, paymentMethodLabels[p.method] || p.method]
            .filter(Boolean).join(' ').toLowerCase().includes(query)
        )
      : [...payments];
    list.sort((a, b) => {
      let va: any, vb: any;
      if (sortKey === 'patient') { va = (a.invoiceId?.patientName || '').toLowerCase(); vb = (b.invoiceId?.patientName || '').toLowerCase(); }
      else if (sortKey === 'amount') { va = a.amount || 0; vb = b.amount || 0; }
      else if (sortKey === 'method') { va = (a.method || '').toLowerCase(); vb = (b.method || '').toLowerCase(); }
      else { va = new Date(a.date || a.createdAt).getTime(); vb = new Date(b.date || b.createdAt).getTime(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [payments, search, sortKey, sortDir]);

  useEffect(() => { setCurrentPage(1); }, [search, activeTab, sortKey, sortDir]);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage]);

  const totals = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    const totalCollected = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalPending = invoices
      .filter((invoice) => invoice.status !== 'Paid')
      .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

    return [
      { label: 'Facturation totale', value: `${totalInvoiced.toLocaleString('fr-DZ')} DZD`, icon: ReceiptText },
      { label: 'Paiements encaissés', value: `${totalCollected.toLocaleString('fr-DZ')} DZD`, icon: Wallet },
      { label: 'Reste à suivre', value: `${totalPending.toLocaleString('fr-DZ')} DZD`, icon: CreditCard },
      { label: 'Règlements saisis', value: payments.length, icon: BadgeEuro },
    ];
  }, [invoices, payments]);

  const openCreateInvoice = () => {
    setEditingInvoice(null);
    setInvoiceForm(emptyInvoiceForm);
    setInvoiceModalOpen(true);
  };

  const openEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      patientId: invoice.patientId?._id || invoice.patientId || '',
      description: invoice.items?.[0]?.description || '',
      amount: invoice.totalAmount || 0,
      status: invoice.status || 'Pending',
    });
    setInvoiceModalOpen(true);
  };

  const openPaymentModal = (invoice?: any) => {
    setPaymentForm({
      invoiceId: invoice?._id || '',
      amount: invoice?.totalAmount || 0,
      method: 'Cash',
      date: new Date().toISOString().slice(0, 10),
    });
    setPaymentModalOpen(true);
  };

  const submitInvoice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const selectedPatient = patients.find((patient) => patient._id === invoiceForm.patientId);
      const payload = {
        patientId: invoiceForm.patientId,
        patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '',
        totalAmount: Number(invoiceForm.amount) || 0,
        currency: 'DZD',
        status: invoiceForm.status,
        items: [{ description: invoiceForm.description, cost: Number(invoiceForm.amount) || 0 }],
      };

      if (editingInvoice) {
        await axios.put(`${API}/billing/invoices/${editingInvoice._id}`, payload, { headers });
      } else {
        await axios.post(`${API}/billing/invoices`, payload, { headers });
      }

      setInvoiceModalOpen(false);
      setInvoiceForm(emptyInvoiceForm);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Impossible d'enregistrer la facture.");
    } finally {
      setLoading(false);
    }
  };

  const submitPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        `${API}/billing/payments`,
        {
          ...paymentForm,
          amount: Number(paymentForm.amount) || 0,
          currency: 'DZD',
          date: new Date(`${paymentForm.date}T09:00:00`).toISOString(),
        },
        { headers }
      );

      setPaymentModalOpen(false);
      setPaymentForm(emptyPaymentForm);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Impossible de créer le paiement.');
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!window.confirm('Supprimer cette facture ?')) return;

    try {
      await axios.delete(`${API}/billing/invoices/${id}`, { headers });
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Suppression impossible.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-8 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(74,222,128,0.18),_transparent_60%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black tracking-tight">Facturation & Paiement</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openCreateInvoice}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-emerald-50"
            >
              Nouvelle facture
            </button>
            <button
              onClick={() => openPaymentModal()}
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Saisir un paiement
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {totals.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black text-slate-900">{value}</span>
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${activeTab === 'invoices' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Factures
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${activeTab === 'payments' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Paiements
            </button>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={activeTab === 'invoices' ? 'Rechercher une facture...' : 'Rechercher un paiement...'}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
        </div>

        {activeTab === 'invoices' ? (
          <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-5 py-4">Référence</th>
                  <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('patient')}>Patient <SortIcon col="patient" /></th>
                  <th className="px-5 py-4">Acte / soin</th>
                  <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('amount')}>Montant <SortIcon col="amount" /></th>
                  <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('status')}>Statut <SortIcon col="status" /></th>
                  <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('createdAt')}>Date <SortIcon col="createdAt" /></th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-sm font-medium text-slate-400">
                      {search ? `Aucune facture pour « ${search} ».` : 'Aucune facture enregistrée.'}
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((invoice) => (
                    <tr key={invoice._id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-black text-slate-900">#{invoice._id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {invoice.patientName || `${invoice.patientId?.firstName || ''} ${invoice.patientId?.lastName || ''}`}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{invoice.items?.map((item: any) => item.description).join(', ') || '-'}</td>
                      <td className="px-5 py-4 text-sm font-black text-slate-900">{(invoice.totalAmount || 0).toLocaleString('fr-DZ')} DZD</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${invoiceStatusStyles[invoice.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {invoiceStatusLabels[invoice.status] || invoice.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {invoice.status !== 'Paid' && (
                            <button
                              onClick={() => openPaymentModal(invoice)}
                              className="rounded-xl bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-100"
                              title="Enregistrer un paiement"
                            >
                              <Wallet className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditInvoice(invoice)}
                            className="rounded-xl bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteInvoice(invoice._id)}
                            className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalItems={filteredInvoices.length} 
            itemsPerPage={itemsPerPage} 
            onPageChange={setCurrentPage} 
          />
          </>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('patient')}>Patient <SortIcon col="patient" /></th>
                  <th className="px-5 py-4">Facture</th>
                  <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('method')}>Méthode <SortIcon col="method" /></th>
                  <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('createdAt')}>Date <SortIcon col="createdAt" /></th>
                  <th className="cursor-pointer px-5 py-4" onClick={() => handleSort('amount')}>Montant <SortIcon col="amount" /></th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-sm font-medium text-slate-400">
                      {search ? `Aucun paiement pour « ${search} ».` : 'Aucun paiement enregistré.'}
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((payment) => (
                    <tr key={payment._id} className="border-t border-slate-100">
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {payment.invoiceId?.patientName ||
                          `${payment.invoiceId?.patientId?.firstName || ''} ${payment.invoiceId?.patientId?.lastName || ''}`}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">#{payment.invoiceId?._id?.slice(0, 8).toUpperCase() || 'N/A'}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{paymentMethodLabels[payment.method] || payment.method}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {new Date(payment.date || payment.createdAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-slate-900">{(payment.amount || 0).toLocaleString('fr-DZ')} DZD</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalItems={filteredPayments.length} 
            itemsPerPage={itemsPerPage} 
            onPageChange={setCurrentPage} 
          />
          </>
        )}
      </section>

      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => {
          setInvoiceModalOpen(false);
          setEditingInvoice(null);
          setInvoiceForm(emptyInvoiceForm);
        }}
        title={editingInvoice ? 'Modifier la facture' : 'Créer une facture'}
        size="md"
      >
        <form onSubmit={submitInvoice} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Patient *</label>
            <select
              required
              value={invoiceForm.patientId}
              onChange={(event) => setInvoiceForm((current) => ({ ...current, patientId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="">Sélectionner un patient...</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Description du soin *</label>
            <input
              required
              value={invoiceForm.description}
              onChange={(event) => setInvoiceForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Ex: Détartrage, extraction, pose de couronne..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Montant (DZD) *</label>
              <input
                required
                type="number"
                min={0}
                step="1"
                value={invoiceForm.amount}
                onChange={(event) => setInvoiceForm((current) => ({ ...current, amount: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Statut</label>
              <select
                value={invoiceForm.status}
                onChange={(event) => setInvoiceForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="Pending">En attente</option>
                <option value="Paid">Payée</option>
                <option value="Overdue">En retard</option>
                <option value="Cancelled">Annulée</option>
              </select>
            </div>
          </div>


          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setInvoiceModalOpen(false)}
              className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? 'Enregistrement...' : editingInvoice ? 'Mettre à jour' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setPaymentForm(emptyPaymentForm);
        }}
        title="Enregistrer un paiement"
        size="md"
      >
        <form onSubmit={submitPayment} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Facture *</label>
            <select
              required
              value={paymentForm.invoiceId}
              onChange={(event) => {
                const nextInvoiceId = event.target.value;
                const selectedInvoice = invoices.find((invoice) => invoice._id === nextInvoiceId);
                setPaymentForm((current) => ({
                  ...current,
                  invoiceId: nextInvoiceId,
                  amount: selectedInvoice?.totalAmount || current.amount,
                }));
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="">Sélectionner une facture...</option>
              {invoices.map((invoice) => (
                <option key={invoice._id} value={invoice._id}>
                  #{invoice._id.slice(0, 8).toUpperCase()} - {invoice.patientName || `${invoice.patientId?.firstName || ''} ${invoice.patientId?.lastName || ''}`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Montant payé (DZD) *</label>
              <input
                required
                type="number"
                min={0}
                step="1"
                value={paymentForm.amount}
                onChange={(event) => setPaymentForm((current) => ({ ...current, amount: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Date *</label>
              <input
                required
                type="date"
                value={paymentForm.date}
                onChange={(event) => setPaymentForm((current) => ({ ...current, date: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Mode de règlement</label>
            <div className="grid gap-2 md:grid-cols-3">
              {[
                { value: 'Cash', label: 'Espèces', icon: Wallet },
                { value: 'Credit Card', label: 'Carte', icon: CreditCard },
                { value: 'Bank Transfer', label: 'Virement', icon: Landmark },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentForm((current) => ({ ...current, method: value }))}
                  className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                    paymentForm.method === value
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? 'Enregistrement...' : 'Créer le paiement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
