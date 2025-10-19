import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../state/AuthContext';

interface AuthFormValues {
  email: string;
  password?: string;
  name?: string;
}

export const AuthLanding = () => {
  const { t } = useTranslation();
  const { signIn, register: registerAccount, useDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    defaultValues: { email: '', password: '', name: '' },
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      if (mode === 'login') {
        await signIn(values.email, values.password);
      } else {
        await registerAccount({
          email: values.email,
          password: values.password,
          name: values.name?.trim() ? values.name : undefined,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate');
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full grid gap-10 md:grid-cols-2 bg-white/95 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-10 bg-slate-900 text-white hidden md:flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide">
              Canada-first
            </span>
            <h1 className="text-3xl font-semibold mt-6">{t('auth.headline')}</h1>
            <p className="text-slate-300 mt-4 leading-relaxed">{t('auth.subheadline')}</p>
          </div>
          <button
            type="button"
            onClick={() => useDemo()}
            className="mt-8 w-full rounded-lg border border-white/40 px-4 py-3 text-sm font-medium hover:bg-white/10"
          >
            {t('actions.useDemo')}
          </button>
        </div>
        <div className="p-8 md:p-10 bg-white">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">{t('appName')}</h2>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-full px-3 py-1 ${mode === 'login' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {t('actions.signIn')}
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`rounded-full px-3 py-1 ${
                  mode === 'register' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {t('auth.createAccount')}
              </button>
            </div>
          </div>
          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === 'register' && (
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-1 block">Name</span>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
                />
              </label>
            )}
            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-1 block">{t('auth.emailPlaceholder')}</span>
              <input
                type="email"
                {...register('email', { required: true })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-1 block">{t('auth.passwordPlaceholder')}</span>
              <input
                type="password"
                {...register('password', {
                  validate: (value) => !value || value.length >= 8 || 'Password must be at least 8 characters.',
                })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary px-4 py-3 text-white font-medium shadow-sm hover:bg-primary/90 disabled:opacity-60"
            >
              {mode === 'login' ? t('auth.continueWithEmail') : t('auth.createAccount')}
            </button>
          </form>
          <button
            type="button"
            onClick={() => useDemo()}
            className="mt-6 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {t('actions.useDemo')}
          </button>
        </div>
      </div>
    </div>
  );
};
