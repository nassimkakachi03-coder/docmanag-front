import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Calendar, Stethoscope, Package,
  Wallet, LayoutDashboard, LogOut, HeartPulse, MessageSquare, Bell
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n: any) => !n.read).length);
      } catch { }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Tableau de bord', path: '/', icon: LayoutDashboard },
    { name: 'Dossier Patient (DPI)', path: '/patients', icon: HeartPulse },
    { name: 'Agenda Médical', path: '/agenda', icon: Calendar },
    { name: 'Ordonnances', path: '/documents', icon: Stethoscope },
    { name: 'Suivi des stocks', path: '/stock', icon: Package },
    { name: 'Facturation', path: '/billing', icon: Wallet },
    { name: 'Messages', path: '/messages', icon: MessageSquare, badge: unreadCount },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 flex items-center gap-4 border-b border-white/10">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
            K
          </div>
          <div>
            <span className="block text-xl font-black tracking-tight">Dr Kakachi</span>
            <span className="block text-xs text-teal-400 font-bold tracking-widest uppercase mt-0.5">Espace Admin</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all font-semibold text-sm group
                ${isActive 
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
              {item.name}
              {'badge' in item && (item as any).badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {(item as any).badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3.5 text-slate-400 bg-white/5 hover:bg-red-500 hover:text-white rounded-2xl transition-all text-sm font-bold group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        {/* Top Header */}
        <header className="h-[72px] bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/60 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="text-xl font-black text-slate-800 tracking-tight">
            Administration
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-slate-400 hover:text-teal-600 transition-colors rounded-full hover:bg-teal-50">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[24px] shadow-2xl border border-slate-100 z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <h3 className="font-black text-slate-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs font-bold text-teal-600 hover:underline">
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-500">Aucune notification pour le moment.</div>
                      ) : (
                        notifications.map((notif: any) => (
                          <div 
                            key={notif._id} 
                            onClick={() => { if (!notif.read) markAsRead(notif._id); if (notif.link) navigate(notif.link); setShowNotifications(false); }}
                            className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition flex items-start gap-3 ${!notif.read ? 'bg-teal-50/30' : ''}`}
                          >
                            <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-teal-500' : 'bg-transparent'}`} />
                            <div>
                              <p className={`text-sm ${!notif.read ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>{notif.title}</p>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{new Date(notif.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.name || 'Administrateur'}</p>
                <p className="text-[10px] font-black tracking-widest uppercase text-teal-600">{user?.role || 'Admin'}</p>
              </div>
              <div className="w-10 h-10 bg-teal-50 border border-teal-100 text-teal-700 rounded-xl flex items-center justify-center font-black shadow-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
