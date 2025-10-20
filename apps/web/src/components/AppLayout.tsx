import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../state/AuthContext';

const navItems = [
  { to: '/', key: 'dashboard' },
  { to: '/transactions', key: 'transactions' },
  { to: '/insights', key: 'insights' },
  { to: '/settings', key: 'settings' },
];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <aside className="hidden md:flex md:flex-col w-64 border-r border-slate-200 bg-white">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-semibold text-primary">{t('appName')}</h1>
          <p className="text-sm text-slate-500 mt-1">{user?.email}</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {t('actions.signOut')}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-10 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-primary">{t('appName')}</span>
          <button
            type="button"
            onClick={() => signOut()}
            className="text-sm text-slate-500 underline"
          >
            {t('actions.signOut')}
          </button>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 space-y-6">{children}</main>
      </div>
    </div>
  );
};
