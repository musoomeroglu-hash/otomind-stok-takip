import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { Purchase, PurchaseItem } from '../types';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const emptyItem: PurchaseItem = { name: '', quantity: 1, unitPrice: 0, totalPrice: 0 };
const empty: Omit<Purchase, 'id' | 'createdAt'> = {
  supplierId: '', supplierName: '', items: [{ ...emptyItem }], totalAmount: 0,
  isPaid: true, paymentMethod: 'Havale', notes: '', date: new Date().toISOString().split('T')[0],
};

export default function PurchasesPage() {
  const { purchases, suppliers, addPurchase, deletePurchase, materials } = useData();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = purchases.filter(p => {
    const q = search.toLowerCase();
    return !q || p.supplierName.toLowerCase().includes(q) || p.items.some(i => i.name.toLowerCase().includes(q));
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalSpent = filtered.reduce((s, p) => s + p.totalAmount, 0);

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  }

  function updateItem(index: number, field: keyof PurchaseItem, value: string | number) {
    setForm(f => {
      const newItems = [...f.items];
      newItems[index] = { ...newItems[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].totalPrice = Number(newItems[index].quantity) * Number(newItems[index].unitPrice);
      }
      return { ...f, items: newItems, totalAmount: newItems.reduce((s, i) => s + i.totalPrice, 0) };
    });
  }

  function removeItem(index: number) {
    if (form.items.length <= 1) return;
    setForm(f => {
      const newItems = f.items.filter((_, i) => i !== index);
      return { ...f, items: newItems, totalAmount: newItems.reduce((s, i) => s + i.totalPrice, 0) };
    });
  }

  function handleSave() {
    if (!form.supplierName) { setToast({ msg: 'Tedarikçi adı zorunludur', type: 'error' }); return; }
    if (form.items.some(i => !i.name)) { setToast({ msg: 'Ürün adları zorunludur', type: 'error' }); return; }
    
    addPurchase(form);
    setToast({ msg: 'Alım kaydedildi', type: 'success' });
    setShowModal(false);
    setForm(empty);
  }

  function handleSupplierSelect(id: string) {
    const sup = suppliers.find(s => s.id === id);
    setForm(f => ({ ...f, supplierId: id, supplierName: sup ? sup.name : '' }));
  }

  return (
    <div className="animate-page-enter space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Alımlar</h1>
          <p className="text-muted text-sm mt-1">{purchases.length} alım faturası</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-press flex items-center gap-2 bg-primary hover:bg-primary-hover text-main px-4 py-2.5 rounded-xl font-medium text-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Yeni Alım
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-purple-400 text-[20px]">shopping_cart</span>
          </div>
          <div>
            <p className="text-muted text-xs">Toplam Fatura</p>
            <p className="text-main font-bold">{filtered.length} adet</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-amber-400 text-[20px]">payments</span>
          </div>
          <div>
            <p className="text-muted text-xs">Toplam Alım Tutarı</p>
            <p className="text-main font-bold">{formatCurrency(totalSpent)}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark text-[18px]">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tedarikçi veya ürün ara..."
          className="w-full bg-overlay border border-divider rounded-xl pl-9 pr-4 py-2.5 text-sm text-main placeholder-slate-500 focus:outline-none focus:border-primary/50" />
      </div>

      <div className="glass-panel -mx-4 sm:mx-0 rounded-none sm:rounded-2xl border-l-0 border-r-0 sm:border-l sm:border-r overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider-light">
                <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">TEDARİKÇİ</th>
                <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">KALEMLER</th>
                <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">ÖDEME</th>
                <th className="text-right text-xs text-muted-dark font-medium px-4 py-3">TUTAR</th>
                <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">TARİH</th>
                <th className="text-right text-xs text-muted-dark font-medium px-4 py-3">İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-white/[0.04] hover:bg-overlay-border-light">
                  <td className="px-4 py-3">
                    <p className="text-sm text-main font-medium">{p.supplierName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {p.items.map((item, idx) => (
                        <p key={idx} className="text-xs text-muted">
                          {item.quantity}x {item.name} ({formatCurrency(item.unitPrice)})
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-light">
                    {p.isPaid ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs">Ödendi ({p.paymentMethod})</span>
                    ) : (
                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded text-xs">Ödenmedi (Vadeli)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-amber-400 font-bold">{formatCurrency(p.totalAmount)}</td>
                  <td className="px-4 py-3 text-sm text-muted">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setConfirmDelete(p.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-400">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-dark">Alım faturası bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Yeni Alım Faturası"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-sm">
              <span className="text-muted">Genel Toplam:</span>
              <span className="text-xl font-bold text-amber-400 ml-2">{formatCurrency(form.totalAmount)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main">İptal</button>
              <button onClick={handleSave} className="btn-press px-5 py-2 bg-primary hover:bg-primary-hover text-main text-sm font-medium rounded-xl">Kaydet</button>
            </div>
          </div>
        }
      >
        <div className="p-1 space-y-6">
          {/* Fatura Bilgileri */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
              <h3 className="text-main text-sm font-medium">Fatura Bilgileri</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-muted mb-1 block">Tedarikçi Seçimi *</label>
                <select value={form.supplierId || ''} onChange={e => handleSupplierSelect(e.target.value)} className="input-field w-full">
                  <option value="">Diğer (Adı manuel girin)</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {!form.supplierId && (
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted mb-1 block">Tedarikçi Adı *</label>
                  <input value={form.supplierName} onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))} className="input-field w-full" />
                </div>
              )}
              <div>
                <label className="text-xs text-muted mb-1 block">Tarih</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field w-full" />
              </div>
              <div className="sm:col-span-2 flex flex-col gap-3 p-4 rounded-xl border border-divider bg-overlay-light">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-main font-medium">Ödeme Yapıldı mı?</label>
                  <button 
                    onClick={() => setForm(f => ({ ...f, isPaid: !f.isPaid, paymentMethod: !f.isPaid ? 'Nakit' : 'Vadeli' }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.isPaid ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isPaid ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                {form.isPaid ? (
                  <div>
                    <label className="text-xs text-muted mb-1 block">Ödeme Yöntemi (Kasaya eksi olarak yansır)</label>
                    <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} className="input-field w-full">
                      <option value="Nakit">Nakit</option>
                      <option value="Havale">Havale/EFT</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    <span>Tedarikçiye olan borcunuz Cari Hesaba "Alacak/Borç" işlenir ancak Kasa etkilenmez.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alım Kalemleri */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">list_alt</span>
                <h3 className="text-main text-sm font-medium">Alım Kalemleri</h3>
              </div>
              <button onClick={addItem} className="text-xs text-primary font-medium hover:text-[#D45E15] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add</span> Yeni Kalem
              </button>
            </div>
            
            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div key={index} className="bg-overlay rounded-xl p-3 border border-divider flex flex-wrap gap-3 items-start relative">
                  <div className="flex-1 min-w-[200px]">
                    <input list="material-list" value={item.name} onChange={e => updateItem(index, 'name', e.target.value)} placeholder="Ürün / Hammadde Adı" className="input-field w-full py-2" />
                    <datalist id="material-list">{materials.map(m => <option key={m.id} value={m.name} />)}</datalist>
                  </div>
                  <div className="w-[80px]">
                    <input type="number" min="0" value={item.quantity || ''} onChange={e => updateItem(index, 'quantity', Number(e.target.value))} placeholder="Adet/Mt" className="input-field w-full py-2 px-2 text-center" />
                  </div>
                  <div className="w-[100px]">
                    <input type="number" min="0" value={item.unitPrice || ''} onChange={e => updateItem(index, 'unitPrice', Number(e.target.value))} placeholder="Br. Fiyat" className="input-field w-full py-2 px-2" />
                  </div>
                  <div className="w-[100px] flex items-center h-[38px] px-2 bg-black/20 rounded-lg text-amber-400 font-medium text-sm">
                    {formatCurrency(item.totalPrice)}
                  </div>
                  {form.items.length > 1 && (
                    <button onClick={() => removeItem(index)} className="p-2 text-muted-dark hover:text-red-400 hover:bg-black/30 rounded-lg absolute -right-2 -top-2 bg-surface border border-divider">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ek Bilgiler */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-purple-400 text-[18px]">note_alt</span>
              <h3 className="text-main text-sm font-medium">Ek Bilgiler</h3>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Notlar</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input-field w-full resize-none" />
            </div>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)}
        title="Alımı Sil"
        size="small"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm border border-divider rounded-xl text-muted hover:text-main transition-colors">İptal</button>
            <button onClick={() => { confirmDelete && deletePurchase(confirmDelete); setConfirmDelete(null); setToast({ msg: 'Silindi', type: 'success' }); }} className="flex-1 px-4 py-2 text-sm bg-red-500 text-main rounded-xl font-medium hover:bg-red-600 transition-colors">Sil</button>
          </>
        }
      >
        <p className="text-muted text-sm">Bu alım faturasını silmek istediğinize emin misiniz?</p>
      </Modal>
      <style>{`.input-field { background: var(--color-overlay); border: 1px solid var(--color-border-divider); border-radius: 0.75rem; padding: 0.625rem 0.75rem; color: inherit; font-size: 0.875rem; outline: none; } .input-field:focus { border-color: rgba(233,114,38,0.5); } .input-field option { background: var(--color-surface); color: var(--color-text-main); }`}</style>
    </div>
  );
}
