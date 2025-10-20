import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { api } from '../lib/api';
import type { InsightModule } from '../types';
import { useAuth } from '../state/AuthContext';

interface FeedbackOptionsResponse {
  modules: InsightModule[];
  feedbackOptions: { value: string; label: string }[];
}

export const InsightsPage = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['insights'],
    queryFn: () => api.get<FeedbackOptionsResponse>('/insights', { token }),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ insightId, value, comment }: { insightId: string; value: string; comment?: string }) =>
      api.post(`/insights/${insightId}/feedback`, { value, comment }, { token }),
  });

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading insights…</div>;
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-medium">Failed to load insights</p>
        <p className="text-sm text-slate-500 mt-1">{(error as Error)?.message}</p>
        <button className="mt-3 text-sm underline" type="button" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">{t('insights.title')}</h2>
        <p className="text-sm text-slate-500 mt-1">
          We highlight subscriptions, bill hikes, fees, and peer comparisons tailored for Canadians.
        </p>
      </header>

      {data.modules.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
          {t('insights.noInsights')}
        </div>
      ) : (
        data.modules.map((module) => (
          <section key={module.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <header>
              <h3 className="text-lg font-semibold text-slate-900">{module.title}</h3>
              <p className="text-sm text-slate-500">{module.description}</p>
            </header>
            <div className="space-y-4">
              {module.insights.map((insight) => (
                <article key={insight.id} className="rounded-xl border border-slate-200 p-4">
                  <h4 className="text-base font-semibold text-slate-900">{insight.title}</h4>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{insight.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    {Object.entries(insight.data ?? {}).map(([key, value]) => (
                      <span key={key} className="rounded-full bg-slate-100 px-3 py-1">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-500">{t('feedback.prompt')}</span>
                    {data.feedbackOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          feedbackMutation.mutate({ insightId: insight.id, value: option.value, comment: undefined })
                        }
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};
