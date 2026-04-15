import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button 
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold mb-4">Welcome back, {user?.name || 'Administrator'}!</h2>
        <p className="text-slate-600">
          Your active role is: <span className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">{user?.role || 'Admin'}</span>
        </p>
        <p className="mt-4 text-slate-500 leading-relaxed">
          This is the heavily protected dashboard view. From here you can manage patients, appointments, billing, operations, and system settings across the Dental Clinic network.
        </p>
      </div>
    </div>
  );
}
