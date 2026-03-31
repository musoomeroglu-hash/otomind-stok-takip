import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import type { CustomOrder } from '../types';
import { CAR_BRANDS, ORDER_STATUSES } from '../types';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const empty: Omit<CustomOrder, 'id' | 'createdAt'> = {
  customerName: '', customerPhone: '', carBrand: '', carModel: '', carYear: '',
  productType: 'kilif', fabricType: '', pattern: '', color: '', notes: '',
  materialId: '', materialAmount: 5, deductMaterial: true,
  status: 'beklemede', orderDate: new Date().toISOString().split('T')[0],
  deliveryDate: '', price: 0, isPaid: false, paymentMethod: 'nakit', channel: 'website',
};

export default function CustomOrdersPage() {
  const { customOrders, accounts, materials, salesChannels, addCustomOrder, updateCustomOrder, deleteCustomOrder } = useData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CustomOrder | null>(null);
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = customOrders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.customerName.toLowerCase().includes(q) || o.carBrand.toLowerCase().includes(q) || o.carModel.toLowerCase().includes(q);
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function openAdd() { setForm(empty); setEditItem(null); setShowModal(true); }
  function openEdit(o: CustomOrder) { setForm({ ...o }); setEditItem(o); setShowModal(true); }

  function handleSave() {
    if (!form.customerName || !form.carBrand || !form.carModel) {
      setToast({ msg: 'Müşteri adı, araç markası ve modeli zorunludur', type: 'error' }); return;
    }
    if (editItem) { updateCustomOrder(editItem.id, form); setToast({ msg: 'Sipariş güncellendi', type: 'success' }); }
    else { addCustomOrder(form); setToast({ msg: 'Sipariş eklendi', type: 'success' }); }
    setShowModal(false);
  }

  function handleStatusChange(id: string, status: CustomOrder['status']) {
    updateCustomOrder(id, { status });
    setToast({ msg: 'Sipariş durumu güncellendi', type: 'success' });
  }

  function handleReceivePayment(id: string) {
    updateCustomOrder(id, { isPaid: true, paymentMethod: 'nakit' });
    setToast({ msg: 'Ödeme alındı ve kasaya işlendi', type: 'success' });
  }

  return (
    <div className="animate-page-enter space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Özel Siparişler</h1>
          <p className="text-muted text-sm mt-1">{customOrders.length} sipariş kayıtlı</p>
        </div>
        <button onClick={openAdd} className="btn-press flex items-center gap-2 bg-primary hover:bg-primary-hover text-main px-4 py-2.5 rounded-xl font-medium text-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Yeni Sipariş
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {ORDER_STATUSES.map(s => {
          const count = customOrders.filter(o => o.status === s.value).length;
          return (
            <button key={s.value} onClick={() => setFilterStatus(filterStatus === s.value ? '' : s.value)}
              className={`glass-panel rounded-xl p-3 text-center transition-all ${filterStatus === s.value ? 'ring-2 ring-[#E97226]' : ''}`}>
              <div className="text-lg font-bold text-main">{count}</div>
              <div className="text-[10px] text-muted mt-0.5">{s.label}</div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark text-[18px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Müşteri, araç markası, model ara..."
            className="w-full bg-overlay border border-divider rounded-xl pl-9 pr-4 py-2.5 text-sm text-main placeholder-slate-500 focus:outline-none focus:border-primary/50" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-muted-light focus:outline-none">
          <option value="">Tüm Durumlar</option>
          {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(order => (
          <div key={order.id} className="card-hover glass-panel rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-main font-semibold">{order.customerName}</p>
                <p className="text-xs text-muted-dark mt-0.5">{order.customerPhone}</p>
              </div>
              <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>

            <div className="bg-overlay-light rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-primary text-[16px]">directions_car</span>
                <span className="text-muted-light">{order.carBrand} {order.carModel} {order.carYear && `(${order.carYear})`}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-muted-dark text-[16px]">texture</span>
                <span className="text-muted">{order.fabricType} {order.color && `• ${order.color}`} {order.pattern && `• ${order.pattern}`}</span>
              </div>
              {order.notes && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="material-symbols-outlined text-muted-dark text-[16px] mt-0.5">notes</span>
                  <span className="text-muted text-xs">{order.notes}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-dark text-xs">Fiyat: </span>
                <span className="text-main font-bold">{formatCurrency(order.price)}</span>
              </div>
              {order.deliveryDate && (
                <div>
                  <span className="text-muted-dark text-xs">Teslim: </span>
                  <span className="text-muted-light text-xs">{formatDate(order.deliveryDate)}</span>
                </div>
              )}
            </div>

            {/* Payment Button */}
            {!order.isPaid && (
              <button 
                onClick={() => handleReceivePayment(order.id)} 
                className="btn-press w-full py-2 mt-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border border-emerald-500/20"
              >
                <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                Ödeme Al (Kasaya İşle)
              </button>
            )}

            {/* Status Update */}
            <div className="pt-2 border-t border-divider-light flex items-center justify-between gap-2">
              <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value as CustomOrder['status'])}
                className="flex-1 bg-overlay border border-divider rounded-lg px-2 py-1.5 text-xs text-muted-light focus:outline-none">
                {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button onClick={() => openEdit(order)} className="p-1.5 hover:bg-overlay-hover rounded-lg text-muted hover:text-main">
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
              <button onClick={() => setConfirmDelete(order.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-400">
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full glass-panel rounded-2xl p-12 text-center text-muted-dark">Sipariş bulunamadı</div>
        )}
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editItem ? 'Sipariş Düzenle' : 'Yeni Özel Sipariş'}
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main">İptal</button>
            <button onClick={handleSave} className="btn-press px-5 py-2 bg-primary hover:bg-primary-hover text-main text-sm font-medium rounded-xl">Kaydet</button>
          </>
        }
      >
        <div className="p-1 space-y-5">
          {/* Müşteri Bilgileri */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-[18px]">person</span>
              <h3 className="text-main text-sm font-medium">Müşteri Bilgileri</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Müşteri Adı *</label>
                <input list="customer-list" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className="input-field w-full" placeholder="Müşteri seç veya yaz" />
                <datalist id="customer-list">{accounts.filter(a => a.type === 'musteri').map(c => <option key={c.id} value={c.name} />)}</datalist>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Telefon</label>
                <input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} className="input-field w-full" placeholder="0532 xxx xxxx" />
              </div>
            </div>
          </div>

          {/* Araç Bilgileri */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-blue-400 text-[18px]">directions_car</span>
              <h3 className="text-main text-sm font-medium">Araç Bilgileri</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Araç Markası *</label>
                <select value={form.carBrand} onChange={e => setForm(f => ({ ...f, carBrand: e.target.value }))} className="input-field w-full">
                  <option value="">Seç</option>
                  {CAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Araç Modeli *</label>
                <input value={form.carModel} onChange={e => setForm(f => ({ ...f, carModel: e.target.value }))} className="input-field w-full" placeholder="Örn: Corolla" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Model Yılı</label>
                <input value={form.carYear} onChange={e => setForm(f => ({ ...f, carYear: e.target.value }))} className="input-field w-full" placeholder="Örn: 2022" />
              </div>
            </div>
          </div>

          {/* Sipariş Detayları */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-purple-400 text-[18px]">design_services</span>
              <h3 className="text-main text-sm font-medium">Sipariş Detayları</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Ürün Tipi</label>
                <select value={form.productType} onChange={e => setForm(f => ({ ...f, productType: e.target.value as CustomOrder['productType'] }))} className="input-field w-full">
                  <option value="kilif">Koltuk Kılıfı</option>
                  <option value="minder">Oto Minderi</option>
                  <option value="aksesuar">Aksesuar</option>
                  <option value="set">Set</option>
                </select>
              </div>
              <div className="sm:col-span-2 p-3 bg-overlay-light border border-divider rounded-xl">
                 <div className="flex items-center justify-between mb-3 border-b border-divider-light pb-2">
                   <p className="text-sm font-medium text-main">Gerçek Stoktan Hammadde Düş</p>
                   <button 
                     onClick={() => setForm(f => ({ ...f, deductMaterial: !f.deductMaterial }))}
                     className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${form.deductMaterial ? 'bg-emerald-500' : 'bg-slate-600'}`}
                   >
                     <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${form.deductMaterial ? 'translate-x-5' : 'translate-x-1'}`} />
                   </button>
                 </div>
                 {form.deductMaterial && (
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-xs text-muted mb-1 block">Hammadde (Kumaş)</label>
                       <select value={form.materialId || ''} onChange={e => {
                         const mId = e.target.value;
                         const mName = materials.find(m => m.id === mId)?.name || '';
                         setForm(f => ({ ...f, materialId: mId, fabricType: mName }));
                       }} className="input-field w-full">
                         <option value="">Seçiniz</option>
                         {materials.map(m => (
                           <option key={m.id} value={m.id}>{m.name} ({m.stockQty} {m.unit})</option>
                         ))}
                       </select>
                     </div>
                     <div>
                       <label className="text-xs text-muted mb-1 block">Giden Metre/Adet</label>
                       <input type="number" step="0.5" min="0" value={form.materialAmount} onChange={e => setForm(f => ({ ...f, materialAmount: Number(e.target.value) }))} className="input-field w-full" />
                     </div>
                   </div>
                 )}
                 {!form.deductMaterial && (
                   <p className="text-[11px] text-muted-dark italic">Sipariş eklendiğinde stoklarınızdan kumaş/hammadde düşülmez.</p>
                 )}
              </div>

              <div>
                <label className="text-xs text-muted mb-1 block">Renk</label>
                <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="input-field w-full" placeholder="Örn: Siyah" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Desen</label>
                <input value={form.pattern} onChange={e => setForm(f => ({ ...f, pattern: e.target.value }))} className="input-field w-full" placeholder="Örn: Çizgili" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Kanal</label>
                <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} className="input-field w-full">
                  {salesChannels.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Durum</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CustomOrder['status'] }))} className="input-field w-full">
                  {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Tarih ve Fiyat */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-emerald-400 text-[18px]">payments</span>
              <h3 className="text-main text-sm font-medium">Tarih ve Fiyat</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Sipariş Tarihi</label>
                <input type="date" value={form.orderDate} onChange={e => setForm(f => ({ ...f, orderDate: e.target.value }))} className="input-field w-full" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Teslim Tarihi</label>
                <input type="date" value={form.deliveryDate || ''} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} className="input-field w-full" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Fiyat (₺)</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="input-field w-full" placeholder="0" />
              </div>

              <div className="sm:col-span-3 mt-1">
                <div className="flex items-center justify-between p-3 bg-overlay-light border border-divider rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-main">Ödeme Alındı mı?</p>
                    <p className="text-[11px] text-muted-dark mt-0.5">Sipariş eklendiğinde gelir olarak kasaya işlenir.</p>
                  </div>
                  <button 
                    onClick={() => setForm(f => ({ ...f, isPaid: !f.isPaid }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${form.isPaid ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${form.isPaid ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {form.isPaid && (
                <div className="sm:col-span-3">
                  <label className="text-xs text-muted mb-1 block">Ödeme Yöntemi</label>
                  <select value={form.paymentMethod || 'nakit'} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} className="input-field w-full">
                    <option value="nakit">Nakit</option>
                    <option value="kredi_karti">Kredi Kartı</option>
                    <option value="havale">Havale/EFT</option>
                    <option value="kapida">Kapıda</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Notlar */}
          <div>
            <label className="text-xs text-muted mb-1 block">Notlar</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input-field w-full resize-none" placeholder="Ek bilgiler..." />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)}
        title="Siparişi Sil"
        size="small"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm border border-divider rounded-xl text-muted hover:text-main transition-colors">İptal</button>
            <button onClick={() => { confirmDelete && deleteCustomOrder(confirmDelete); setConfirmDelete(null); setToast({ msg: 'Sipariş silindi', type: 'success' }); }} className="flex-1 px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-main rounded-xl font-medium transition-colors">Sil</button>
          </>
        }
      >
        <p className="text-muted text-sm">Bu siparişi silmek istediğinize emin misiniz?</p>
      </Modal>
      <style>{`.input-field { background: var(--color-overlay); border: 1px solid var(--color-border-divider); border-radius: 0.75rem; padding: 0.625rem 0.75rem; color: inherit; font-size: 0.875rem; outline: none; } .input-field:focus { border-color: rgba(233,114,38,0.5); } .input-field option { background: var(--color-surface); color: var(--color-text-main); }`}</style>
    </div>
  );
}
