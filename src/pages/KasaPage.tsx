import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { CashEntry } from '../types';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const CATEGORY_LABELS: Record<string, string> = {
  satis: 'Satış Geliri', alim: 'Alım Gideri', maas: 'Maaş',
  kira: 'Kira', fatura: 'Fatura', kargo: 'Kargo',
  reklam: 'Reklam', bakim: 'Bakım', diger: 'Diğer'
};

const METHOD_LABELS: Record<string, string> = {
  nakit: 'Nakit', kredi_karti: 'Kredi Kartı', havale: 'Havale', kapida: 'Kapıda Ödeme'
};

export default function KasaPage() {
  const { cashEntries, addCashEntry, deleteCashEntry, cashRegisters, addCashRegister, updateCashRegister, deleteCashRegister } = useData();

  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>('all');

  const emptyEntry: Omit<CashEntry, 'id' | 'createdAt'> = {
    type: 'cikis', category: 'diger', description: '', amount: 0,
    paymentMethod: 'nakit', cashRegisterId: cashRegisters[0]?.id || 'default_onceki_kasa',
    date: new Date().toISOString().split('T')[0]
  };

  const [showModal, setShowModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [form, setForm] = useState(emptyEntry);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newRegisterName, setNewRegisterName] = useState('');
  const [editingRegister, setEditingRegister] = useState<{ id: string; name: string } | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  function setQuickRange(range: 'thisWeek' | 'thisMonth' | 'lastMonth' | 'last7' | 'last30') {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (range) {
      case 'thisWeek': {
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        setExportStartDate(monday.toISOString().split('T')[0]);
        setExportEndDate(todayStr);
        break;
      }
      case 'thisMonth': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        setExportStartDate(firstDay.toISOString().split('T')[0]);
        setExportEndDate(todayStr);
        break;
      }
      case 'lastMonth': {
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        setExportStartDate(firstDay.toISOString().split('T')[0]);
        setExportEndDate(lastDay.toISOString().split('T')[0]);
        break;
      }
      case 'last7': {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);
        setExportStartDate(weekAgo.toISOString().split('T')[0]);
        setExportEndDate(todayStr);
        break;
      }
      case 'last30': {
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 29);
        setExportStartDate(monthAgo.toISOString().split('T')[0]);
        setExportEndDate(todayStr);
        break;
      }
    }
  }

  function handleExportKasaExcel() {
    if (!exportStartDate || !exportEndDate) {
      setToast({ msg: 'Başlangıç ve bitiş tarihi seçiniz', type: 'error' });
      return;
    }

    const exportData = cashEntries.filter(e => e.date >= exportStartDate && e.date <= exportEndDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (exportData.length === 0) {
      setToast({ msg: 'Seçilen tarih aralığında işlem bulunamadı', type: 'error' });
      return;
    }

    const totalIn = exportData.filter(e => e.type === 'giris').reduce((s, e) => s + e.amount, 0);
    const totalOut = exportData.filter(e => e.type === 'cikis').reduce((s, e) => s + e.amount, 0);

    // Sayfa 1: Kasa İşlemleri
    const rows = exportData.map(e => ({
      'Tarih': e.date,
      'İşlem Türü': e.type === 'giris' ? 'GELİR' : 'GİDER',
      'Kategori': CATEGORY_LABELS[e.category] || e.category,
      'Açıklama': e.description,
      'Tutar (₺)': e.type === 'giris' ? e.amount : -e.amount,
      'Ödeme Yöntemi': METHOD_LABELS[e.paymentMethod || ''] || '',
    }));

    // Sayfa 2: Özet
    const summaryRows = [
      { 'Bilgi': 'Rapor Başlangıç', 'Değer': exportStartDate },
      { 'Bilgi': 'Rapor Bitiş', 'Değer': exportEndDate },
      { 'Bilgi': 'Toplam İşlem Sayısı', 'Değer': exportData.length },
      { 'Bilgi': 'Toplam Gelir (₺)', 'Değer': totalIn },
      { 'Bilgi': 'Toplam Gider (₺)', 'Değer': totalOut },
      { 'Bilgi': 'Net Bakiye (₺)', 'Değer': totalIn - totalOut },
    ];

    // Sayfa 3: Kategori Bazlı
    const categorySummary: Record<string, { count: number; total: number }> = {};
    exportData.forEach(e => {
      const cat = CATEGORY_LABELS[e.category] || e.category;
      if (!categorySummary[cat]) categorySummary[cat] = { count: 0, total: 0 };
      categorySummary[cat].count++;
      categorySummary[cat].total += (e.type === 'giris' ? e.amount : -e.amount);
    });
    const categoryRows = Object.entries(categorySummary).map(([cat, data]) => ({
      'Kategori': cat,
      'İşlem Sayısı': data.count,
      'Net Tutar (₺)': data.total,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Kasa İşlemleri');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Özet');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categoryRows), 'Kategori Bazlı');

    XLSX.writeFile(wb, `Otomind_Kasa_Raporu_${exportStartDate}_${exportEndDate}.xlsx`);
    setToast({ msg: `${exportData.length} kasa işlemi raporu indirildi`, type: 'success' });
    setShowExportModal(false);
  }

  // Kasa filtreleme
  const filteredByRegister = cashEntries.filter(entry => {
    if (selectedRegisterId === 'all') return true;
    return (entry.cashRegisterId || 'default_onceki_kasa') === selectedRegisterId;
  });

  const filtered = filteredByRegister.filter(entry => {
    const q = search.toLowerCase();
    const matchSearch = !q || entry.description.toLowerCase().includes(q) || (CATEGORY_LABELS[entry.category] || '').toLowerCase().includes(q);
    const matchMonth = !filterMonth || entry.date.startsWith(filterMonth);
    return matchSearch && matchMonth;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIn = filtered.filter(e => e.type === 'giris').reduce((s, e) => s + e.amount, 0);
  const totalOut = filtered.filter(e => e.type === 'cikis').reduce((s, e) => s + e.amount, 0);
  const netBalance = totalIn - totalOut;

  // Her kasanın bakiyesini hesapla
  function getRegisterBalance(registerId: string) {
    const entries = cashEntries.filter(e => (e.cashRegisterId || 'default_onceki_kasa') === registerId);
    const income = entries.filter(e => e.type === 'giris').reduce((s, e) => s + e.amount, 0);
    const expense = entries.filter(e => e.type === 'cikis').reduce((s, e) => s + e.amount, 0);
    return income - expense;
  }

  function getRegisterName(id: string) {
    return cashRegisters.find(r => r.id === id)?.name || 'Bilinmeyen';
  }

  function handleSave() {
    if (!form.amount || form.amount <= 0) { setToast({ msg: 'Geçerli bir tutar giriniz', type: 'error' }); return; }
    if (!form.description.trim()) { setToast({ msg: 'Açıklama giriniz', type: 'error' }); return; }
    addCashEntry(form);
    setToast({ msg: 'İşlem kaydedildi', type: 'success' });
    setShowModal(false);
    setForm(emptyEntry);
  }

  function handleAddRegister() {
    if (!newRegisterName.trim()) return;
    addCashRegister(newRegisterName.trim());
    setNewRegisterName('');
    setToast({ msg: 'Kasa eklendi', type: 'success' });
  }

  function handleDeleteRegister(id: string) {
    const count = cashEntries.filter(e => (e.cashRegisterId || 'default_onceki_kasa') === id).length;
    if (count > 0) {
      setToast({ msg: `Bu kasada ${count} adet işlem var. Önce işlemleri başka kasaya taşıyın.`, type: 'error' });
      return;
    }
    deleteCashRegister(id);
    setToast({ msg: 'Kasa silindi', type: 'success' });
  }

  function handleUpdateRegister() {
    if (!editingRegister || !editingRegister.name.trim()) return;
    updateCashRegister(editingRegister.id, editingRegister.name.trim());
    setEditingRegister(null);
    setToast({ msg: 'Kasa güncellendi', type: 'success' });
  }

  const renderEntry = (entry: CashEntry, type: 'giris' | 'cikis') => {
    const isGiris = type === 'giris';
    const colorClass = isGiris ? 'emerald' : 'rose';
    return (
      <div key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-overlay-border-light group">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-main font-medium truncate">{entry.description}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[10px] bg-${colorClass}-500/10 text-${colorClass}-400 border border-${colorClass}-500/20 px-1.5 py-0.5 rounded`}>{CATEGORY_LABELS[entry.category] || entry.category}</span>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">{getRegisterName(entry.cashRegisterId || 'default_onceki_kasa')}</span>
            <span className="text-[11px] text-muted-dark">{formatDate(entry.date)}</span>
            <span className="text-[11px] text-slate-600">{METHOD_LABELS[entry.paymentMethod || ''] || ''}</span>
          </div>
        </div>
        <p className={`text-${colorClass}-400 font-bold text-sm whitespace-nowrap`}>{isGiris ? '+' : '-'}{formatCurrency(entry.amount)}</p>
        <button onClick={() => setConfirmDelete(entry.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0">
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    );
  };

  return (
    <div className="animate-page-enter space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Kasa & Gelir-Gider</h1>
          <p className="text-muted text-sm mt-1">Nakit akışı ve finansal işlemler</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
              setExportStartDate(firstDay.toISOString().split('T')[0]);
              setExportEndDate(today.toISOString().split('T')[0]);
              setShowExportModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Excel Rapor
          </button>
          <button onClick={() => setShowRegisterModal(true)} className="flex items-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors">
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            Kasa Yönetimi
          </button>
          <button onClick={() => { setForm({...emptyEntry, cashRegisterId: selectedRegisterId !== 'all' ? selectedRegisterId : cashRegisters[0]?.id || 'default_onceki_kasa'}); setShowModal(true); }} className="btn-press flex items-center gap-2 bg-primary hover:bg-primary-hover text-main px-4 py-2.5 rounded-xl font-medium text-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Yeni İşlem Ekle
          </button>
        </div>
      </div>

      {/* Kasa Seçici */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button onClick={() => setSelectedRegisterId('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selectedRegisterId === 'all' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-overlay border-divider text-muted hover:bg-overlay-hover'}`}>
          <span className="block">Tümü (Toplam)</span>
          <span className="block text-[11px] mt-0.5 opacity-80">{formatCurrency(cashEntries.filter(e => e.type === 'giris').reduce((s,e) => s+e.amount,0) - cashEntries.filter(e => e.type === 'cikis').reduce((s,e) => s+e.amount,0))}</span>
        </button>
        {cashRegisters.map(r => (
          <button key={r.id} onClick={() => setSelectedRegisterId(r.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selectedRegisterId === r.id ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-overlay border-divider text-muted hover:bg-overlay-hover'}`}>
            <span className="block">{r.name}</span>
            <span className="block text-[11px] mt-0.5 opacity-80">{formatCurrency(getRegisterBalance(r.id))}</span>
          </button>
        ))}
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full blur-2xl"></div>
          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-1">Toplam Giriş (Gelir)</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalIn)}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full blur-2xl"></div>
          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-1">Toplam Çıkış (Gider)</p>
          <p className="text-2xl font-bold text-rose-400">{formatCurrency(totalOut)}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden border-l-4 border-primary">
          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-1">Net Kasa Durumu</p>
          <p className={`text-2xl font-bold ${netBalance > 0 ? 'text-main' : netBalance < 0 ? 'text-rose-400' : 'text-muted-light'}`}>
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>

      {/* Kasa Bakiyeleri - sadece Tümü seçiliyken */}
      {selectedRegisterId === 'all' && cashRegisters.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {cashRegisters.map(r => {
            const bal = getRegisterBalance(r.id);
            return (
              <button key={r.id} onClick={() => setSelectedRegisterId(r.id)}
                className="glass-panel rounded-xl p-3 text-left hover:bg-overlay-hover transition-colors cursor-pointer border border-blue-500/10">
                <p className="text-xs text-muted truncate">{r.name}</p>
                <p className={`text-sm font-bold mt-1 ${bal >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>{formatCurrency(bal)}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Arama + Ay Filtresi */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark text-[18px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İşlem ara..."
            className="w-full bg-overlay border border-divider rounded-xl pl-9 pr-4 py-2.5 text-sm text-main placeholder-slate-500 focus:outline-none focus:border-primary/50" />
        </div>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-main focus:outline-none dark-calendar" />
      </div>

      {/* İki Sütunlu Gelir / Gider Görünümü */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/5">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">trending_up</span>
            <h3 className="text-emerald-400 font-semibold text-sm">GELİRLER (GİRİŞ)</h3>
            <span className="ml-auto text-emerald-400 font-bold text-sm">{formatCurrency(totalIn)}</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
            {filtered.filter(e => e.type === 'giris').length === 0 ? (
              <div className="text-center py-12 text-muted-dark text-sm">Gelir kaydı bulunamadı</div>
            ) : filtered.filter(e => e.type === 'giris').map(entry => renderEntry(entry, 'giris'))}
          </div>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-rose-500/20 bg-rose-500/5">
            <span className="material-symbols-outlined text-rose-400 text-[20px]">trending_down</span>
            <h3 className="text-rose-400 font-semibold text-sm">GİDERLER (ÇIKIŞ)</h3>
            <span className="ml-auto text-rose-400 font-bold text-sm">{formatCurrency(totalOut)}</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
            {filtered.filter(e => e.type === 'cikis').length === 0 ? (
              <div className="text-center py-12 text-muted-dark text-sm">Gider kaydı bulunamadı</div>
            ) : filtered.filter(e => e.type === 'cikis').map(entry => renderEntry(entry, 'cikis'))}
          </div>
        </div>
      </div>

      {/* Yeni İşlem Modalı */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Yeni Kasa İşlemi"
        footer={<>
          <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main transition-colors">İptal</button>
          <button onClick={handleSave} className="btn-press px-5 py-2 bg-primary hover:bg-primary-hover text-main text-sm font-medium rounded-xl transition-colors">Kaydet</button>
        </>}>
        <div className="p-1 space-y-4">
          <div>
            <label className="text-xs text-muted mb-1 block">İşlem Türü *</label>
            <div className="flex gap-2">
              <button onClick={() => setForm({...form, type: 'giris', category: 'satis'})} className={`flex-1 py-2 text-sm rounded-xl font-medium border ${form.type === 'giris' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-overlay border-divider text-muted hover:bg-overlay-hover'}`}>Gelir (Giriş)</button>
              <button onClick={() => setForm({...form, type: 'cikis', category: 'diger'})} className={`flex-1 py-2 text-sm rounded-xl font-medium border ${form.type === 'cikis' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-overlay border-divider text-muted hover:bg-overlay-hover'}`}>Gider (Çıkış)</button>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">Kasa *</label>
            <select value={form.cashRegisterId} onChange={e => setForm({...form, cashRegisterId: e.target.value})} className="input-field w-full select-dark">
              {cashRegisters.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Tutar (₺) *</label>
              <input type="number" min="0" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} className="input-field w-full text-lg font-bold text-main placeholder-slate-600" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Kategori *</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})} className="input-field w-full select-dark">
                {form.type === 'giris' ? (<><option value="satis">Satış Geliri</option><option value="diger">Diğer Gelir</option></>) : (<><option value="alim">Alım Gideri</option><option value="kira">Kira</option><option value="fatura">Fatura</option><option value="maas">Maaş</option><option value="kargo">Kargo</option><option value="reklam">Reklam</option><option value="bakim">Bakım Onarım</option><option value="diger">Diğer Gider</option></>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Ödeme Yöntemi</label>
              <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value as any})} className="input-field w-full select-dark">
                <option value="nakit">Nakit</option><option value="kredi_karti">Kredi Kartı</option><option value="havale">Havale/EFT</option><option value="kapida">Kapıda Ödeme</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Tarih *</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field w-full dark-calendar" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Açıklama *</label>
              <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field w-full" placeholder="Örn: Nakit satış tahsilatı" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Kasa Yönetimi Modalı */}
      <Modal isOpen={showRegisterModal} onClose={() => { setShowRegisterModal(false); setEditingRegister(null); }} title="Kasa Yönetimi"
        footer={<button onClick={() => { setShowRegisterModal(false); setEditingRegister(null); }} className="px-5 py-2 text-sm text-muted hover:text-main transition-colors">Kapat</button>}>
        <div className="p-1 space-y-4">
          <div className="flex gap-2">
            <input value={newRegisterName} onChange={e => setNewRegisterName(e.target.value)} placeholder="Kasa Adı (Örn: Akbank, Nakit Kasa)" className="input-field flex-1" onKeyDown={e => e.key === 'Enter' && handleAddRegister()} />
            <button onClick={handleAddRegister} className="btn-press px-4 py-2 bg-primary hover:bg-primary-hover text-main text-sm font-medium rounded-xl">Ekle</button>
          </div>
          <div className="space-y-2">
            {cashRegisters.map(r => (
              <div key={r.id} className="flex items-center gap-2 p-3 bg-overlay rounded-xl border border-divider">
                {editingRegister?.id === r.id ? (
                  <>
                    <input value={editingRegister.name} onChange={e => setEditingRegister({...editingRegister, name: e.target.value})} className="input-field flex-1 !py-1.5 text-sm" onKeyDown={e => e.key === 'Enter' && handleUpdateRegister()} />
                    <button onClick={handleUpdateRegister} className="p-1.5 hover:bg-emerald-500/20 rounded-lg text-emerald-400"><span className="material-symbols-outlined text-[16px]">check</span></button>
                    <button onClick={() => setEditingRegister(null)} className="p-1.5 hover:bg-overlay-hover rounded-lg text-muted"><span className="material-symbols-outlined text-[16px]">close</span></button>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-blue-400 text-[18px]">account_balance</span>
                    <span className="text-sm text-main font-medium flex-1">{r.name}</span>
                    <button onClick={() => setEditingRegister({ id: r.id, name: r.name })} className="p-1.5 hover:bg-overlay-hover rounded-lg text-muted hover:text-main"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                    {r.id === 'default_onceki_kasa' ? (
                      <span className="text-[10px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded ml-1">SİLİNEMEZ</span>
                    ) : (
                      <button onClick={() => handleDeleteRegister(r.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-400"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Silme Onay Modalı */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="İşlemi Sil" size="small"
        footer={<>
          <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm border border-divider rounded-xl text-muted hover:text-main transition-colors">İptal</button>
          <button onClick={() => { confirmDelete && deleteCashEntry(confirmDelete); setConfirmDelete(null); setToast({ msg: 'İşlem silindi', type: 'success' }); }} className="flex-1 px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-main rounded-xl font-medium transition-colors">Sil</button>
        </>}>
        <p className="text-muted text-sm">Bu kasa işlemini silmek istediğinize emin misiniz?</p>
      </Modal>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Kasa Raporu İndir"
        footer={
          <>
            <button onClick={() => setShowExportModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main transition-colors">İptal</button>
            <button onClick={handleExportKasaExcel} className="btn-press px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-main text-sm font-medium rounded-xl transition-colors flex items-center gap-2">
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
            const previewData = cashEntries.filter(e => e.date >= exportStartDate && e.date <= exportEndDate);
            const previewIn = previewData.filter(e => e.type === 'giris').reduce((s, e) => s + e.amount, 0);
            const previewOut = previewData.filter(e => e.type === 'cikis').reduce((s, e) => s + e.amount, 0);
            return (
              <div className="bg-overlay border border-divider rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-emerald-400 text-[18px]">info</span>
                  <span className="text-muted-light">
                    Seçilen aralıkta <strong className="text-main">{previewData.length}</strong> işlem bulundu.
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-muted-dark">
                  <span>Gelir: <strong className="text-emerald-400">{formatCurrency(previewIn)}</strong></span>
                  <span>Gider: <strong className="text-rose-400">{formatCurrency(previewOut)}</strong></span>
                  <span>Net: <strong className={previewIn - previewOut >= 0 ? 'text-main' : 'text-rose-400'}>{formatCurrency(previewIn - previewOut)}</strong></span>
                </div>
              </div>
            );
          })()}

          {/* Bilgilendirme */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-blue-400 text-[16px] mt-0.5 shrink-0">description</span>
            <p className="text-blue-300/80 text-[11px] leading-relaxed">
              Excel dosyası 3 sayfa içerir: <strong>Kasa İşlemleri</strong> (tüm gelir/gider detayları),
              <strong> Özet</strong> (toplam gelir, gider, net bakiye) ve
              <strong> Kategori Bazlı</strong> (kategori dağılımı).
            </p>
          </div>
        </div>
      </Modal>

      <style>{`
        .input-field { background: rgba(255,255,255,0.03); border: 1px solid var(--color-border-divider); border-radius: 0.75rem; padding: 0.625rem 0.75rem; color: inherit; outline: none; transition: all 0.2s; font-size: 0.875rem; }
        .input-field:focus { border-color: rgba(233,114,38,0.5); background: var(--color-overlay); }
        .select-dark option { background: var(--color-surface); color: var(--color-text-main); }
        .dark-calendar::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; cursor: pointer; }
        .dark-calendar::-webkit-calendar-picker-indicator:hover { opacity: 0.8; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
