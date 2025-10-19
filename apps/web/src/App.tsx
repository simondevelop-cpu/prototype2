import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes } from 'react-router-dom';

import { DashboardPage } from './pages/DashboardPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { useAuth } from './state/AuthContext';
import { AuthLanding } from './pages/AuthLanding';
import { AppLayout } from './components/AppLayout';

export const App = () => {
  const { user, loading } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (user?.locale) {
      void i18n.changeLanguage(user.locale.startsWith('fr') ? 'fr' : 'en');
    }
  }, [user, i18n]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthLanding />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};
