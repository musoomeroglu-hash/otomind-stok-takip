import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { CashEntry } from '../types';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const emptyEntry: Omit<CashEntry, 'id' | 'createdAt'> = {
  type: 'cikis',
  category: 'diger',
  description: '',
  amount: 0,
  paymentMethod: 'nakit',
  date: new Date().toISOString().split('T')[0]
};

const CATEGORY_LABELS: Record<string, string> = {
  satis: 'Satış Geliri', alim: 'Alım Gideri', maas: 'Maaş', 
  kira: 'Kira', fatura: 'Fatura', kargo: 'Kargo', 
  reklam: 'Reklam', bakim: 'Bakım', diger: 'Diğer'
};

const METHOD_LABELS: Record<string, string> = {
  nakit: 'Nakit', kredi_karti: 'Kredi Kartı', havale: 'Havale', kapida: 'Kapıda Ödeme'
};

export default function KasaPage() {
  const { cashEntries, addCashEntry, deleteCashEntry } = useData();
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyEntry);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = cashEntries.filter(entry => {
    const q = search.toLowerCase();
    const matchSearch = !q || entry.description.toLowerCase().includes(q) || CATEGORY_LABELS[entry.category].toLowerCase().includes(q);
    const matchMonth = !filterMonth || entry.date.startsWith(filterMonth);
    return matchSearch && matchMonth;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIn = filtered.filter(e => e.type === 'giris').reduce((s, e) => s + e.amount, 0);
  const totalOut = filtered.filter(e => e.type === 'cikis').reduce((s, e) => s + e.amount, 0);
  const netBalance = totalIn - totalOut;

  function handleSave() {
    if (!form.amount || form.amount <= 0) {
      setToast({ msg: 'Geçerli bir tutar giriniz', type: 'error' });
      return;
    }
    if (!form.description.trim()) {
      setToast({ msg: 'Açıklama giriniz', type: 'error' });
      return;
    }

    addCashEntry(form);
    setToast({ msg: 'İşlem kaydedildi', type: 'success' });
    setShowModal(false);
    setForm(emptyEntry);
  }

  return (
    <div className="animate-page-enter space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Kasa & Gelir-Gider</h1>
          <p className="text-muted text-sm mt-1">Nakit akışı ve finansal işlemler</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-press flex items-center gap-2 bg-primary hover:bg-primary-hover text-main px-4 py-2.5 rounded-xl font-medium text-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Yeni İşlem Ekle
        </button>
      </div>

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
        {/* SOL: GELİRLER */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/5">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">trending_up</span>
            <h3 className="text-emerald-400 font-semibold text-sm">GELİRLER (GİRİŞ)</h3>
            <span className="ml-auto text-emerald-400 font-bold text-sm">{formatCurrency(totalIn)}</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
            {filtered.filter(e => e.type === 'giris').length === 0 ? (
              <div className="text-center py-12 text-muted-dark text-sm">Gelir kaydı bulunamadı</div>
            ) : (
              filtered.filter(e => e.type === 'giris').map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-overlay-border-light group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-main font-medium truncate">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">{CATEGORY_LABELS[entry.category] || entry.category}</span>
                      <span className="text-[11px] text-muted-dark">{formatDate(entry.date)}</span>
                      <span className="text-[11px] text-slate-600">{METHOD_LABELS[entry.paymentMethod || ''] || ''}</span>
                    </div>
                  </div>
                  <p className="text-emerald-400 font-bold text-sm whitespace-nowrap">+{formatCurrency(entry.amount)}</p>
                  <button onClick={() => setConfirmDelete(entry.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SAĞ: GİDERLER */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-rose-500/20 bg-rose-500/5">
            <span className="material-symbols-outlined text-rose-400 text-[20px]">trending_down</span>
            <h3 className="text-rose-400 font-semibold text-sm">GİDERLER (ÇIKIŞ)</h3>
            <span className="ml-auto text-rose-400 font-bold text-sm">{formatCurrency(totalOut)}</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
            {filtered.filter(e => e.type === 'cikis').length === 0 ? (
              <div className="text-center py-12 text-muted-dark text-sm">Gider kaydı bulunamadı</div>
            ) : (
              filtered.filter(e => e.type === 'cikis').map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-overlay-border-light group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-main font-medium truncate">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded">{CATEGORY_LABELS[entry.category] || entry.category}</span>
                      <span className="text-[11px] text-muted-dark">{formatDate(entry.date)}</span>
                      <span className="text-[11px] text-slate-600">{METHOD_LABELS[entry.paymentMethod || ''] || ''}</span>
                    </div>
                  </div>
                  <p className="text-rose-400 font-bold text-sm whitespace-nowrap">-{formatCurrency(entry.amount)}</p>
                  <button onClick={() => setConfirmDelete(entry.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Yeni Kasa İşlemi"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main transition-colors">İptal</button>
            <button onClick={handleSave} className="btn-press px-5 py-2 bg-primary hover:bg-primary-hover text-main text-sm font-medium rounded-xl transition-colors">Kaydet</button>
          </>
        }
      >
        <div className="p-1 space-y-4">
          <div>
            <label className="text-xs text-muted mb-1 block">İşlem Türü *</label>
            <div className="flex gap-2">
              <button onClick={() => setForm({...form, type: 'giris', category: 'satis'})} className={`flex-1 py-2 text-sm rounded-xl font-medium border ${form.type === 'giris' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-overlay border-divider text-muted hover:bg-overlay-hover'}`}>Gelir (Giriş)</button>
              <button onClick={() => setForm({...form, type: 'cikis', category: 'diger'})} className={`flex-1 py-2 text-sm rounded-xl font-medium border ${form.type === 'cikis' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-overlay border-divider text-muted hover:bg-overlay-hover'}`}>Gider (Çıkış)</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Tutar (₺) *</label>
              <input type="number" min="0" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} className="input-field w-full text-lg font-bold text-main placeholder-slate-600" placeholder="0.00" />
            </div>
            
            <div>
              <label className="text-xs text-muted mb-1 block">Kategori *</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})} className="input-field w-full select-dark">
                {form.type === 'giris' ? (
                  <>
                    <option value="satis">Satış Geliri</option>
                    <option value="diger">Diğer Gelir</option>
                  </>
                ) : (
                  <>
                    <option value="alim">Alım Gideri</option>
                    <option value="kira">Kira</option>
                    <option value="fatura">Fatura</option>
                    <option value="maas">Maaş</option>
                    <option value="kargo">Kargo</option>
                    <option value="reklam">Reklam</option>
                    <option value="bakim">Bakım Onarım</option>
                    <option value="diger">Diğer Gider</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="text-xs text-muted mb-1 block">Ödeme Yöntemi</label>
              <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value as any})} className="input-field w-full select-dark">
                <option value="nakit">Nakit</option>
                <option value="kredi_karti">Kredi Kartı</option>
                <option value="havale">Havale/EFT</option>
                <option value="kapida">Kapıda Ödeme</option>
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

      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)}
        title="İşlemi Sil"
        size="small"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm border border-divider rounded-xl text-muted hover:text-main transition-colors">İptal</button>
            <button onClick={() => { confirmDelete && deleteCashEntry(confirmDelete); setConfirmDelete(null); setToast({ msg: 'İşlem silindi', type: 'success' }); }} className="flex-1 px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-main rounded-xl font-medium transition-colors">Sil</button>
          </>
        }
      >
        <p className="text-muted text-sm">Bu kasa işlemini silmek istediğinize emin misiniz?</p>
      </Modal>

      <style>{`
        .input-field { background: rgba(255,255,255,0.03); border: 1px solid var(--color-border-divider); border-radius: 0.75rem; padding: 0.625rem 0.75rem; color: inherit; outline: none; transition: all 0.2s; }
        .input-field:focus { border-color: rgba(233,114,38,0.5); background: var(--color-overlay); }
        .select-dark option { background: var(--color-surface); color: var(--color-text-main); }
        .dark-calendar::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; cursor: pointer; }
        .dark-calendar::-webkit-calendar-picker-indicator:hover { opacity: 0.8; }
      `}</style>
    </div>
  );
}
