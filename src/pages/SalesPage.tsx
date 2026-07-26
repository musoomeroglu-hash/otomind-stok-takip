import { useState } from 'react';
import ExcelJS from 'exceljs';
import { addTitle, addSubtitle, addSpacer, addHeaders, addDataRow, addTotalRow, addSummaryPair, saveExcel } from '../utils/excelHelper';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate, toLocalDateStr, toLocalYearMonth } from '../utils/helpers';
import type { Sale } from '../types';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const empty: Omit<Sale, 'id' | 'createdAt'> = {
  saleType: 'normal', productName: '', customerName: '', quantity: 1, unitPrice: 0, totalPrice: 0,
  channel: '', paymentMethod: 'kredi_karti', notes: '',
  deductMaterial: false,
  date: toLocalDateStr(new Date()),
  cashRegisterId: '',
};

export default function SalesPage() {
  const { sales, products, salesChannels, addSale, deleteSale, cashRegisters } = useData();
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  function setQuickRange(range: 'thisWeek' | 'thisMonth' | 'lastMonth' | 'last7' | 'last30') {
    const today = new Date();
    const todayStr = toLocalDateStr(today);

    switch (range) {
      case 'thisWeek': {
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        setExportStartDate(toLocalDateStr(monday));
        setExportEndDate(todayStr);
        break;
      }
      case 'thisMonth': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        setExportStartDate(toLocalDateStr(firstDay));
        setExportEndDate(todayStr);
        break;
      }
      case 'lastMonth': {
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        setExportStartDate(toLocalDateStr(firstDay));
        setExportEndDate(toLocalDateStr(lastDay));
        break;
      }
      case 'last7': {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);
        setExportStartDate(toLocalDateStr(weekAgo));
        setExportEndDate(todayStr);
        break;
      }
      case 'last30': {
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 29);
        setExportStartDate(toLocalDateStr(monthAgo));
        setExportEndDate(todayStr);
        break;
      }
    }
  }

  async function handleExportSalesExcel() {
    if (!exportStartDate || !exportEndDate) {
      setToast({ msg: 'Başlangıç ve bitiş tarihi seçiniz', type: 'error' });
      return;
    }

    const exportData = sales
      .filter(s => s.date >= exportStartDate && s.date <= exportEndDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (exportData.length === 0) {
      setToast({ msg: 'Seçilen tarih aralığında satış bulunamadı', type: 'error' });
      return;
    }

    const totalRevenue = exportData.reduce((s, sale) => s + sale.totalPrice, 0);
    const totalQuantity = exportData.reduce((s, sale) => s + sale.quantity, 0);
    const aracOzel = exportData.filter(s => s.saleType === 'arac_ozel');
    const normal = exportData.filter(s => s.saleType === 'normal');

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Otomind';
    wb.created = new Date();

    // ── Sayfa 1: Satışlar ──
    const ws1 = wb.addWorksheet('Satışlar');
    const headers1 = ['Tarih', 'Ürün Adı', 'Müşteri', 'Satış Türü', 'Kanal', 'Adet', 'Birim Fiyat', 'Toplam', 'Ödeme', 'Notlar'];
    const widths1 =  [13,       28,          22,         14,           18,      7,      14,             14,        16,       26];
    widths1.forEach((w, i) => { ws1.getColumn(i + 1).width = w; });

    addTitle(ws1, 'OTOMİND — SATIŞ RAPORU', headers1.length);
    addSubtitle(ws1, `Dönem: ${exportStartDate}  →  ${exportEndDate}   |   ${exportData.length} satış   |   Toplam: ${totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`, headers1.length);
    addSpacer(ws1, headers1.length);
    addHeaders(ws1, headers1);

    const payLabel = (m: string) =>
      m === 'nakit' ? 'Nakit' : m === 'kredi_karti' ? 'Kredi Kartı' : m === 'havale' ? 'Havale/EFT' : m === 'kapida' ? 'Kapıda' : m;

    exportData.forEach((s, i) => {
      addDataRow(ws1, [
        s.date, s.productName, s.customerName,
        s.saleType === 'arac_ozel' ? 'Araca Özel' : 'Normal',
        s.channel, s.quantity, s.unitPrice, s.totalPrice,
        payLabel(s.paymentMethod), s.notes || '',
      ], i, { currencyColumns: [7, 8], centerColumns: [4, 6, 9] });
    });

    addTotalRow(ws1,
      ['TOPLAM', '', '', '', '', totalQuantity, '', totalRevenue, '', ''],
      { currencyColumns: [8] }
    );

    // ── Sayfa 2: Özet ──
    const ws2 = wb.addWorksheet('Özet');
    ws2.getColumn(1).width = 32;
    ws2.getColumn(2).width = 26;

    addTitle(ws2, 'OTOMİND — SATIŞ ÖZETİ', 2);
    addSubtitle(ws2, `Dönem: ${exportStartDate}  →  ${exportEndDate}`, 2);
    addSpacer(ws2, 2);

    addSummaryPair(ws2, 'Rapor Başlangıç', exportStartDate);
    addSummaryPair(ws2, 'Rapor Bitiş', exportEndDate);
    addSpacer(ws2, 2, 4);
    addSummaryPair(ws2, 'Toplam Satış İşlemi', exportData.length, { bold: true });
    addSummaryPair(ws2, 'Toplam Ürün Adedi', totalQuantity);
    addSummaryPair(ws2, 'Toplam Ciro', totalRevenue, { isCurrency: true, positive: true, bold: true });
    addSpacer(ws2, 2, 4);
    addSummaryPair(ws2, 'Araca Özel — Satış Sayısı', aracOzel.length);
    addSummaryPair(ws2, 'Araca Özel — Ciro', aracOzel.reduce((s, x) => s + x.totalPrice, 0), { isCurrency: true });
    addSpacer(ws2, 2, 4);
    addSummaryPair(ws2, 'Normal — Satış Sayısı', normal.length);
    addSummaryPair(ws2, 'Normal — Ciro', normal.reduce((s, x) => s + x.totalPrice, 0), { isCurrency: true });

    // ── Sayfa 3: Kanal Bazlı ──
    const ws3 = wb.addWorksheet('Kanal Bazlı');
    [24, 14, 20].forEach((w, i) => { ws3.getColumn(i + 1).width = w; });

    const channelMap: Record<string, { count: number; total: number }> = {};
    exportData.forEach(s => {
      const ch = s.channel || 'Diğer';
      if (!channelMap[ch]) channelMap[ch] = { count: 0, total: 0 };
      channelMap[ch].count++;
      channelMap[ch].total += s.totalPrice;
    });
    const channelEntries = Object.entries(channelMap).sort((a, b) => b[1].total - a[1].total);

    addTitle(ws3, 'OTOMİND — KANAL BAZLI RAPOR', 3);
    addSubtitle(ws3, `Dönem: ${exportStartDate}  →  ${exportEndDate}`, 3);
    addSpacer(ws3, 3);
    addHeaders(ws3, ['Satış Kanalı', 'Satış Sayısı', 'Toplam Ciro']);

    channelEntries.forEach(([ch, d], i) => {
      addDataRow(ws3, [ch, d.count, d.total], i, { currencyColumns: [3], centerColumns: [2] });
    });
    addTotalRow(ws3,
      ['TOPLAM', channelEntries.reduce((s, [, d]) => s + d.count, 0), channelEntries.reduce((s, [, d]) => s + d.total, 0)],
      { currencyColumns: [3] }
    );

    await saveExcel(wb, `Otomind_Satis_Raporu_${exportStartDate}_${exportEndDate}.xlsx`);
    setToast({ msg: `${exportData.length} satış raporu indirildi`, type: 'success' });
    setShowExportModal(false);
  }

  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || (s.productName || '').toLowerCase().includes(q) || (s.customerName || '').toLowerCase().includes(q);
    const matchChannel = !filterChannel || s.channel === filterChannel;
    
    let matchType = true;
    if (filterType === 'minder') {
      const p = products.find(prod => prod.name === s.productName);
      matchType = p?.category === 'minder' || (s.productName || '').toLowerCase().includes('minder');
    } else if (filterType === 'yastik') {
      const p = products.find(prod => prod.name === s.productName);
      const nameLower = (s.productName || '').toLowerCase();
      matchType = p?.category === 'yastikseti' || nameLower.includes('yastık') || nameLower.includes('yastik');
    }

    return matchSearch && matchChannel && matchType;
  }).sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

  const thisMonth = toLocalYearMonth(new Date());
  const monthlyRevenue = sales.filter(s => (s.date || '').startsWith(thisMonth)).reduce((s, sale) => s + sale.totalPrice, 0);
  const aracOzelTotal = sales.filter(s => s.saleType === 'arac_ozel').reduce((s, sale) => s + sale.totalPrice, 0);
  const normalTotal = sales.filter(s => s.saleType !== 'arac_ozel').reduce((s, sale) => s + sale.totalPrice, 0);

  function handleSave() {
    if (!form.productName) { setToast({ msg: 'Ürün adı zorunludur', type: 'error' }); return; }
    if (!form.channel) { setToast({ msg: 'Lütfen bir satış kanalı seçiniz', type: 'error' }); return; }
    const finalCustomerName = form.customerName || 'Perakende Müşteri';
    const totalPrice = form.quantity * form.unitPrice;
    addSale({ ...form, customerName: finalCustomerName, totalPrice });
    setToast({ msg: 'Satış kaydedildi', type: 'success' });
    setShowModal(false);
    setForm(empty);
  }

  // channels => salesChannels
  const channels = salesChannels;
  const channelColors: Record<string, string> = {
    website: 'bg-blue-500/20 text-blue-400', hepsiburada: 'bg-orange-500/20 text-orange-400',
    n11: 'bg-purple-500/20 text-purple-400', bayi: 'bg-emerald-500/20 text-emerald-400', cimri: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="animate-page-enter space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Satışlar</h1>
          <p className="text-muted text-sm mt-1">{sales.length} satış kaydı</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
              setExportStartDate(toLocalDateStr(firstDay));
              setExportEndDate(toLocalDateStr(today));
              setShowExportModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Excel Rapor
          </button>
          <button onClick={() => { setForm({ ...empty, cashRegisterId: cashRegisters[0]?.id || 'default_onceki_kasa' }); setShowModal(true); }} className="btn-press flex items-center gap-2 bg-primary hover:bg-primary-hover text-main px-4 py-2.5 rounded-xl font-medium text-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Satış Ekle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">trending_up</span>
          </div>
          <div>
            <p className="text-muted text-xs">Bu Ay</p>
            <p className="text-main font-bold">{formatCurrency(monthlyRevenue)}</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-400 text-[20px]">receipt_long</span>
          </div>
          <div>
            <p className="text-muted text-xs">Normal Satış Toplamı</p>
            <p className="text-main font-bold">{formatCurrency(normalTotal)}</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[20px]">directions_car</span>
          </div>
          <div>
            <p className="text-muted text-xs">Araca Özel Toplamı</p>
            <p className="text-main font-bold">{formatCurrency(aracOzelTotal)}</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-purple-400 text-[20px]">shopping_bag</span>
          </div>
          <div>
            <p className="text-muted text-xs">Toplam İşlem</p>
            <p className="text-main font-bold">{filtered.length} satış</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark text-[18px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ürün veya müşteri ara..."
            className="w-full bg-overlay border border-divider rounded-xl pl-9 pr-4 py-2.5 text-sm text-main placeholder-slate-500 focus:outline-none focus:border-primary/50" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-muted-light focus:outline-none">
          <option value="">Tüm Kategoriler</option>
          <option value="minder">Oto Minderi</option>
          <option value="yastik">Oto Yastık</option>
        </select>
        <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}
          className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-muted-light focus:outline-none">
          <option value="">Tüm Kanallar</option>
          {channels.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      <div className="glass-panel -mx-4 sm:mx-0 rounded-none sm:rounded-2xl border-l-0 border-r-0 sm:border-l sm:border-r overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider-light">
                <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">ÜRÜN & KATEGORİ</th>
                <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">MÜŞTERİ</th>
                <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">KANAL</th>
                <th className="text-right text-xs text-muted-dark font-medium px-4 py-3">ADET</th>
                <th className="text-right text-xs text-muted-dark font-medium px-4 py-3">TUTAR</th>
                <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">TARİH</th>
                <th className="text-right text-xs text-muted-dark font-medium px-4 py-3">İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sale => (
                <tr key={sale.id} className="border-b border-white/[0.04] hover:bg-overlay-border-light">
                  <td className="px-4 py-3">
                    <p className="text-sm text-main font-medium">{sale.productName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${sale.saleType === 'arac_ozel' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'}`}>
                        {sale.saleType === 'arac_ozel' ? 'Araca Özel' : 'Normal'}
                      </span>
                      <p className="text-xs text-muted-dark">{formatCurrency(sale.unitPrice)} / adet</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-light">{sale.customerName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${channelColors[sale.channel] || 'bg-overlay text-muted'}`}>
                      {sale.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-main">{sale.quantity}</td>
                  <td className="px-4 py-3 text-right text-sm text-emerald-400 font-bold">{formatCurrency(sale.totalPrice)}</td>
                  <td className="px-4 py-3 text-sm text-muted">{formatDate(sale.date)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setConfirmDelete(sale.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-400">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted-dark">Satış bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Satış Ekle"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main">İptal</button>
            <button onClick={handleSave} className="btn-press px-5 py-2 bg-primary hover:bg-primary-hover text-main text-sm font-medium rounded-xl">Kaydet</button>
          </>
        }
      >
        {/* Satış Detayı */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-[18px]">shopping_cart</span>
            <h3 className="text-main text-sm font-medium">Satış Detayı</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Ürün Adı *</label>
              <input 
                list="product-list" 
                value={form.productName} 
                onChange={e => {
                  const val = e.target.value;
                  const matched = products.find(p => p.name.trim().toLowerCase() === val.trim().toLowerCase());
                  setForm(f => ({ 
                    ...f, 
                    productName: val,
                    unitPrice: matched && matched.salePrice ? matched.salePrice : f.unitPrice
                  }));
                }} 
                className="input-field w-full" 
                placeholder="Ürün seç veya yaz" 
              />
              <datalist id="product-list">
                {products.map(p => (
                  <option key={p.id} value={p.name}>
                    {p.name} (Stok: {p.stock} adet)
                  </option>
                ))}
              </datalist>
              {(() => {
                const sp = products.find(p => p.name.trim().toLowerCase() === form.productName.trim().toLowerCase());
                if (!sp) return null;

                const isOutOfStock = sp.stock <= 0;
                const isLowStock = !isOutOfStock && sp.stock <= (sp.minStock || 5);

                return (
                  <div className="mt-2.5 p-3 rounded-xl bg-overlay/60 border border-divider flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold ${
                        isOutOfStock 
                          ? 'bg-red-500/15 text-red-400 border-red-500/30' 
                          : isLowStock 
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {isOutOfStock ? 'error' : isLowStock ? 'warning' : 'inventory_2'}
                        </span>
                        <span>
                          {isOutOfStock 
                            ? `Stok Tükendi (${sp.stock} adet)` 
                            : isLowStock 
                              ? `Kritik Stok: ${sp.stock} adet` 
                              : `Mevcut Stok: ${sp.stock} adet`}
                        </span>
                      </div>

                      {sp.salePrice > 0 && (
                        <div className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">sell</span>
                          Birim Fiyat: {formatCurrency(sp.salePrice)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {sp.locationSira && (
                        <div className="flex items-center gap-1.5 bg-slate-500/10 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-500/20">
                          <span className="material-symbols-outlined text-[14px]">view_column</span>
                          Sıra: <strong>{sp.locationSira}</strong>
                        </div>
                      )}
                      {sp.locationCivi && (
                        <div className="flex items-center gap-1.5 bg-slate-500/10 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-500/20">
                          <span className="material-symbols-outlined text-[14px]">push_pin</span>
                          Çivi: <strong>{sp.locationCivi}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="sm:col-span-2 p-3 bg-overlay-light border border-divider rounded-xl">
               <div className="flex items-center justify-between mb-2">
                 <p className="text-sm font-medium text-main">Bağlı Hammaddeler Stoktan Düşülsün mü?</p>
                 <button 
                   onClick={() => setForm(f => ({ ...f, deductMaterial: !f.deductMaterial }))}
                   className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${form.deductMaterial ? 'bg-emerald-500' : 'bg-slate-600'}`}
                 >
                   <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${form.deductMaterial ? 'translate-x-5' : 'translate-x-1'}`} />
                 </button>
               </div>
               <p className={`text-[11px] mt-1 leading-relaxed ${form.deductMaterial ? 'text-emerald-400' : 'text-muted-dark italic'}`}>
                 {form.deductMaterial 
                  ? 'Sıfırdan Üretim: Ürüne tanımlı tüm alt malzemeler (kumaş, poşet, elyaf vb.) stoklarınızdan otomatik eksiltilir.' 
                  : 'Hazır Stoktan Teslim: Sadece satış onayı verilir, deponuzdaki bağlı hammadde ve materyallere hiçbir şekilde dokunulmaz.'}
               </p>
            </div>
          </div>
        </div>

        {/* Ödeme & Finans */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">payments</span>
            <h3 className="text-main text-sm font-medium">Ödeme & Finans</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Adet</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} className="input-field w-full" />
              {(() => {
                const sp = products.find(p => p.name.trim().toLowerCase() === form.productName.trim().toLowerCase());
                if (sp && form.quantity > sp.stock) {
                  return (
                    <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">warning</span>
                      Miktar ({form.quantity}), mevcut stoğun ({sp.stock}) üzerinde.
                    </p>
                  );
                }
                return null;
              })()}
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Birim Fiyat (₺)</label>
              <input type="number" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: Number(e.target.value) }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Kanal *</label>
              <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} className="input-field w-full">
                <option value="" disabled>Seçiniz</option>
                {channels.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Ödeme Yöntemi</label>
              <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as Sale['paymentMethod'] }))} className="input-field w-full">
                <option value="nakit">Nakit</option>
                <option value="kredi_karti">Kredi Kartı</option>
                <option value="havale">Havale/EFT</option>
                <option value="kapida">Kapıda</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Hangi Kasaya Gidecek? *</label>
              <select value={form.cashRegisterId} onChange={e => setForm(f => ({ ...f, cashRegisterId: e.target.value }))} className="input-field w-full">
                {cashRegisters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Tarih</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Toplam</label>
              <div className="input-field text-emerald-400 font-bold">{formatCurrency(form.quantity * form.unitPrice)}</div>
            </div>
          </div>
        </div>

        {/* Ek Bilgiler */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-purple-400 text-[18px]">note_alt</span>
            <h3 className="text-main text-sm font-medium">Ek Bilgiler</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Notlar</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input-field w-full resize-none" />
            </div>
          </div>
        </div>
      </Modal>
      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)}
        title="Satışı Sil"
        size="small"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm border border-divider rounded-xl text-muted hover:text-main transition-colors">İptal</button>
            <button onClick={() => { confirmDelete && deleteSale(confirmDelete); setConfirmDelete(null); setToast({ msg: 'Silindi', type: 'success' }); }} className="flex-1 px-4 py-2 text-sm bg-red-500 text-main rounded-xl font-medium hover:bg-red-600 transition-colors">Sil</button>
          </>
        }
      >
        <p className="text-muted text-sm">Bu satış kaydını silmek istediğinize emin misiniz?</p>
      </Modal>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Satış Raporu İndir"
        footer={
          <>
            <button onClick={() => setShowExportModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main transition-colors">İptal</button>
            <button onClick={handleExportSalesExcel} className="btn-press px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-main text-sm font-medium rounded-xl transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">download</span>
              İndir
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Hızlı Seçim */}
          <div>
            <label className="text-xs text-muted mb-2 block font-medium">Hızlı Seçim</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setQuickRange('thisWeek')} className="text-xs bg-overlay border border-divider hover:bg-overlay-hover text-muted-light px-3 py-1.5 rounded-lg transition-colors">Bu Hafta</button>
              <button onClick={() => setQuickRange('thisMonth')} className="text-xs bg-overlay border border-divider hover:bg-overlay-hover text-muted-light px-3 py-1.5 rounded-lg transition-colors">Bu Ay</button>
              <button onClick={() => setQuickRange('lastMonth')} className="text-xs bg-overlay border border-divider hover:bg-overlay-hover text-muted-light px-3 py-1.5 rounded-lg transition-colors">Geçen Ay</button>
              <button onClick={() => setQuickRange('last7')} className="text-xs bg-overlay border border-divider hover:bg-overlay-hover text-muted-light px-3 py-1.5 rounded-lg transition-colors">Son 7 Gün</button>
              <button onClick={() => setQuickRange('last30')} className="text-xs bg-overlay border border-divider hover:bg-overlay-hover text-muted-light px-3 py-1.5 rounded-lg transition-colors">Son 30 Gün</button>
            </div>
          </div>

          {/* Tarih Seçimi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Başlangıç Tarihi *</label>
              <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="input-field w-full dark-calendar" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Bitiş Tarihi *</label>
              <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="input-field w-full dark-calendar" />
            </div>
          </div>

          {/* Önizleme */}
          {exportStartDate && exportEndDate && (() => {
            const previewData = sales.filter(s => s.date >= exportStartDate && s.date <= exportEndDate);
            const previewTotal = previewData.reduce((sum, s) => sum + s.totalPrice, 0);
            return (
              <div className="bg-overlay border border-divider rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-emerald-400 text-[18px]">info</span>
                  <span className="text-muted-light">
                    Seçilen aralıkta <strong className="text-main">{previewData.length}</strong> satış kaydı bulundu.
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-dark">
                  Toplam ciro: <strong className="text-emerald-400">{formatCurrency(previewTotal)}</strong>
                </div>
              </div>
            );
          })()}

          {/* Bilgilendirme */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-blue-400 text-[16px] mt-0.5 shrink-0">description</span>
            <p className="text-blue-300/80 text-[11px] leading-relaxed">
              Excel dosyası 3 sayfa içerir: <strong>Satışlar</strong> (tüm satış detayları), <strong>Özet</strong> (toplam ciro, adet vb.) ve <strong>Kanal Bazlı</strong> (her kanalın satış dağılımı).
            </p>
          </div>
        </div>
      </Modal>
      <style>{`.input-field { background: var(--color-overlay); border: 1px solid var(--color-border-divider); border-radius: 0.75rem; padding: 0.625rem 0.75rem; color: inherit; font-size: 0.875rem; outline: none; } .input-field:focus { border-color: rgba(233,114,38,0.5); } .input-field option { background: var(--color-surface); color: var(--color-text-main); }`}</style>
    </div>
  );
}
