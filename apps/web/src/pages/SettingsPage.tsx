import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '../lib/api';
import type { AccountResponse } from '../types';
import { useAuth } from '../state/AuthContext';

interface ProfileResponse {
  id: string;
  email: string;
  name?: string | null;
  locale: string;
  currency: string;
  province?: string | null;
  phone?: string | null;
}

interface CategoriesResponse {
  categories: { id: number; name: string; displayName: string; kind: string }[];
}

interface FeedbackOptionsResponse {
  options: { value: string; label: string }[];
}

export const SettingsPage = () => {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<ProfileResponse>('/settings/profile', { token }),
  });
  const accountsQuery = useQuery({
    queryKey: ['settings-accounts'],
    queryFn: () => api.get<AccountResponse>('/settings/accounts', { token }),
  });
  const categoriesQuery = useQuery({
    queryKey: ['settings-categories'],
    queryFn: () => api.get<CategoriesResponse>('/settings/categories', { token }),
  });
  const feedbackOptionsQuery = useQuery({
    queryKey: ['settings-feedback-options'],
    queryFn: () => api.get<FeedbackOptionsResponse>('/settings/feedback-options', { token }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ProfileResponse>) => api.patch<ProfileResponse>('/settings/profile', data, { token }),
    onSuccess: (updated) => {
      if (updated.locale) {
        void i18n.changeLanguage(updated.locale.startsWith('fr') ? 'fr' : 'en');
      }
      void profileQuery.refetch();
    },
  });

  const { register, handleSubmit, reset } = useForm<ProfileResponse>({
    defaultValues: profileQuery.data,
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset(profileQuery.data);
    }
  }, [profileQuery.data, reset]);

  const onSubmit = handleSubmit((values) => {
    updateMutation.mutate({
      name: values.name ?? undefined,
      locale: values.locale,
      currency: values.currency,
      province: values.province ?? undefined,
      phone: values.phone ?? undefined,
    });
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('settings.profile')}</h2>
        {profileQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-1 block">Email</span>
              <input
                type="email"
                value={profileQuery.data?.email}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-1 block">Name</span>
              <input
                type="text"
                {...register('name')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-1 block">{t('settings.locale')}</span>
                <select
                  {...register('locale')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
                >
                  <option value="en-CA">English (Canada)</option>
                  <option value="fr-CA">Français (Canada)</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-1 block">{t('settings.currency')}</span>
                <input
                  type="text"
                  {...register('currency')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-1 block">{t('settings.province')}</span>
                <input
                  type="text"
                  {...register('province')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-1 block">{t('settings.phone')}</span>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
                />
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                {t('settings.save')}
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
                onClick={() => reset(profileQuery.data)}
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{t('settings.accounts')}</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {accountsQuery.data?.accounts.map((account) => (
              <li key={account.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <span className="font-medium text-slate-900">{account.name}</span>
                <span className="ml-2 text-xs uppercase text-slate-400">{account.type}</span>
                <span className="ml-2 text-xs text-slate-500">{account.institution}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{t('settings.categories')}</h3>
          <div className="mt-3 grid max-h-48 gap-2 overflow-auto text-xs text-slate-600 md:grid-cols-2">
            {categoriesQuery.data?.categories.map((category) => (
              <div key={category.id} className="rounded-lg border border-slate-100 px-3 py-2">
                <span className="font-medium text-slate-900">{category.displayName}</span>
                <span className="ml-2 uppercase text-slate-400">{category.kind}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{t('settings.feedbackOptions')}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {feedbackOptionsQuery.data?.options.map((option) => (
              <span key={option.value} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {option.label}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
