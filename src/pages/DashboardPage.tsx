import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency, getStatusColor, getStatusLabel } from '../utils/helpers';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { products, customOrders, materials, sales, cashEntries } = useData();

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const lowStockMaterials = materials.filter(m => m.stockQty <= m.minQty);

  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];
  const [selectedMonth, setSelectedMonth] = useState(todayStr.substring(0, 7));

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(todayDate.getFullYear(), i, 1);
    return {
      value: d.toISOString().substring(0, 7),
      label: d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    };
  });

  // Gelir (Kasa tabanlı)
  const monthlyRevenue = cashEntries.filter(e => e.date.startsWith(selectedMonth) && e.type === 'giris').reduce((s, e) => s + e.amount, 0);

  // Sadece bugün satışı
  const todayRevenue = cashEntries.filter(e => e.date === todayStr && e.type === 'giris').reduce((s, e) => s + e.amount, 0);

  // Seçili ayın günlük ortalaması
  const getDaysPassed = () => {
    if (selectedMonth === todayStr.substring(0, 7)) {
      return todayDate.getDate() || 1;
    }
    const [year, month] = selectedMonth.split('-');
    return new Date(Number(year), Number(month), 0).getDate() || 1;
  };
  const dailyAverage = monthlyRevenue / getDaysPassed();

  // Kanal Bazlı Satışlar (Seçili Ay)
  const channelDataMap: Record<string, number> = {};
  
  sales.filter(s => s.date.startsWith(selectedMonth)).forEach(s => {
    const ch = s.channel ? s.channel.toUpperCase() : 'DİĞER';
    channelDataMap[ch] = (channelDataMap[ch] || 0) + s.totalPrice;
  });

  customOrders.forEach(o => {
    if (o.createdAt.startsWith(selectedMonth)) {
      const ch = o.channel ? o.channel.toUpperCase() : 'DİĞER';
      channelDataMap[ch] = (channelDataMap[ch] || 0) + o.price;
    }
  });

  const chanData = Object.entries(channelDataMap)
    .filter(([_, revenue]) => revenue > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#f97316', '#10b981', '#a855f7', '#eab308', '#ec4899', '#64748b'];

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-divider rounded-xl p-3 shadow-xl">
          <p className="text-main font-medium">{payload[0].name}</p>
          <p className="font-bold text-main mt-1 text-sm">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const recentOrders = [...customOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentSales = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { label: 'Aylık Gelir', value: formatCurrency(monthlyRevenue), icon: 'trending_up', color: 'from-emerald-500 to-emerald-600', change: 'Kasa Girişleri (Seçili Ay)' },
    { label: 'Bugünün Geliri', value: formatCurrency(todayRevenue), icon: 'today', color: 'from-blue-500 to-blue-600', change: 'Sadece Bugün' },
    { label: 'Günlük Ortalama', value: formatCurrency(dailyAverage), icon: 'query_stats', color: 'from-purple-500 to-purple-600', change: 'Seçili Ayın Ortalaması' },
  ];

  return (
    <div className="animate-page-enter space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Anasayfa</h1>
          <p className="text-muted text-sm mt-1">Otomind Stok Yönetimi — Genel Bakış</p>
        </div>
        <div>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="bg-overlay border border-divider rounded-xl px-4 py-2.5 text-sm text-main focus:outline-none focus:border-primary/50 shadow-sm cursor-pointer hover:bg-overlay-hover transition-colors">
            {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card-hover glass-panel rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-main mt-2">{stat.value}</p>
                <p className="text-xs text-muted-dark mt-1">{stat.change}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <span className="material-symbols-outlined text-main text-[22px]">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(lowStockProducts.length > 0 || lowStockMaterials.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockProducts.length > 0 && (
            <div className="glass-panel rounded-2xl p-4 border-l-4 border-amber-500">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-amber-400">warning</span>
                <h3 className="text-amber-400 font-semibold text-sm">Düşük Stoklu Ürünler ({lowStockProducts.length})</h3>
              </div>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 3).map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <span className="text-muted-light truncate">{p.name}</span>
                    <span className="text-amber-400 font-medium ml-2">{p.stock} adet</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {lowStockMaterials.length > 0 && (
            <div className="glass-panel rounded-2xl p-4 border-l-4 border-red-500">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-red-400">error</span>
                <h3 className="text-red-400 font-semibold text-sm">Azalan Hammaddeler ({lowStockMaterials.length})</h3>
              </div>
              <div className="space-y-2">
                {lowStockMaterials.slice(0, 3).map(m => (
                  <div key={m.id} className="flex justify-between items-center text-sm">
                    <span className="text-muted-light truncate">{m.name}</span>
                    <span className="text-red-400 font-medium ml-2">{m.stockQty} {m.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Orders & Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-main font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">design_services</span>
              Son Özel Siparişler
            </h3>
          </div>
          <div className="space-y-3">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-overlay-border transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-main font-medium truncate">{order.customerName}</p>
                  <p className="text-xs text-muted-dark">{order.carBrand} {order.carModel} — {order.fabricType}</p>
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <span className={`px-2 py-1 text-[10px] font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <span className="text-xs text-muted font-medium">{formatCurrency(order.price)}</span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && <p className="text-muted-dark text-sm text-center py-4">Henüz sipariş yok</p>}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-main font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-[20px]">receipt_long</span>
              Son Satışlar
            </h3>
          </div>
          <div className="space-y-3">
            {recentSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-overlay-border transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-main font-medium truncate">{sale.productName}</p>
                  <p className="text-xs text-muted-dark">{sale.customerName} — {sale.channel}</p>
                </div>
                <span className="text-sm text-emerald-400 font-semibold ml-3">{formatCurrency(sale.totalPrice)}</span>
              </div>
            ))}
            {recentSales.length === 0 && <p className="text-muted-dark text-sm text-center py-4">Henüz satış yok</p>}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-main font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-[20px]">pie_chart</span>
              Kanal Bazlı Satışlar (Seçili Ay)
            </h3>
          </div>
          
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
             {chanData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={chanData}
                     cx="50%"
                     cy="50%"
                     innerRadius={80}
                     outerRadius={110}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {chanData.map((_, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip content={<CustomPieTooltip />} />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
                <p className="text-muted-dark text-sm">Bu aya ait satış verisi bulunamadı.</p>
             )}
          </div>
          
          {chanData.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              {chanData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-xs text-muted-light">{entry.name}</span>
                  <span className="text-xs font-semibold text-main ml-1">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
