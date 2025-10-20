import { useMutation, useQuery } from '@tanstack/react-query';
import { addMonths, format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '../lib/api';
import type { AccountResponse, TransactionsResponse, UploadResponse } from '../types';
import { useAuth } from '../state/AuthContext';

const toDateInput = (date: Date) => format(date, 'yyyy-MM-dd');

export const TransactionsPage = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({
    start: toDateInput(addMonths(new Date(), -3)),
    end: toDateInput(new Date()),
  });
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get<AccountResponse>('/settings/accounts', { token }),
  });

  const transactionsQuery = useQuery({
    queryKey: ['transactions', search, dateRange, selectedAccount],
    queryFn: () =>
      api.get<TransactionsResponse>(
        `/transactions?search=${encodeURIComponent(search)}&startDate=${dateRange.start}&endDate=${dateRange.end}&accounts=${selectedAccount}`,
        { token },
      ),
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => api.postForm<UploadResponse>('/transactions/upload', formData, { token }),
    onSuccess: (data) => {
      setUploadMessage(
        `Imported ${data.stats.importedRows} of ${data.stats.totalRows} rows. Transfers detected: ${data.stats.detectedTransfers}.`,
      );
      void transactionsQuery.refetch();
    },
    onError: (error: unknown) => {
      setUploadMessage(error instanceof Error ? error.message : 'Failed to upload statements');
    },
  });

  const onUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (!formData.get('file')) {
      setUploadMessage('Choose a CSV file first.');
      return;
    }
    uploadMutation.mutate(formData);
  };

  const items = useMemo(() => transactionsQuery.data?.items ?? [], [transactionsQuery.data]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('upload.heading')}</h2>
        <p className="text-sm text-slate-500 mb-6">{t('upload.subheading')}</p>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onUpload}>
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1 block">Existing account</span>
            <select
              name="accountId"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
            >
              <option value="">Create from account name</option>
              {accounts?.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1 block">{t('upload.accountName')}</span>
            <input
              type="text"
              name="accountName"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
              placeholder="Everyday Chequing"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1 block">{t('upload.institution')}</span>
            <input
              type="text"
              name="institution"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
              placeholder="Bank name"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1 block">{t('upload.accountType')}</span>
            <input
              type="text"
              name="accountType"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
              placeholder="Chequing"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1 block">{t('upload.currency')}</span>
            <input
              type="text"
              name="currency"
              defaultValue="CAD"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            <span className="mb-1 block">{t('upload.file')}</span>
            <input
              required
              name="file"
              type="file"
              accept=".csv"
              className="block w-full rounded-lg border border-dashed border-slate-300 px-3 py-10 text-center text-sm text-slate-500"
            />
          </label>
          <div className="md:col-span-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button
              type="submit"
              disabled={uploadMutation.isLoading}
              className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60"
            >
              {uploadMutation.isLoading ? 'Uploading…' : t('upload.submit')}
            </button>
            {uploadMessage ? <p className="text-sm text-slate-500">{uploadMessage}</p> : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t('transactions.title')}</h2>
            <p className="text-sm text-slate-500">{items.length} results</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="search"
              placeholder={t('transactions.searchPlaceholder') ?? 'Search'}
              className="rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="flex gap-2">
              <input
                type="date"
                className="rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
                value={dateRange.start}
                onChange={(event) => setDateRange((prev) => ({ ...prev, start: event.target.value }))}
              />
              <input
                type="date"
                className="rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
                value={dateRange.end}
                onChange={(event) => setDateRange((prev) => ({ ...prev, end: event.target.value }))}
              />
            </div>
            <select
              value={selectedAccount}
              onChange={(event) => setSelectedAccount(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
            >
              <option value="">All accounts</option>
              {accounts?.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Description</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500">
                    {t('transactions.empty')}
                  </td>
                </tr>
              ) : (
                items.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-slate-100">
                    <td className="py-3 pr-4 text-slate-600">{new Date(transaction.date).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">{transaction.description}</p>
                      <p className="text-xs text-slate-400 uppercase">{transaction.transactionType}</p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-400">{transaction.transactionType}</td>
                    <td className={`py-3 pr-4 text-right font-semibold ${transaction.amount < 0 ? 'text-red-500' : 'text-primary'}`}>
                      {new Intl.NumberFormat('en-CA', {
                        style: 'currency',
                        currency: transaction.currency,
                      }).format(transaction.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
