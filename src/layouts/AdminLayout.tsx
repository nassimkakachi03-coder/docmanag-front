import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import axios from 'axios';
import {
  Archive,
  Bell,
  Calendar,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Stethoscope,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data);
        setUnreadCount(response.data.filter((notification: any) => !notification.read).length);
      } catch {}
    };

    void fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(notifications.map((notification) => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(notifications.map((notification) => (notification._id === id ? { ...notification, read: true } : notification)));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Tableau de bord', path: '/', icon: LayoutDashboard },
    { name: 'Dossier Patient (DPI)', path: '/patients', icon: HeartPulse },
    { name: 'Archive', path: '/archives', icon: Archive },
    { name: 'Agenda Medical', path: '/agenda', icon: Calendar },
    { name: 'Ordonnances', path: '/documents', icon: Stethoscope },
    { name: 'Suivi des stocks', path: '/stock', icon: Package },
    { name: 'Facturation', path: '/billing', icon: Wallet },
    { name: 'Messages', path: '/messages', icon: MessageSquare, badge: unreadCount },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="z-20 flex w-72 flex-col bg-slate-900 text-white shadow-2xl">
        <div className="flex items-center gap-4 border-b border-white/10 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-2xl font-black text-white shadow-lg">
            K
          </div>
          <div>
            <span className="block text-xl font-black tracking-tight">Dr Kakachi</span>
            <span className="mt-0.5 block text-xs font-bold uppercase tracking-widest text-teal-400">Espace Admin</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all ${
                  isActive ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
              {item.name}
              {'badge' in item && (item as any).badge > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-black text-white shadow-sm">
                  {(item as any).badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-6">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 px-4 py-3.5 text-sm font-bold text-slate-400 transition-all hover:bg-red-500 hover:text-white"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Deconnexion
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden bg-slate-50/50">
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-slate-200/60 bg-white/80 px-8 shadow-sm backdrop-blur-md">
          <div className="text-xl font-black tracking-tight text-slate-800">Administration</div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-full p-2 text-slate-400 transition-colors hover:bg-teal-50 hover:text-teal-600"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-2xl sm:w-96">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-4">
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
                        notifications.map((notification: any) => (
                          <div
                            key={notification._id}
                            onClick={() => {
                              if (!notification.read) void markAsRead(notification._id);
                              if (notification.link) navigate(notification.link);
                              setShowNotifications(false);
                            }}
                            className={`flex cursor-pointer items-start gap-3 border-b border-slate-50 p-4 transition hover:bg-slate-50 ${
                              !notification.read ? 'bg-teal-50/30' : ''
                            }`}
                          >
                            <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${!notification.read ? 'bg-teal-500' : 'bg-transparent'}`} />
                            <div>
                              <p className={`text-sm ${!notification.read ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                                {notification.title}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-slate-500">{notification.message}</p>
                              <p className="mt-2 text-[10px] font-bold uppercase text-slate-400">
                                {new Date(notification.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.name || 'Administrateur'}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">{user?.role || 'Admin'}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 font-black text-teal-700 shadow-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
