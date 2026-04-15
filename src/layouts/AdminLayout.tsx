import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Calendar, Stethoscope, Package,
  Wallet, LayoutDashboard, LogOut, HeartPulse, MessageSquare
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/contact`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUnreadCount(res.data.filter((m: any) => !m.read).length);
      } catch { }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-teal-800 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-teal-700">
          <div className="w-10 h-10 bg-white text-teal-800 rounded-xl flex items-center justify-center font-extrabold text-xl shadow-sm">
            K
          </div>
          <div>
            <span className="block text-lg font-bold tracking-wide">Dr Kakachi</span>
            <span className="block text-xs text-teal-200">Espace Admin</span>
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-semibold text-sm
                ${isActive ? 'bg-teal-600 text-white shadow-md' : 'text-teal-100 hover:bg-teal-700 hover:text-white'}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
              {'badge' in item && (item as any).badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {(item as any).badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-teal-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-teal-100 hover:bg-red-500 hover:text-white rounded-xl transition-all text-sm font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="h-[72px] bg-white shadow-sm border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="text-xl font-bold text-slate-800">
            Espace Administration
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{user?.name || 'Administrateur'}</p>
              <p className="text-xs font-semibold text-teal-600">{user?.role || 'Admin'}</p>
            </div>
            <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-extrabold shadow-inner">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
