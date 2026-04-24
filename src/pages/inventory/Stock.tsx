import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Search, Pencil, Trash2, Minus, Plus, ShieldCheck, Scissors, Layers, Box, Filter, Zap, Pill, Crown } from 'lucide-react';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';

const emptyForm = { name: '', quantity: 0, unit: 'Unités', threshold: 0, supplier: '', category: 'Consommables' };

const CATEGORIES = [
  { key: 'Tous', label: 'Tous', icon: Box, color: 'bg-slate-50 border-slate-200 text-slate-600', active: 'bg-slate-900 border-slate-900 text-white' },
  { key: 'Chirurgie', label: 'Chirurgie', icon: Scissors, color: 'bg-red-50 border-red-100 text-red-600', active: 'bg-red-600 border-red-600 text-white' },
  { key: 'Orthodontie', label: 'Orthodontie', icon: Zap, color: 'bg-amber-50 border-amber-100 text-amber-600', active: 'bg-amber-600 border-amber-600 text-white' },
  { key: 'Consommables', label: 'Consommables', icon: Layers, color: 'bg-teal-50 border-teal-100 text-teal-600', active: 'bg-teal-600 border-teal-600 text-white' },
  { key: 'Hygiène', label: 'Hygiène', icon: ShieldCheck, color: 'bg-blue-50 border-blue-100 text-blue-600', active: 'bg-blue-600 border-blue-600 text-white' },
  { key: 'Médicaments', label: 'Médicaments', icon: Pill, color: 'bg-violet-50 border-violet-100 text-violet-600', active: 'bg-violet-600 border-violet-600 text-white' },
  { key: 'Prothèses', label: 'Prothèses', icon: Crown, color: 'bg-pink-50 border-pink-100 text-pink-600', active: 'bg-pink-600 border-pink-600 text-white' },
];

const getCatMeta = (key: string) => CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];

