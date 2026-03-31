import { useState, useEffect } from 'react';
import type { PageType } from '../types';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

const menuItems: { id: PageType; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Anasayfa', icon: 'dashboard' },
  { id: 'sales', label: 'Satışlar', icon: 'point_of_sale' },
  { id: 'products', label: 'Ürünler', icon: 'inventory_2' },
  { id: 'custom-orders', label: 'Özel Siparişler', icon: 'design_services' },
  { id: 'materials', label: 'Hammadde Stoğu', icon: 'texture' },
  { id: 'accounts', label: 'Cari Hesaplar', icon: 'account_balance' },
  { id: 'suppliers', label: 'Tedarikçiler', icon: 'factory' },
  { id: 'purchases', label: 'Alımlar', icon: 'shopping_cart' },
  { id: 'kasa', label: 'Kasa / Gelir-Gider', icon: 'account_balance_wallet' },
  { id: 'delivery-calendar', label: 'Teslimat Takvimi', icon: 'calendar_month' },

  { id: 'reminders', label: 'Hatırlatıcılar', icon: 'notifications' },
  { id: 'analytics', label: 'Analitik', icon: 'analytics' },
  { id: 'settings', label: 'Ayarlar', icon: 'settings' },
];

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [usdRate, setUsdRate] = useState<number | null>(null);

  useEffect(() => {
    // Theme Init
    const savedTheme = localStorage.getItem('otomind_theme');
    const root = document.documentElement;
    if (savedTheme === 'light') {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      setIsDark(true);
    }

    // USD Fetch
    async function fetchRate() {
      const cached = localStorage.getItem('otomind_usd_rate');
      const cacheTime = localStorage.getItem('otomind_usd_time');
      const now = Date.now();
      if (cached && cacheTime && (now - Number(cacheTime)) < 3600000) {
        setUsdRate(Number(cached));
        return;
      }
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();
        if (data?.rates?.TRY) {
          setUsdRate(data.rates.TRY);
          localStorage.setItem('otomind_usd_rate', data.rates.TRY.toString());
          localStorage.setItem('otomind_usd_time', now.toString());
        }
      } catch (e) { console.error('USD Fetch error', e); }
    }
    fetchRate();
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('otomind_theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('otomind_theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Navbar */}
      <div className="fixed top-0 left-0 w-full h-16 bg-surface/80 backdrop-blur-md border-b border-divider-light z-40 lg:hidden flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg shadow-red-500/20">
            <span className="text-main font-bold text-xs">O</span>
          </div>
          <span className="text-main font-bold text-sm tracking-wide">Otomind</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl border border-divider-light bg-background/50 hover:bg-surface-hover active:scale-95 transition-all text-main flex items-center justify-center shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
      </div>

      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out
          bg-surface border-r border-divider-light
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-divider-light ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
            <span className="text-main font-bold text-sm">O</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-main font-semibold text-sm truncate">Otomind</span>
              <span className="text-muted-dark text-[10px] truncate">Stok Yönetimi</span>
            </div>
          )}
          <button
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
            className={`ml-auto p-1 rounded-lg hover:bg-overlay text-muted-dark hover:text-main transition-colors ${collapsed ? 'ml-0' : ''}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
          <div className="space-y-0.5">
            {menuItems.map(item => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onPageChange(item.id); setMobileOpen(false); }}
                  className={`menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left group relative
                    ${isActive
                      ? 'bg-primary/15 text-primary-light'
                      : 'text-muted hover:text-slate-200 hover:bg-overlay'
                    }
                    ${collapsed ? 'justify-center px-0' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  {isActive && (
                    <div className="menu-indicator absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                  )}
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-primary' : ''}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="text-[13px] font-medium truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-divider-light space-y-3">
            {usdRate && (
              <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-background rounded-lg border border-divider-light">
                <span className="text-muted text-[11px] flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-[14px] text-green-500">payments</span> USD/TRY</span>
                <span className="text-main font-bold">₺{usdRate.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                  <span className="text-main text-xs font-bold">A</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-main font-medium truncate">Admin</p>
                  <p className="text-[10px] text-muted-dark truncate">otomind.com.tr</p>
                </div>
              </div>
              <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-overlay text-muted-dark hover:text-main transition-colors" title="Tema Değiştir">
                <span className="material-symbols-outlined text-[18px]">
                  {isDark ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
