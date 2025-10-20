import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { CashflowChart } from '../components/CashflowChart';
import { CategoryChart } from '../components/CategoryChart';
import { StatCard } from '../components/StatCard';
import { api } from '../lib/api';
import type { DashboardSummary } from '../types';
import { useAuth } from '../state/AuthContext';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary', { token }),
  });

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading dashboard…</div>;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-medium">Failed to load dashboard</p>
        <p className="text-sm mt-1">{(error as Error).message}</p>
        <button className="mt-3 text-sm underline" type="button" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('dashboard.monthlyBudget')} value={`$${(data.budget?.monthlyBudget ?? 0).toLocaleString()}`} />
        <StatCard title={t('dashboard.spentThisMonth')} value={`$${(data.budget?.spentThisMonth ?? 0).toLocaleString()}`} />
        <StatCard title={t('dashboard.savingsThisMonth')} value={`$${(data.budget?.savingsThisMonth ?? 0).toLocaleString()}`} />
        <StatCard title={t('dashboard.lastPeriodSavings')} value={`$${(data.savings?.lastPeriod ?? 0).toLocaleString()}`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.cashflow')}</h2>
          </header>
          <CashflowChart data={data.cashflow} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.categories')}</h2>
          </header>
          <CategoryChart data={data.categoryBreakdown.slice(0, 8)} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('dashboard.savings')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title={t('dashboard.sinceStart')} value={`$${(data.savings?.sinceStart ?? 0).toLocaleString()}`} />
          {data.savings?.goals?.map((goal) => (
            <div key={goal.id} className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500 mb-1 uppercase tracking-wide">{goal.name}</p>
              <p className="text-xl font-semibold text-slate-900">${goal.progress.toLocaleString()} / ${goal.target.toLocaleString()}</p>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (goal.progress / goal.target) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