export default function Stock() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const fetchItems = async () => {
    try { const r = await axios.get(`${import.meta.env.VITE_API_URL}/inventory?_t=${Date.now()}`, { headers }); setItems(Array.isArray(r.data) ? r.data : []); } catch { /* skip */ }
  };

  useEffect(() => { if (token) fetchItems(); }, [token]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (i: any) => { setEditing(i); setForm({ name: i.name || '', quantity: i.quantity ?? 0, unit: i.unit || 'Unités', threshold: i.threshold ?? 0, supplier: i.supplier || '', category: i.category || 'Consommables' }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) { const r = await axios.put(`${import.meta.env.VITE_API_URL}/inventory/${editing._id}`, form, { headers }); setItems(items.map((i) => i._id === editing._id ? r.data : i)); }
      else { const r = await axios.post(`${import.meta.env.VITE_API_URL}/inventory`, form, { headers }); setItems([r.data, ...items]); }
      setModalOpen(false);
    } catch { alert("Erreur lors de l'enregistrement."); } finally { setLoading(false); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Retirer cet article ?')) return;
    try { await axios.delete(`${import.meta.env.VITE_API_URL}/inventory/${id}`, { headers }); } catch { /* skip */ }
    setItems(items.filter((i) => i._id !== id));
  };

  const handleAdjust = async (item: any, amount: number) => {
    const nq = Math.max(0, item.quantity + amount);
    if (nq === item.quantity) return;
    try { const r = await axios.put(`${import.meta.env.VITE_API_URL}/inventory/${item._id}`, { ...item, quantity: nq }, { headers }); setItems(items.map((i) => i._id === item._id ? r.data : i)); } catch { /* skip */ }
  };

  const alertItems = items.filter((i) => i.quantity <= i.threshold);

  // Count per category
  const catCounts: Record<string, number> = {};
  items.forEach((i) => { const c = i.category || 'Consommables'; catCounts[c] = (catCounts[c] || 0) + 1; });
  catCounts['Tous'] = items.length;

  const filtered = items.filter((i) => {
    const s = search.toLowerCase();
    const matchSearch = (i.name || '').toLowerCase().includes(s) || (i.supplier || '').toLowerCase().includes(s) || (i.category || '').toLowerCase().includes(s);
    const matchCat = activeCategory === 'Tous' || i.category === activeCategory;
    const matchAlert = showOnlyAlerts ? i.quantity <= i.threshold : true;
    return matchSearch && matchCat && matchAlert;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory, showOnlyAlerts]);

  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="bg-white p-4 rounded-[20px] border border-slate-100 flex items-center gap-3 shadow-sm sm:rounded-3xl sm:gap-4">
          <div className="p-2.5 bg-teal-50 rounded-xl sm:p-3 sm:rounded-2xl"><Box className="w-4 h-4 text-teal-600 sm:w-5 sm:h-5" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
            <p className="text-lg font-black text-slate-900 sm:text-xl">{items.length}</p>
          </div>
        </div>
        <div className={`p-4 rounded-[20px] border flex items-center gap-3 shadow-sm transition-colors sm:rounded-3xl sm:gap-4 ${alertItems.length > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
          <div className={`p-2.5 rounded-xl sm:p-3 sm:rounded-2xl ${alertItems.length > 0 ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
            <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${alertItems.length > 0 ? 'text-red-500' : 'text-slate-300'}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alertes</p>
            <p className={`text-lg font-black sm:text-xl ${alertItems.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>{alertItems.length}</p>
          </div>
        </div>
        <div className="col-span-2 bg-teal-600 p-4 rounded-[20px] flex items-center justify-between text-white shadow-lg shadow-teal-600/20 sm:rounded-3xl lg:col-span-1">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 bg-white/20 rounded-xl sm:p-3 sm:rounded-2xl"><Plus className="w-4 h-4 sm:w-5 sm:h-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest">Gestion Rapide</p>
              <p className="text-sm font-bold">Ajouter au stock</p>
            </div>
          </div>
          <button onClick={openAdd} className="bg-white text-teal-600 p-2 rounded-xl hover:scale-105 transition-transform"><Plus className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Title + alert toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">Inventaire</h1>
        </div>
        <button onClick={() => { setShowOnlyAlerts(!showOnlyAlerts); setActiveCategory('Tous'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border sm:px-5 sm:py-3 ${showOnlyAlerts ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20' : 'bg-white text-slate-600 border-slate-100 hover:border-red-200'}`}>
          <AlertTriangle className="w-4 h-4" /> {showOnlyAlerts ? 'Voir Tout' : 'Voir les Manquants'}
        </button>
      </div>

      {/* Category filters + Search */}
      <div className="flex flex-col gap-3 bg-white p-3 rounded-[20px] shadow-sm border border-slate-100 sm:p-4 sm:rounded-3xl lg:flex-row lg:gap-4 lg:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); if (showOnlyAlerts) setShowOnlyAlerts(false); }}
            placeholder="Rechercher..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all outline-none border border-slate-100 sm:py-3 sm:rounded-2xl" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 sm:gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key && !showOnlyAlerts;
            const Icon = cat.icon;
            return (
              <button key={cat.key} onClick={() => { setActiveCategory(cat.key); setShowOnlyAlerts(false); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border sm:px-4 sm:py-2.5 sm:rounded-xl sm:text-xs ${isActive ? cat.active : `${cat.color} hover:shadow-sm`}`}>
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {cat.label}
                <span className={`ml-0.5 text-[9px] sm:text-[10px] ${isActive ? 'opacity-70' : 'opacity-50'}`}>({catCounts[cat.key] || 0})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Items Grid */}
      {paginatedItems.length === 0 ? (
        <div className="bg-white rounded-[20px] p-12 text-center border border-dashed border-slate-200 sm:rounded-3xl sm:p-20">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:w-16 sm:h-16"><Filter className="w-6 h-6 text-slate-300 sm:w-8 sm:h-8" /></div>
          <p className="text-slate-500 font-medium text-sm sm:text-base">Aucun article trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {paginatedItems.map((item) => {
            const isLow = item.quantity <= item.threshold;
            const catMeta = getCatMeta(item.category);
            const CatIcon = catMeta.icon;
            return (
              <div key={item._id} className={`bg-white rounded-[24px] p-5 border-2 transition-all group sm:rounded-[32px] sm:p-6 ${isLow ? 'border-red-50 bg-red-50/10' : 'border-slate-50 hover:border-teal-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50'}`}>
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`p-3 rounded-xl border transition-colors sm:p-4 sm:rounded-2xl ${catMeta.color}`}><CatIcon className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight text-sm sm:text-base">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded sm:text-[10px] ${catMeta.color}`}>{item.category}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{item.supplier || 'Générique'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all sm:p-2 sm:rounded-xl"><Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                    <button onClick={() => deleteItem(item._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all sm:p-2 sm:rounded-xl"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-6 sm:mt-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock</p>
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <span className={`text-3xl font-black sm:text-4xl ${isLow ? 'text-red-600' : 'text-slate-900'}`}>{item.quantity}</span>
                      <span className="text-xs font-bold text-slate-400 sm:text-sm">{item.unit}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100 sm:gap-2 sm:p-2 sm:rounded-2xl">
                    <button onClick={() => handleAdjust(item, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-red-600 hover:shadow transition-all active:scale-95 sm:w-10 sm:h-10 sm:rounded-xl"><Minus className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                    <div className="w-px h-5 bg-slate-200 mx-0.5 sm:h-6 sm:mx-1" />
                    <button onClick={() => handleAdjust(item, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-teal-600 hover:shadow transition-all active:scale-95 sm:w-10 sm:h-10 sm:rounded-xl"><Plus className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between sm:mt-6 sm:pt-6">
                  {isLow ? (
                    <div className="flex items-center gap-1.5 text-red-600 sm:gap-2"><AlertTriangle className="w-3.5 h-3.5 animate-pulse sm:w-4 sm:h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Seuil critique</span></div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-600 sm:gap-2"><ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Optimal</span></div>
                  )}
                  <span className="text-[10px] font-bold text-slate-400">Min: {item.threshold} {item.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <Pagination 
          currentPage={currentPage} 
          totalItems={filtered.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modifier l'Article" : 'Nouvel Article'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Désignation</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Fil de suture..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Catégorie</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white">
                {CATEGORIES.filter((c) => c.key !== 'Tous').map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Unité</label>
              <input required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Unités, Boîtes..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quantité</label>
              <input required type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Seuil d'Alerte</label>
              <input required type="number" min={0} value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fournisseur</label>
              <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Fournisseur principal"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-slate-50 sm:flex-row sm:justify-end sm:gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Annuler</button>
            <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-black text-sm transition-all shadow-lg shadow-teal-600/20">
              {loading ? 'Traitement...' : (editing ? 'Sauvegarder' : 'Ajouter au Stock')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
