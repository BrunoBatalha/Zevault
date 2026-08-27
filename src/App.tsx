import { Sidebar } from '@/components/layout';
import { CommandPalette, OnboardingModal } from '@/components/shared';
import { db } from '@/core/database';
import { useLocalStorage } from '@/core/hooks';
import {
  AccountList,
  CategoryList,
  CreditCardList,
  Dashboard,
  LandingPage,
  SettingsView,
  TransactionList,
} from '@/core/router';
import { Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('financier_logged_in', false);
  const [userName, setUserName] = useLocalStorage('financier_user_name', '');
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('financier_sidebar_collapsed', false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      try {
        await db.connect();
        setIsDbReady(true);
      } catch (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
      }
    };
    initDb();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = () => {
    if (!userName) {
      setShowOnboarding(true);
    } else {
      setIsLoggedIn(true);
    }
  };

  const handleOnboardingComplete = (name: string) => {
    setUserName(name);
    setIsLoggedIn(true);
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isDbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <>
              <Suspense fallback={<RouteFallback />}>
                <LandingPage onGetStarted={handleLogin} />
              </Suspense>
              <OnboardingModal
                isOpen={showOnboarding}
                onComplete={handleOnboardingComplete}
              />
            </>
          }
        />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar
        userName={userName}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />

      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="p-6 max-w-7xl mx-auto">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/accounts" element={<AccountList />} />
              <Route path="/credit-cards" element={<CreditCardList />} />
              <Route path="/transactions" element={<TransactionList />} />
              <Route path="/categories" element={<CategoryList />} />
              <Route
                path="/settings"
                element={
                  <SettingsView
                    userName={userName}
                    onUserNameChange={setUserName}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </div>
  );
}

export default App;
