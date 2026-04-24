import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: z.enum(['Admin', 'Doctor', 'Assistant', 'Receptionist']).default('Admin'),
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
        setErrorMsg(error.response?.data?.message || "Impossible de créer le compte administrateur.");
      }
    },
  });

  return (
    <div className="min-h-screen w-full bg-slate-50 p-4">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1.05fr_minmax(0,1fr)]">
          <section className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-10 text-white lg:block">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-200">Administration</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Créez un accès interne sécurisé pour l'équipe du cabinet.</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Les profils créés ici permettent de gérer les dossiers patients, les rendez-vous, les ordonnances, le stock et la facturation depuis l'interface administrateur.
            </p>
          </section>

          <section className="p-8 md:p-10">
            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Nouveau compte</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">Créer un compte administrateur</h2>
              <p className="mt-2 text-sm text-slate-500">Renseignez les informations du collaborateur pour lui ouvrir un accès au back-office.</p>
            </div>

            {errorMsg && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{errorMsg}</div>}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              <form.Field
                name="name"
                children={(field) => (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700" htmlFor={field.name}>
                      Nom complet
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Ex: Dr Sara B."
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-red-500">{field.state.meta.errors.map((error: any) => (typeof error === 'string' ? error : error?.message)).join(', ')}</p>
                    )}
                  </div>
                )}
              />

              <form.Field
                name="email"
                children={(field) => (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700" htmlFor={field.name}>
                      Adresse email
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="admin@cabinet.com"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-red-500">{field.state.meta.errors.map((error: any) => (typeof error === 'string' ? error : error?.message)).join(', ')}</p>
                    )}
                  </div>
                )}
              />

              <form.Field
                name="password"
                children={(field) => (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700" htmlFor={field.name}>
                      Mot de passe
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Minimum 6 caractères"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-red-500">{field.state.meta.errors.map((error: any) => (typeof error === 'string' ? error : error?.message)).join(', ')}</p>
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
                    className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Création du compte...' : 'Créer le compte'}
                  </button>
                )}
              />
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Déjà un compte ?
              {' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                Se connecter
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
