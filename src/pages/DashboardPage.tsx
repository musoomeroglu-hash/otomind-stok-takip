import { useData } from '../contexts/DataContext';
import { formatCurrency, getStatusColor, getStatusLabel } from '../utils/helpers';

export default function DashboardPage() {
  const { products, customOrders, materials, sales, cashEntries } = useData();

  const totalProducts = products.reduce((s, p) => s + p.stock, 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const pendingOrders = customOrders.filter(o => o.status !== 'teslim_edildi');
  const lowStockMaterials = materials.filter(m => m.stockQty <= m.minQty);

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);
  const monthlySales = sales.filter(s => s.date.startsWith(thisMonth));
  const monthlyRevenue = monthlySales.reduce((s, sale) => s + sale.totalPrice, 0);
  const monthlyExpenses = cashEntries.filter(e => e.date.startsWith(thisMonth) && e.type === 'cikis').reduce((s, e) => s + e.amount, 0);

  const recentOrders = [...customOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentSales = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { label: 'Toplam Ürün Stoku', value: totalProducts.toString(), icon: 'inventory_2', color: 'from-blue-500 to-blue-600', change: `${products.length} çeşit` },
    { label: 'Aylık Satış', value: formatCurrency(monthlyRevenue), icon: 'trending_up', color: 'from-emerald-500 to-emerald-600', change: `${monthlySales.length} satış` },
    { label: 'Bekleyen Sipariş', value: pendingOrders.length.toString(), icon: 'pending_actions', color: 'from-amber-500 to-amber-600', change: `${customOrders.length} toplam` },
    { label: 'Aylık Gider', value: formatCurrency(monthlyExpenses), icon: 'account_balance_wallet', color: 'from-rose-500 to-rose-600', change: `${cashEntries.filter(e => e.date.startsWith(thisMonth) && e.type === 'cikis').length} kalem` },
  ];

  return (
    <div className="animate-page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Otomind Stok Yönetimi — Genel Bakış</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
      </div>
    </div>
  );
}
