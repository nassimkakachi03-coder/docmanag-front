import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Shield, Mail, Lock, Eye, EyeOff, Activity, Stethoscope, Pill, HeartPulse } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onChange: loginSchema as any },
    onSubmit: async ({ value }) => {
      try {
        setErrorMsg('');
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, value);
        const { token, user } = response.data;
        login(token, user);
        navigate('/');
      } catch (error: any) {
        setErrorMsg(error.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.');
      }
    },
  });

  return (
    <div className="min-h-screen w-full flex overflow-hidden">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-500 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-teal-500/30 rounded-full blur-2xl" />

        {/* Floating medical icons */}
        <div className="absolute top-16 right-16 p-4 bg-white/10 backdrop-blur rounded-2xl rotate-12 shadow-xl">
          <Stethoscope className="w-8 h-8 text-white/80" />
        </div>
        <div className="absolute bottom-24 left-12 p-4 bg-white/10 backdrop-blur rounded-2xl -rotate-6 shadow-xl">
          <Pill className="w-8 h-8 text-white/80" />
        </div>
        <div className="absolute top-1/3 right-8 p-3 bg-white/10 backdrop-blur rounded-xl rotate-6 shadow-xl">
          <Activity className="w-6 h-6 text-white/80" />
        </div>
        <div className="absolute bottom-1/3 left-8 p-3 bg-white/10 backdrop-blur rounded-xl -rotate-12 shadow-xl">
          <HeartPulse className="w-6 h-6 text-white/80" />
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-teal-600 font-black text-2xl">D</span>
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-black text-white tracking-tight">DocManag</h1>
              <p className="text-teal-200 text-sm font-medium">Plateforme de gestion clinique</p>
            </div>
          </div>

          <div className="w-16 h-0.5 bg-white/30 mx-auto mb-8" />

          <h2 className="text-2xl font-bold text-white mb-4">Gestion Clinique Intelligente</h2>
          <p className="text-teal-100 text-sm leading-relaxed max-w-xs mx-auto">
            Gérez vos patients, ordonnances, stock, planning et facturation depuis un seul système sécurisé.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['Patients', 'Ordonnances', 'Facturation', 'Stock', 'Agenda'].map(f => (
              <span key={f} className="text-xs bg-white/15 text-white px-3 py-1.5 rounded-full font-semibold backdrop-blur border border-white/20">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-teal-200/60 text-xs">© 2025 DocManag — Système de Gestion Médicale</p>
        </div>
      </div>

      {/* Right Panel - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">D</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">DocManag</h1>
              <p className="text-slate-500 text-xs">Plateforme de gestion clinique</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-teal-100 rounded-lg">
                <Shield className="w-4 h-4 text-teal-600" />
              </div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Accès Sécurisé</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900">Connexion</h2>
            <p className="text-slate-500 mt-1 text-sm">Entrez vos identifiants administrateur pour accéder au système.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">!</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
            className="space-y-5"
          >
            <form.Field
              name="email"
              children={(field) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5" htmlFor={field.name}>
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Adresse Email
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm placeholder:text-slate-400"
                    type="email"
                    placeholder="admin@admin.com"
                  />
                  {(field.state.meta.errors as any[])?.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      {(field.state.meta.errors as any[]).map((err: any) => typeof err === 'string' ? err : err?.message).join(', ')}
                    </p>
                  )}
                </div>
              )}
            />

            <form.Field
              name="password"
              children={(field) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5" htmlFor={field.name}>
                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm placeholder:text-slate-400"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {(field.state.meta.errors as any[])?.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      {(field.state.meta.errors as any[]).map((err: any) => typeof err === 'string' ? err : err?.message).join(', ')}
                    </p>
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
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authentification...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Se Connecter
                    </>
                  )}
                </button>
              )}
            />
          </form>


        </div>
      </div>
    </div>
  );
}
