import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Admin', 'Doctor', 'Assistant', 'Receptionist']).default('Admin')
});

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Admin',
    },
    validators: {
      onChange: registerSchema as any,
    },
    onSubmit: async ({ value }) => {
      try {
        setErrorMsg('');
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, value);
        const { token, user } = response.data;
        
        login(token, user);
        navigate('/');
      } catch (error: any) {
        setErrorMsg(error.response?.data?.message || 'Failed to register account.');
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 w-full">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">Create Admin Account</h1>
          <p className="text-slate-500 mt-2">Register a new system administrator</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700" htmlFor={field.name}>Full Name</label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  type="text"
                  placeholder="John Doe"
                />
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-500">{field.state.meta.errors.map((err: any) => typeof err === 'string' ? err : err?.message).join(', ')}</p>
                )}
              </div>
            )}
          />

          <form.Field
            name="email"
            children={(field) => (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700" htmlFor={field.name}>Email Address</label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  type="email"
                  placeholder="admin@clinic.com"
                />
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-500">{field.state.meta.errors.map((err: any) => typeof err === 'string' ? err : err?.message).join(', ')}</p>
                )}
              </div>
            )}
          />

          <form.Field
            name="password"
            children={(field) => (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700" htmlFor={field.name}>Password</label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  type="password"
                  placeholder="••••••••"
                />
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-500">{field.state.meta.errors.map((err: any) => typeof err === 'string' ? err : err?.message).join(', ')}</p>
                )}
              </div>
            )}
          />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full flex justify-center py-3 px-4 rounded-lg shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
              >
                {isSubmitting ? 'Registering...' : 'Complete Registration'}
              </button>
            )}
          />
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline font-semibold">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
