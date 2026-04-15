import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Search } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function Team() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await axios.get(`${API}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (token) fetchTeam();
  }, [token]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  const roleColor: Record<string, string> = {
    Admin: 'bg-purple-100 text-purple-700 border-purple-200',
    Doctor: 'bg-teal-100 text-teal-700 border-teal-200',
    Assistant: 'bg-blue-100 text-blue-700 border-blue-200',
    Receptionist: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion d'équipe</h1>
          <p className="text-sm text-slate-500 mt-1">Supervisez les différents accès et utilisateurs de la plateforme.</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email ou rôle..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
        />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-3 p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
            {search ? `Aucun résultat pour « ${search} »` : 'Aucun membre d\'équipe enregistré.'}
          </div>
        ) : filtered.map(u => (
          <div key={u._id} className="p-5 border border-slate-200 rounded-xl hover:border-teal-300 hover:shadow-md transition-all bg-white flex items-start gap-4">
            <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex justify-center items-center font-black text-lg flex-shrink-0">
              {(u.name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{u.name}</h3>
              <p className="text-slate-500 text-sm">{u.email}</p>
              <div className={`mt-2 inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${roleColor[u.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {u.role}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
