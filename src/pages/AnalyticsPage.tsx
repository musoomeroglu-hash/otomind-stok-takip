import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line } from 'recharts';

export default function AnalyticsPage() {
  const { sales, cashEntries, customOrders } = useData();

  // Aylık Satış vs Gider Analizi
  const monthlyData = () => {
    const months: Record<string, { month: string; income: number; expense: number }> = {};
    
    // Son 6 ayın etiketlerini oluştur
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().substring(0, 7);
      months[key] = {
        month: d.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
        income: 0,
        expense: 0
      };
    }

    sales.forEach(s => {
      const key = s.date.substring(0, 7);
      if (months[key]) months[key].income += s.totalPrice;
    });

    cashEntries.forEach(e => {
      if (e.type === 'cikis') {
        const key = e.date.substring(0, 7);
        if (months[key]) months[key].expense += e.amount;
      }
    });

    customOrders.forEach(o => {
      if (o.status === 'teslim_edildi' && o.deliveryDate) {
         const key = o.deliveryDate.substring(0, 7);
         if (months[key]) months[key].income += o.price;
      }
    });

    return Object.values(months);
  };

  // En Çok Satan Ürünler Analizi
  const productPerformance = () => {
    const perf: Record<string, { name: string; qty: number; revenue: number }> = {};
    
    sales.forEach(s => {
      if (!perf[s.productName]) {
        perf[s.productName] = { name: s.productName, qty: 0, revenue: 0 };
      }
      perf[s.productName].qty += s.quantity;
      perf[s.productName].revenue += s.totalPrice;
    });

    return Object.values(perf)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  };

  // Kanal Bazlı Satış Performansı
  const channelPerformance = () => {
    const channels: Record<string, { channel: string; revenue: number }> = {};
    
    sales.forEach(s => {
      if (!channels[s.channel]) {
        channels[s.channel] = { channel: s.channel.toUpperCase(), revenue: 0 };
      }
      channels[s.channel].revenue += s.totalPrice;
    });

    customOrders.forEach(o => {
      if (!channels[o.channel]) {
        channels[o.channel] = { channel: o.channel.toUpperCase(), revenue: 0 };
      }
      channels[o.channel].revenue += o.price;
    });

    return Object.values(channels).sort((a, b) => b.revenue - a.revenue);
  };

  const chartData = monthlyData();
  const prodData = productPerformance();
  const chanData = channelPerformance();

  const totalIncome = chartData.reduce((s, row) => s + row.income, 0);
  const totalExpense = chartData.reduce((s, row) => s + row.expense, 0);
  const netProfit = totalIncome - totalExpense;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-divider rounded-xl p-3 shadow-xl">
          <p className="text-main font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm mt-1">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-bold text-main">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main">Analitik Gelişmiş Raporlama</h1>
        <p className="text-muted text-sm mt-1">Son 6 aylık finansal ve satış performansınız</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-l-[3px] border-emerald-500">
          <p className="text-muted text-sm font-medium">Toplam Gelir (6 Ay)</p>
          <p className="text-3xl font-bold text-main mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-l-[3px] border-rose-500">
          <p className="text-muted text-sm font-medium">Toplam Gider (6 Ay)</p>
          <p className="text-3xl font-bold text-main mt-1">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-l-[3px] border-blue-500">
          <p className="text-muted text-sm font-medium">Net Kar (6 Ay)</p>
          <p className={`text-3xl font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netProfit)}
          </p>
        </div>
      </div>

      {/* Gelir / Gider Grafiği */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-main font-semibold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">monitoring</span>
          Gelir ve Gider Trendi (Son 6 Ay)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₺${value / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" name="Gelir" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" name="Gider" dataKey="expense" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Çok Satan Ürünler */}
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="text-main font-semibold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">star</span>
            En Çok Satan 5 Ürün (Adet)
          </h3>
          <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={prodData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} width={130} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#142038', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} formatter={(value: any) => [`${value} Adet`, 'Satış']} />
                  <Bar dataKey="qty" radius={[0, 4, 4, 0]} maxBarSize={30}>
                    {prodData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-primary)' : 'rgba(233,114,38,0.6)'} />
                    ))}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Kanal Satışları */}
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="text-main font-semibold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">storefront</span>
            Kanal Bazlı Satış Gelirleri
          </h3>
          <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chanData} margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="channel" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₺${value / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar name="Gelir" dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {chanData.map((entry, index) => {
                      const colors: Record<string, string> = { WEBSITE: '#3b82f6', HEPSIBURADA: '#f97316', N11: '#a855f7', BAYI: '#10b981', CIMRI: '#eab308' };
                      return <Cell key={`cell-${index}`} fill={colors[entry.channel] || 'var(--color-primary)'} />;
                    })}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
