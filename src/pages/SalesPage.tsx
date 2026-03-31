import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { Sale } from '../types';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const empty: Omit<Sale, 'id' | 'createdAt'> = {
  saleType: 'normal', productName: '', customerName: '', quantity: 1, unitPrice: 0, totalPrice: 0,
  channel: 'website', paymentMethod: 'kredi_karti', notes: '',
  deductMaterial: false,
  date: new Date().toISOString().split('T')[0],
};

export default function SalesPage() {
  const { sales, products, salesChannels, addSale, deleteSale } = useData();
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.productName.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q);
    const matchChannel = !filterChannel || s.channel === filterChannel;
    const matchType = !filterType || s.saleType === filterType;
    return matchSearch && matchChannel && matchType;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const thisMonth = new Date().toISOString().substring(0, 7);
  const monthlyRevenue = sales.filter(s => s.date.startsWith(thisMonth)).reduce((s, sale) => s + sale.totalPrice, 0);
  const aracOzelTotal = sales.filter(s => s.saleType === 'arac_ozel').reduce((s, sale) => s + sale.totalPrice, 0);
  const normalTotal = sales.filter(s => s.saleType !== 'arac_ozel').reduce((s, sale) => s + sale.totalPrice, 0);

  function handleSave() {
    if (!form.productName) { setToast({ msg: 'Ürün adı zorunludur', type: 'error' }); return; }
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
        <button onClick={() => setShowModal(true)} className="btn-press flex items-center gap-2 bg-primary hover:bg-primary-hover text-main px-4 py-2.5 rounded-xl font-medium text-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Satış Ekle
        </button>
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
          <option value="arac_ozel">Araca Özel Satış</option>
          <option value="normal">Normal Satış</option>
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
              <input list="product-list" value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} className="input-field w-full" placeholder="Ürün seç veya yaz" />
              <datalist id="product-list">{products.map(p => <option key={p.id} value={p.name} />)}</datalist>
            </div>
            
            <div className="sm:col-span-2 p-3 bg-overlay-light border border-divider rounded-xl">
               <div className="flex items-center justify-between">
                 <p className="text-sm font-medium text-main">Kumaş Stoktan Düşülsün mü?</p>
                 <button 
                   onClick={() => setForm(f => ({ ...f, deductMaterial: !f.deductMaterial }))}
                   className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${form.deductMaterial ? 'bg-emerald-500' : 'bg-slate-600'}`}
                 >
                   <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${form.deductMaterial ? 'translate-x-5' : 'translate-x-1'}`} />
                 </button>
               </div>
               <p className={`text-[11px] mt-1 ${form.deductMaterial ? 'text-emerald-400' : 'text-muted-dark italic'}`}>
                 {form.deductMaterial 
                  ? 'Sıfırdan Üretim: Ürün kayıtlarındaki atanmış kumaş tutarı stoğunuzdan düşülecektir.' 
                  : 'Sadece satış işlenir, ürünün kumaşı hammadde stoğunuzdan düşülmez.'}
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
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Birim Fiyat (₺)</label>
              <input type="number" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: Number(e.target.value) }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Kanal</label>
              <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} className="input-field w-full">
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
      <style>{`.input-field { background: var(--color-overlay); border: 1px solid var(--color-border-divider); border-radius: 0.75rem; padding: 0.625rem 0.75rem; color: inherit; font-size: 0.875rem; outline: none; } .input-field:focus { border-color: rgba(233,114,38,0.5); } .input-field option { background: var(--color-surface); color: var(--color-text-main); }`}</style>
    </div>
  );
}
