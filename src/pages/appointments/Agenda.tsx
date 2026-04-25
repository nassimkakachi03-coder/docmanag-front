import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CalendarDays,
  Clock3,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL;

const emptyForm = {
  patientId: '',
  reason: '',
  date: '',
  time: '',
  status: 'Scheduled',
  notes: '',
};

const statusLabels: Record<string, string> = {
  Scheduled: 'Planifié',
  Pending: 'En attente',
  Completed: 'Terminé',
  Cancelled: 'Annulé',
};

const statusStyles: Record<string, string> = {
  Scheduled: 'bg-teal-50 text-teal-700 border-teal-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function Agenda() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const [appointmentsResponse, patientsResponse] = await Promise.all([
        axios.get(`${API}/appointments`, { headers }),
        axios.get(`${API}/patients`, { headers }),
      ]);

      const nextAppointments = Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : [];
      setAppointments(nextAppointments.sort((left: any, right: any) => new Date(left.date).getTime() - new Date(right.date).getTime()));
      setPatients(Array.isArray(patientsResponse.data) ? patientsResponse.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) void fetchData();
  }, [token]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return appointments;

    return appointments.filter((appointment) =>
      [
        appointment.patientName,
        appointment.patientId?.firstName,
        appointment.patientId?.lastName,
        appointment.reason,
        appointment.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [appointments, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(start, start + itemsPerPage);
  }, [filteredAppointments, currentPage]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return appointments.filter((appointment) => new Date(appointment.date).toDateString() === today);
  }, [appointments]);

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openCreateModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (appointment: any) => {
    const appointmentDate = new Date(appointment.date);
    setEditing(appointment);
    setForm({
      patientId: appointment.patientId?._id || appointment.patientId || '',
      reason: appointment.reason || '',
      date: appointmentDate.toISOString().slice(0, 10),
      time: appointmentDate.toTimeString().slice(0, 5),
      status: appointment.status || 'Scheduled',
      notes: appointment.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!form.patientId || !form.date || !form.time) {
      alert('Veuillez renseigner le patient, la date et l’heure du rendez-vous.');
      setLoading(false);
      return;
    }

    const selectedPatient = patients.find((patient) => patient._id === form.patientId);
    const doctorId = typeof user?.id === 'string' && /^[a-fA-F0-9]{24}$/.test(user.id) ? user.id : undefined;

    try {
      const payload = {
        patientId: form.patientId,
        patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '',
        reason: form.reason,
        date: new Date(`${form.date}T${form.time}`).toISOString(),
        status: form.status,
        notes: form.notes,
        ...(doctorId ? { doctorId } : {}),
      };

      if (editing) {
        await axios.put(`${API}/appointments/${editing._id}`, payload, { headers });
      } else {
        await axios.post(`${API}/appointments`, payload, { headers });
      }

      closeModal();
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Impossible d'enregistrer ce rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  const removeAppointment = async (id: string) => {
    if (!window.confirm('Supprimer ce rendez-vous ?')) return;

    try {
      await axios.delete(`${API}/appointments/${id}`, { headers });
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Suppression impossible.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_60%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black tracking-tight">Agenda Clinique</h1>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-teal-50"
          >
            <Plus className="h-4 w-4" />
            Nouveau rendez-vous
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Rendez-vous totaux', value: appointments.length, icon: CalendarDays },
          { label: "Aujourd'hui", value: todayAppointments.length, icon: Clock3 },
          { label: 'Patients concernés', value: new Set(appointments.map((appointment) => appointment.patientId?._id || appointment.patientId)).size, icon: UserRound },
        ].map(({ label, value, icon: Icon }) => (
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
            <h2 className="text-lg font-black text-slate-900">Planning des rendez-vous</h2>
            <p className="text-sm text-slate-500">Le formulaire accepte maintenant plusieurs statuts et des notes détaillées pour chaque soin.</p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un rendez-vous..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Patient</th>
                <th className="px-5 py-4">Motif</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm font-medium text-slate-400">
                    {search ? `Aucun rendez-vous pour « ${search} ».` : 'Aucun rendez-vous planifié.'}
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((appointment) => (
                  <tr key={appointment._id} className="border-t border-slate-100">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {new Date(appointment.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {appointment.patientName || `${appointment.patientId?.firstName || ''} ${appointment.patientId?.lastName || ''}`}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">{appointment.reason}</p>
                      <p className="mt-1 text-xs text-slate-500">{appointment.notes || 'Sans note complémentaire'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[appointment.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {statusLabels[appointment.status] || appointment.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(appointment)}
                          className="rounded-xl bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeAppointment(appointment._id)}
                          className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
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
          totalItems={filteredAppointments.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </section>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Patient *</label>
            <select
              required
              value={form.patientId}
              onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
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
            <label className="text-sm font-semibold text-slate-700">Motif *</label>
            <input
              required
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              placeholder="Ex: contrôle, douleur, extraction..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Date *</label>
              <input
                required
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Heure *</label>
              <input
                required
                type="time"
                value={form.time}
                onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Statut</label>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              >
                <option value="Scheduled">Planifié (Approuvé)</option>
                <option value="Pending">Demande en attente</option>
                <option value="Completed">Terminé</option>
                <option value="Cancelled">Annulé / Refusé</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Notes de consultation</label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              placeholder="Précisions utiles pour l'équipe ou pour le dossier patient..."
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
              {loading ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le rendez-vous'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
