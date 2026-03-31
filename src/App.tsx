import { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import type { PageType } from './types';

// Components
import Sidebar from './components/Sidebar';

// Pages
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CustomOrdersPage from './pages/CustomOrdersPage';
import MaterialsPage from './pages/MaterialsPage';
import SalesPage from './pages/SalesPage';
import AccountsPage from './pages/AccountsPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchasesPage from './pages/PurchasesPage';
import KasaPage from './pages/KasaPage';
import DeliveryCalendarPage from './pages/DeliveryCalendarPage';
import RemindersPage from './pages/RemindersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <main className="flex-1 w-full relative overflow-y-auto scrollbar-thin lg:ml-[260px]">
        {/* Background gradient effects */}
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
        
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10 pt-20 lg:pt-8">
          {currentPage === 'dashboard' && <DashboardPage />}
          {currentPage === 'products' && <ProductsPage />}
          {currentPage === 'custom-orders' && <CustomOrdersPage />}
          {currentPage === 'materials' && <MaterialsPage />}
          {currentPage === 'sales' && <SalesPage />}
          {currentPage === 'accounts' && <AccountsPage />}
          {currentPage === 'suppliers' && <SuppliersPage />}
          {currentPage === 'purchases' && <PurchasesPage />}
          {currentPage === 'kasa' && <KasaPage />}
          {currentPage === 'delivery-calendar' && <DeliveryCalendarPage />}
          {currentPage === 'reminders' && <RemindersPage />}
          {currentPage === 'analytics' && <AnalyticsPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const auth1 = localStorage.getItem('otomind_auth');
    const auth2 = sessionStorage.getItem('otomind_auth');
    return auth1 === 'true' || auth2 === 'true';
  });

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <DataProvider>
      <MainApp />
    </DataProvider>
  );
}
