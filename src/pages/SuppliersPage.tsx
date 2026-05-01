import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import type { Supplier } from '../types';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const empty: Omit<Supplier, 'id' | 'createdAt'> = {
  name: '', phone: '', email: '', address: '', category: '', notes: '',
};

export default function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useData();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('supplier_view_mode') as 'card' | 'list') || 'card';
  });
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  function openAdd() { setForm(empty); setEditItem(null); setShowModal(true); }
  function openEdit(s: Supplier) { setForm({ ...s }); setEditItem(s); setShowModal(true); }

  function handleSave() {
    if (!form.name || !form.category) { setToast({ msg: 'Ad ve kategori zorunludur', type: 'error' }); return; }
    if (editItem) { updateSupplier(editItem.id, form); setToast({ msg: 'Tedarikçi güncellendi', type: 'success' }); }
    else { addSupplier(form); setToast({ msg: 'Tedarikçi eklendi', type: 'success' }); }
    setShowModal(false);
  }

  return (
    <div className="animate-page-enter space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Tedarikçiler</h1>
          <p className="text-muted text-sm mt-1">{suppliers.length} tedarikçi kayıtlı</p>
        </div>
        <button onClick={openAdd} className="btn-press flex items-center gap-2 bg-primary hover:bg-primary-hover text-main px-4 py-2.5 rounded-xl font-medium text-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tedarikçi Ekle
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark text-[18px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Firma adı veya kategori ara..."
            className="w-full bg-overlay border border-divider rounded-xl pl-9 pr-4 py-2.5 text-sm text-main placeholder-slate-500 focus:outline-none focus:border-primary/50" />
        </div>
        <div className="flex bg-overlay border border-divider rounded-xl p-1 shrink-0 h-[42px]">
          <button 
            onClick={() => { setViewMode('card'); localStorage.setItem('supplier_view_mode', 'card'); }}
            className={`px-3 py-1 text-sm font-medium flex items-center gap-1 transition-colors rounded-lg ${viewMode === 'card' ? 'bg-primary text-main' : 'text-muted-light hover:text-main'}`}
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span> Kart
          </button>
          <button 
            onClick={() => { setViewMode('list'); localStorage.setItem('supplier_view_mode', 'list'); }}
            className={`px-3 py-1 text-sm font-medium flex items-center gap-1 transition-colors rounded-lg ${viewMode === 'list' ? 'bg-primary text-main' : 'text-muted-light hover:text-main'}`}
          >
            <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span> Liste
          </button>
        </div>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(supplier => (
            <div key={supplier.id} className="card-hover glass-panel rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1E3050] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary">factory</span>
                  </div>
                  <div>
                    <p className="text-main font-semibold text-sm">{supplier.name}</p>
                    <p className="text-muted text-xs">{supplier.category}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(supplier)} className="p-1.5 hover:bg-overlay-hover rounded-lg text-muted hover:text-main">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button onClick={() => setConfirmDelete(supplier.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-400">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-muted-dark text-[16px]">phone</span>
                  <span className="text-muted-light">{supplier.phone}</span>
                </div>
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-muted-dark text-[16px]">mail</span>
                    <span className="text-muted-light">{supplier.email}</span>
                  </div>
                )}
              </div>
              {supplier.notes && (
                <p className="text-xs text-muted-dark mt-4 pt-3 border-t border-divider-light">{supplier.notes}</p>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full glass-panel rounded-2xl p-12 text-center text-muted-dark">Tedarikçi bulunamadı</div>
          )}
        </div>
      ) : (
        <div className="glass-panel -mx-4 sm:mx-0 rounded-none sm:rounded-2xl border-l-0 border-r-0 sm:border-l sm:border-r overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-divider-light bg-overlay-light/50">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-dark uppercase tracking-wider">Firma Adı</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-dark uppercase tracking-wider">Kategori</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-dark uppercase tracking-wider">İletişim</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-dark uppercase tracking-wider w-[100px]">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider-light">
                {filtered.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-overlay-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1E3050] flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-[16px]">factory</span>
                        </div>
                        <span className="text-sm font-semibold text-main">{supplier.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted font-medium bg-overlay-light border border-divider px-2 py-1 rounded-lg">{supplier.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {supplier.phone && <span className="text-xs text-muted-light flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">phone</span>{supplier.phone}</span>}
                        {supplier.email && <span className="text-xs text-muted-light flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">mail</span>{supplier.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(supplier)} className="p-1.5 hover:bg-overlay-hover rounded-lg text-muted hover:text-main transition-colors">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button onClick={() => setConfirmDelete(supplier.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-400 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-12 text-muted-dark">Tedarikçi bulunamadı</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editItem ? 'Tedarikçi Düzenle' : 'Tedarikçi Ekle'}
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main">İptal</button>
            <button onClick={handleSave} className="btn-press px-5 py-2 bg-primary hover:bg-primary-hover text-main text-sm font-medium rounded-xl">Kaydet</button>
          </>
        }
      >
        {/* Firma Bilgileri */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-[18px]">domain</span>
            <h3 className="text-main text-sm font-medium">Firma Bilgileri</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Firma Adı *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Kategori *</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field w-full" placeholder="Örn: Kumaş Tedarikçisi" />
            </div>
          </div>
        </div>

        {/* İletişim Ağı */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-blue-400 text-[18px]">contact_phone</span>
            <h3 className="text-main text-sm font-medium">İletişim</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Telefon</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">E-posta</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Adres</label>
              <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} className="input-field w-full resize-none" />
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
        title="Tedarikçiyi Sil"
        size="small"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm border border-divider rounded-xl text-muted hover:text-main transition-colors">İptal</button>
            <button onClick={() => { confirmDelete && deleteSupplier(confirmDelete); setConfirmDelete(null); setToast({ msg: 'Silindi', type: 'success' }); }} className="flex-1 px-4 py-2 text-sm bg-red-500 text-main rounded-xl font-medium hover:bg-red-600 transition-colors">Sil</button>
          </>
        }
      >
        <p className="text-muted text-sm">Bu tedarikçiyi silmek istediğinize emin misiniz?</p>
      </Modal>
      <style>{`.input-field { background: var(--color-overlay); border: 1px solid var(--color-border-divider); border-radius: 0.75rem; padding: 0.625rem 0.75rem; color: inherit; font-size: 0.875rem; outline: none; } .input-field:focus { border-color: rgba(233,114,38,0.5); }`}</style>
    </div>
  );
}
