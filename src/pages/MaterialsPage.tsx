import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils/helpers';
import type { Material } from '../types';
import { MATERIAL_UNITS } from '../types';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const empty: Omit<Material, 'id' | 'createdAt'> = {
  name: '', type: 'kumas', unit: 'metre', stockQty: 0, minQty: 5, unitCost: 0, notes: '',
};

// Kumaş türü olarak sayılacak type'lar
const FABRIC_TYPE_VALUES = ['kumas'];

function isFabric(m: Material) {
  return FABRIC_TYPE_VALUES.includes(m.type);
}

export default function MaterialsPage() {
  const { materials, suppliers, materialTypes, addMaterial, updateMaterial, deleteMaterial } = useData();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Material | null>(null);
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const q = search.toLowerCase();
  const allFiltered = materials.filter(m => !q || m.name.toLowerCase().includes(q));

  const malzemeler = allFiltered.filter(m => !isFabric(m));
  const kumaslar = allFiltered.filter(m => isFabric(m));

  const malzemeValue = malzemeler.reduce((s, m) => s + m.stockQty * m.unitCost, 0);
  const kumasValue = kumaslar.reduce((s, m) => s + m.stockQty * m.unitCost, 0);
  const totalValue = malzemeValue + kumasValue;
  const lowStock = materials.filter(m => m.stockQty <= m.minQty);

  function openAdd(type: string) {
    const unit = type === 'kumas' ? 'metre' : 'adet';
    setForm({ ...empty, type, unit: unit as Material['unit'] });
    setEditItem(null);
    setShowModal(true);
  }
  function openEdit(m: Material) { setForm({ ...m }); setEditItem(m); setShowModal(true); }

  function handleSave() {
    if (!form.name) { setToast({ msg: 'Hammadde adı zorunludur', type: 'error' }); return; }
    if (editItem) { updateMaterial(editItem.id, form); setToast({ msg: 'Güncellendi', type: 'success' }); }
    else { addMaterial(form); setToast({ msg: 'Eklendi', type: 'success' }); }
    setShowModal(false);
  }

  function renderRow(m: Material) {
    const isLow = m.stockQty <= m.minQty;
    const supplier = suppliers.find(s => s.id === m.supplierId);
    return (
      <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-overlay-border-light group">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-main font-medium truncate">{m.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] bg-overlay border border-divider px-1.5 py-0.5 rounded text-muted">
              {materialTypes.find(t => t.value === m.type)?.label || m.type}
            </span>
            {supplier && <span className="text-[11px] text-slate-600">{supplier.name}</span>}
            {m.notes && <span className="text-[11px] text-slate-600">• {m.notes}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-bold ${isLow ? 'text-amber-400' : 'text-main'}`}>
            {m.stockQty} {m.unit}
            {isLow && <span className="material-symbols-outlined text-[13px] ml-1 align-middle">warning</span>}
          </p>
          <p className="text-[11px] text-muted-dark">{formatCurrency(m.unitCost)}/{m.unit}</p>
        </div>
        <p className="text-emerald-400 font-medium text-sm w-[90px] text-right shrink-0">{formatCurrency(m.stockQty * m.unitCost)}</p>
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => openEdit(m)} className="p-1.5 hover:bg-overlay-hover rounded-lg text-muted hover:text-main">
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
          <button onClick={() => setConfirmDelete(m.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-400">
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-page-enter space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Hammadde Stoğu</h1>
          <p className="text-muted text-sm mt-1">{materials.length} çeşit hammadde • Toplam Değer: {formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-400 text-[18px]">category</span>
          </div>
          <div>
            <p className="text-muted-dark text-[11px]">Malzeme</p>
            <p className="text-main font-bold">{malzemeler.length} çeşit</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-purple-400 text-[18px]">texture</span>
          </div>
          <div>
            <p className="text-muted-dark text-[11px]">Kumaş</p>
            <p className="text-main font-bold">{kumaslar.length} çeşit</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">payments</span>
          </div>
          <div>
            <p className="text-muted-dark text-[11px]">Toplam Değer</p>
            <p className="text-main font-bold">{formatCurrency(totalValue)}</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-amber-400 text-[18px]">warning</span>
          </div>
          <div>
            <p className="text-muted-dark text-[11px]">Kritik Stok</p>
            <p className="text-main font-bold">{lowStock.length}</p>
          </div>
        </div>
      </div>

      {/* Arama */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark text-[18px]">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hammadde veya kumaş ara..."
          className="w-full bg-overlay border border-divider rounded-xl pl-9 pr-4 py-2.5 text-sm text-main placeholder-slate-500 focus:outline-none focus:border-primary/50" />
      </div>

      {/* İki Bölüm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* SOL: MALZEMELER (kumaş olmayan) */}
        <div className="glass-panel -mx-4 sm:mx-0 rounded-none sm:rounded-2xl border-l-0 border-r-0 sm:border-l sm:border-r overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500/20 bg-blue-500/5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400 text-[20px]">category</span>
              <div>
                <h3 className="text-blue-400 font-semibold text-sm">MALZEMELER</h3>
                <p className="text-muted-dark text-[10px]">Kuşgözü, Bant, Kargo Poşeti, Etiket vb.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-300 font-bold text-xs">{formatCurrency(malzemeValue)}</span>
              <button onClick={() => openAdd('diger')} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400" title="Malzeme Ekle">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
            {malzemeler.length === 0 ? (
              <div className="text-center py-12 text-muted-dark text-sm">Malzeme bulunamadı</div>
            ) : (
              malzemeler.map(m => renderRow(m))
            )}
          </div>
        </div>

        {/* SAĞ: KUMAŞLAR */}
        <div className="glass-panel -mx-4 sm:mx-0 rounded-none sm:rounded-2xl border-l-0 border-r-0 sm:border-l sm:border-r overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-purple-500/5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-[20px]">texture</span>
              <div>
                <h3 className="text-purple-400 font-semibold text-sm">KUMAŞLAR</h3>
                <p className="text-muted-dark text-[10px]">Jakar, Süet, Peluş, Dijital Baskı vb.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-300 font-bold text-xs">{formatCurrency(kumasValue)}</span>
              <button onClick={() => openAdd('kumas')} className="p-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400" title="Kumaş Ekle">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
            {kumaslar.length === 0 ? (
              <div className="text-center py-12 text-muted-dark text-sm">Kumaş bulunamadı</div>
            ) : (
              kumaslar.map(m => renderRow(m))
            )}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editItem ? 'Düzenle' : (isFabric(form as Material) ? '🧵 Kumaş Ekle' : '🔧 Malzeme Ekle')}
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main">İptal</button>
            <button onClick={handleSave} className="btn-press px-5 py-2 bg-primary hover:bg-primary-hover text-main text-sm font-medium rounded-xl">Kaydet</button>
          </>
        }
      >
        {/* Malzeme Detayları */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-[18px]">category</span>
            <h3 className="text-main text-sm font-medium">Malzeme Detayları</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Hammadde Adı *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field w-full" placeholder={isFabric(form as Material) ? 'Örn: Siyah Jakar Kumaş' : 'Örn: Kuşgözü'} />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Tür</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Material['type'] }))} className="input-field w-full">
                {materialTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Birim</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value as Material['unit'] }))} className="input-field w-full">
                {MATERIAL_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Tedarik & Finans */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">calculate</span>
            <h3 className="text-main text-sm font-medium">Tedarik & Finans</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Stok Miktarı</label>
              <input type="number" value={form.stockQty} onChange={e => setForm(f => ({ ...f, stockQty: Number(e.target.value) }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Minimum Stok</label>
              <input type="number" value={form.minQty} onChange={e => setForm(f => ({ ...f, minQty: Number(e.target.value) }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Birim Maliyet (₺)</label>
              <input type="number" value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: Number(e.target.value) }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Tedarikçi</label>
              <select value={form.supplierId || ''} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value || undefined }))} className="input-field w-full">
                <option value="">Seç</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Açıklama */}
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
        title="Hammaddeyi Sil"
        size="small"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm border border-divider rounded-xl text-muted hover:text-main transition-colors">İptal</button>
            <button onClick={() => { confirmDelete && deleteMaterial(confirmDelete); setConfirmDelete(null); setToast({ msg: 'Silindi', type: 'success' }); }} className="flex-1 px-4 py-2 text-sm bg-red-500 text-main rounded-xl font-medium hover:bg-red-600 transition-colors">Sil</button>
          </>
        }
      >
        <p className="text-muted text-sm">Bu hammaddeyi silmek istediğinize emin misiniz?</p>
      </Modal>
      <style>{`.input-field { background: var(--color-overlay); border: 1px solid var(--color-border-divider); border-radius: 0.75rem; padding: 0.625rem 0.75rem; color: inherit; font-size: 0.875rem; outline: none; } .input-field:focus { border-color: rgba(233,114,38,0.5); } .input-field option { background: var(--color-surface); color: var(--color-text-main); }`}</style>
    </div>
  );
}
