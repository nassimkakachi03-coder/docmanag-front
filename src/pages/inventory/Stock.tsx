import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  AlertTriangle, Search, Pencil, Trash2, 
  Minus, Plus, ShieldCheck, Scissors, Layers, 
  Box, Filter, Zap
} from 'lucide-react';
import Modal from '../../components/Modal';

const emptyForm = { name: '', quantity: 0, unit: 'Unités', threshold: 0, supplier: '', category: 'Consommables' };

export default function Stock() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const categories = ['Tous', 'Chirurgie', 'Orthodontie', 'Consommables', 'Hygiène'];

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/inventory?_t=${Date.now()}`, { headers });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (token) fetchItems(); }, [token]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (i: any) => {
    setEditing(i);
    setForm({ 
      name: i.name || '', 
      quantity: i.quantity ?? 0, 
      unit: i.unit || 'Unités', 
      threshold: i.threshold ?? 0, 
      supplier: i.supplier || '',
      category: i.category || 'Consommables'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        const res = await axios.put(`${import.meta.env.VITE_API_URL}/inventory/${editing._id}`, form, { headers });
        setItems(items.map(i => i._id === editing._id ? res.data : i));
      } else {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/inventory`, form, { headers });
        setItems([res.data, ...items]);
      }
      setModalOpen(false);
    } catch { alert("Erreur lors de l'enregistrement."); }
    finally { setLoading(false); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Retirer cet article du stock ?')) return;
    try { await axios.delete(`${import.meta.env.VITE_API_URL}/inventory/${id}`, { headers }); } catch { }
    setItems(items.filter(i => i._id !== id));
  };

  const handleAdjust = async (item: any, amount: number) => {
    const newQty = Math.max(0, item.quantity + amount);
    if (newQty === item.quantity) return;
    try {
      const updatedItem = { ...item, quantity: newQty };
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/inventory/${item._id}`, updatedItem, { headers });
      setItems(items.map(i => i._id === item._id ? res.data : i));
    } catch { console.error("Erreur lors de l'ajustement du stock"); }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Chirurgie': return <Scissors className="w-5 h-5 text-red-500" />;
      case 'Orthodontie': return <Zap className="w-5 h-5 text-amber-500" />;
      case 'Hygiène': return <ShieldCheck className="w-5 h-5 text-blue-500" />;
      case 'Consommables': return <Layers className="w-5 h-5 text-teal-500" />;
      default: return <Box className="w-5 h-5 text-slate-400" />;
    }
  };

  const alertItems = items.filter(i => i.quantity <= i.threshold);

  const filtered = items.filter(i => {
    const s = search.toLowerCase();
    const matchesSearch = (i.name || '').toLowerCase().includes(s) || 
                          (i.supplier || '').toLowerCase().includes(s) ||
                          (i.category || '').toLowerCase().includes(s);
    const matchesCategory = activeCategory === 'Tous' || i.category === activeCategory;
    const matchesAlert = showOnlyAlerts ? (i.quantity <= i.threshold) : true;
    return matchesSearch && matchesCategory && matchesAlert;
  });

  return (
    <div className="space-y-6">
      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-teal-50 rounded-2xl"><Box className="w-5 h-5 text-teal-600" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Produits</p>
            <p className="text-xl font-black text-slate-900">{items.length}</p>
          </div>
        </div>
        <div className={`p-4 rounded-3xl border flex items-center gap-4 shadow-sm transition-colors ${alertItems.length > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
          <div className={`p-3 rounded-2xl ${alertItems.length > 0 ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
            <AlertTriangle className={`w-5 h-5 ${alertItems.length > 0 ? 'text-red-500' : 'text-slate-300'}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En Alerte / Rupture</p>
            <p className={`text-xl font-black ${alertItems.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>{alertItems.length}</p>
          </div>
        </div>
        <div className="bg-teal-600 p-4 rounded-3xl flex items-center justify-between text-white shadow-lg shadow-teal-600/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl"><Plus className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest">Gestion Rapide</p>
              <p className="text-sm font-bold">Ajouter au stock</p>
            </div>
          </div>
          <button onClick={openAdd} className="bg-white text-teal-600 p-2 rounded-xl hover:scale-105 transition-transform"><Plus className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suivi d'Inventaire</h1>
          <p className="text-sm text-slate-500 mt-1">Checklist des consommables et matériel chirurgical.</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => { setShowOnlyAlerts(!showOnlyAlerts); setActiveCategory('Tous'); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all border ${
                showOnlyAlerts 
                ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20' 
                : 'bg-white text-slate-600 border-slate-100 hover:border-red-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {showOnlyAlerts ? 'Voir Tout' : 'Voir les Manquants'}
            </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            value={search} 
            onChange={e => { setSearch(e.target.value); if (showOnlyAlerts) setShowOnlyAlerts(false); }} 
            placeholder="Rechercher par nom, catégorie ou fournisseur..." 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all outline-none border border-slate-100" 
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setShowOnlyAlerts(false); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat && !showOnlyAlerts
                ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/10' 
                : 'bg-white text-slate-600 border-slate-100 hover:border-teal-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Display */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">Aucun article trouvé dans cette sélection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(item => {
            const isLow = item.quantity <= item.threshold;
            return (
              <div key={item._id} className={`bg-white rounded-[32px] p-6 border-2 transition-all group ${isLow ? 'border-red-50 bg-red-50/10' : 'border-slate-50 hover:border-teal-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white border border-slate-100 transition-colors">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{item.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">{item.supplier || 'Générique'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteItem(item._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Disponible</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-black ${isLow ? 'text-red-600' : 'text-slate-900'}`}>{item.quantity}</span>
                      <span className="text-sm font-bold text-slate-400">{item.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <button 
                      onClick={() => handleAdjust(item, -1)} 
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-red-600 hover:shadow transition-all active:scale-95"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button 
                      onClick={() => handleAdjust(item, 1)} 
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-teal-600 hover:shadow transition-all active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  {isLow ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-4 h-4 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Seuil critique atteint</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Niveau optimal</span>
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-slate-400">Min: {item.threshold} {item.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Reused with new styling and category */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modifier l'Article" : 'Nouvel Article'} size="md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Désignation du produit</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Fil de suture, Articaïne..." className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Catégorie</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white">
                <option value="Chirurgie">Chirurgie</option>
                <option value="Orthodontie">Orthodontie</option>
                <option value="Consommables">Consommables</option>
                <option value="Hygiène">Hygiène</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Unité</label>
              <input required value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="Unités, Boîtes..." className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quantité Initiale</label>
              <input required type="number" min={0} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Seuil d'Alerte</label>
              <input required type="number" min={0} value={form.threshold} onChange={e => setForm({ ...form, threshold: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fournisseur / Laboratoire</label>
              <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Fournisseur principal" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
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
