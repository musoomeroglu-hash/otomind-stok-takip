import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency, getCategoryLabel } from '../utils/helpers';
import type { Product } from '../types';
import { PRODUCT_CATEGORIES, FABRIC_TYPES, CAR_BRANDS } from '../types';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';

const emptyProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '', category: 'kilif', skuCode: '', fabricType: 'jakar', color: '', pattern: '',
  materialId: '', materialAmount: 0,
  purchasePrice: 0, salePrice: 0, stock: 0, minStock: 2, isCustom: false,
  carBrand: '', carModel: '', carYear: '', channel: 'website', notes: '',
};

export default function ProductsPage() {
  const { products, materials, salesChannels, addProduct, updateProduct, deleteProduct } = useData();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.skuCode.toLowerCase().includes(q) || (p.carBrand || '').toLowerCase().includes(q);
    const matchCat = !filterCat || p.category === filterCat;
    const matchBrand = !filterBrand || p.carBrand === filterBrand;
    return matchSearch && matchCat && matchBrand;
  });

  function openAdd() { setForm(emptyProduct); setEditItem(null); setShowModal(true); }
  function openEdit(p: Product) { setForm({ ...p }); setEditItem(p); setShowModal(true); }

  function handleSave() {
    if (!form.name || !form.skuCode) { setToast({ msg: 'Ürün adı ve SKU kodu zorunludur', type: 'error' }); return; }
    if (editItem) { updateProduct(editItem.id, form); setToast({ msg: 'Ürün güncellendi', type: 'success' }); }
    else { addProduct(form); setToast({ msg: 'Ürün eklendi', type: 'success' }); }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    deleteProduct(id); setConfirmDelete(null); setToast({ msg: 'Ürün silindi', type: 'success' });
  }

  const brands = [...new Set(products.map(p => p.carBrand).filter(Boolean))];

  function handleExportExcel() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(products.map(p => ({
      'Ürün Adı': p.name,
      'Kategori': p.category,
      'Marka': p.carBrand || '',
      'Model': p.carModel || '',
      'Yıl': p.carYear || '',
      'SKU': p.skuCode,
      'Kumaş Türü': p.fabricType,
      'Renk': p.color || '',
      'Desen': p.pattern || '',
      'Hammadde (Kumaş) ID': p.materialId || '',
      'Kullanılan Metre': p.materialAmount || 0,
      'Alış Fiyatı': p.purchasePrice,
      'Satış Fiyatı': p.salePrice,
      'Stok': p.stock,
      'Min Stok': p.minStock,
      'Satış Kanalı': p.channel,
      'Notlar': p.notes || ''
    })));
    
    // Hammadde Listesi Sekmesi
    const materialsWs = XLSX.utils.json_to_sheet(materials.map(m => ({
      'Hammadde ID': m.id,
      'Adı': m.name,
      'Tipi': m.type,
      'Birim': m.unit,
      'Stok': m.stockQty
    })));

    XLSX.utils.book_append_sheet(wb, ws, "Urunler");
    XLSX.utils.book_append_sheet(wb, materialsWs, "Kumas_ve_Hammaddeler");
    XLSX.writeFile(wb, `Otomind_Urunler_${new Date().toISOString().split('T')[0]}.xlsx`);
    setToast({ msg: 'Ürünler Excel\'e dışa aktarıldı', type: 'success' });
  }

  function handleDownloadTemplate() {
    const wb = XLSX.utils.book_new();
    
    // 1. Ürünler Şablonu
    const templateData = [{
      'Ürün Adı': 'Örnek Koltuk Kılıfı',
      'SKU': 'KLF-001',
      'Kategori': 'kilif',
      'Marka': 'Toyota',
      'Model': 'Corolla',
      'Yıl': '2019-2024',
      'Kumaş Türü': 'jakar',
      'Renk': 'Siyah',
      'Desen': 'Düz',
      'Hammadde (Kumaş) ID': materials.length > 0 ? materials[0].id : '',
      'Kullanılan Metre': 2.5,
      'Alış Fiyatı': 500,
      'Satış Fiyatı': 1000,
      'Stok': 10,
      'Min Stok': 2,
      'Satış Kanalı': 'website',
      'Notlar': 'Bu bir örnek satırdır.'
    }];
    const wsUrunler = XLSX.utils.json_to_sheet(templateData);

    // 2. Referanslar
    const aoa: any[][] = [];
    aoa.push(['>>> BU SAYFA BİLGİ AMAÇLIDIR. ÜRÜNLERİ "Ürün_Yükleme_Sayfası"NA EKLERSİNİZ <<<']);
    aoa.push([]);
    
    aoa.push(['KATEGORİ KODLARI']);
    aoa.push(['KOD (Şablondaki Kategori sütununa yazılır)', 'AÇIKLAMA']);
    PRODUCT_CATEGORIES.forEach(c => aoa.push([c.value, c.label]));
    aoa.push([]);

    aoa.push(['KUMAŞ ETİKET KODLARI (Varyant İçin)']);
    aoa.push(['KOD (Şablondaki Kumaş Türü sütununa yazılır)', 'AÇIKLAMA']);
    FABRIC_TYPES.forEach(f => aoa.push([f.value, f.label]));
    aoa.push([]);

    aoa.push(['GERÇEK HAMMADDE/STOK KODLARI (Sistemdeki Kumaşlarınız)']);
    aoa.push(['HAMMADDE ID (Şablondaki Hammadde ID sütununa yazılır)', 'HAMMADDE ADI', 'STOK', 'BİRİM']);
    materials.forEach(m => aoa.push([m.id, m.name, m.stockQty, m.unit]));
    
    const wsReferanslar = XLSX.utils.aoa_to_sheet(aoa);

    XLSX.utils.book_append_sheet(wb, wsUrunler, "Ürün_Yükleme_Sayfası");
    XLSX.utils.book_append_sheet(wb, wsReferanslar, "Kodlar_ve_Kumaşlar");
    XLSX.writeFile(wb, `Otomind_Toplu_Urun_Sablonu.xlsx`);
    
    setToast({ msg: 'Örnek şablon indirildi', type: 'success' });
  }

  function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json<any>(ws);
        
        let added = 0;
        rows.forEach(row => {
          if (!row['Ürün Adı'] || !row['SKU']) return; // Skip invalid rows
          addProduct({
            name: row['Ürün Adı'] || '',
            category: row['Kategori'] || 'kilif',
            carBrand: row['Marka'] || '',
            carModel: row['Model'] || '',
            carYear: row['Yıl'] || '',
            skuCode: row['SKU'] || '',
            fabricType: row['Kumaş Türü'] || row['Kumaş'] || 'jakar',
            color: row['Renk'] || '',
            pattern: row['Desen'] || '',
            materialId: row['Hammadde (Kumaş) ID'] || '',
            materialAmount: Number(row['Kullanılan Metre']) || 0,
            purchasePrice: Number(row['Alış Fiyatı']) || 0,
            salePrice: Number(row['Satış Fiyatı']) || 0,
            stock: Number(row['Stok']) || 0,
            minStock: Number(row['Min Stok']) || 2,
            channel: row['Satış Kanalı'] || 'website',
            notes: row['Notlar'] || '',
            isCustom: false
          });
          added++;
        });
        
        setToast({ msg: `${added} ürün başarıyla içe aktarıldı.`, type: 'success' });
      } catch (err) {
        setToast({ msg: 'Excel okunurken bir hata oluştu.', type: 'error' });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className="animate-page-enter space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Ürünler</h1>
          <p className="text-muted text-sm mt-1">{products.length} ürün kayıtlı</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileInputRef} onChange={handleImportExcel} />

          <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors">
            <span className="material-symbols-outlined text-[18px]">swap_vert</span>
            Ürün Yönetimi
          </button>

          <button onClick={openAdd} className="btn-press flex items-center gap-2 bg-primary hover:bg-primary-hover text-main px-4 py-2.5 rounded-xl font-medium text-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Yeni Ürün
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark text-[18px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ürün adı, SKU, araç markası ara..."
            className="w-full bg-overlay border border-divider rounded-xl pl-9 pr-4 py-2.5 text-sm text-main placeholder-slate-500 focus:outline-none focus:border-primary/50" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-muted-light focus:outline-none focus:border-primary/50">
          <option value="">Tüm Kategoriler</option>
          {PRODUCT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
          className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-muted-light focus:outline-none focus:border-primary/50">
          <option value="">Tüm Markalar</option>
          {brands.map(b => <option key={b} value={b!}>{b}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-panel -mx-4 sm:mx-0 rounded-none sm:rounded-2xl border-l-0 border-r-0 sm:border-l sm:border-r overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider-light">
                <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">ÜRÜN</th>
                <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">KATEGORİ</th>
                <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">ARAÇ</th>
                <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">SKU</th>
                <th className="text-right text-xs text-muted-dark font-medium px-4 py-3">SATIŞ FİYATI</th>
                <th className="text-right text-xs text-muted-dark font-medium px-4 py-3">STOK</th>
                <th className="text-right text-xs text-muted-dark font-medium px-4 py-3">İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isLow = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className="border-b border-white/[0.04] hover:bg-overlay-border-light">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-main font-medium">{p.name}</p>
                        <p className="text-xs text-muted-dark">{p.fabricType} {p.color && `• ${p.color}`}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-overlay px-2 py-1 rounded-lg text-muted-light">{getCategoryLabel(p.category)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.carBrand ? <span className="text-sm text-muted-light">{p.carBrand} {p.carModel}</span>
                        : <span className="text-slate-600 text-xs">Evrensel</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{p.skuCode}</td>
                    <td className="px-4 py-3 text-right text-sm text-main font-medium">{formatCurrency(p.salePrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {p.stock}
                        {isLow && <span className="material-symbols-outlined text-[14px] ml-1">warning</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-overlay-hover rounded-lg text-muted hover:text-main">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button onClick={() => setConfirmDelete(p.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-400">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted-dark">Ürün bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editItem ? 'Ürün Düzenle' : 'Yeni Ürün'}
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main">İptal</button>
            <button onClick={handleSave} className="btn-press px-5 py-2 bg-primary hover:bg-primary-hover text-main text-sm font-medium rounded-xl">Kaydet</button>
          </>
        }
      >
        {/* Temel Bilgiler */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-[18px]">inventory_2</span>
            <h3 className="text-main text-sm font-medium">Temel Bilgiler</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Ürün Adı *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field w-full" placeholder="Ürün adı" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Kategori</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Product['category'] }))} className="input-field w-full">
                {PRODUCT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">SKU Kodu *</label>
              <input value={form.skuCode} onChange={e => setForm(f => ({ ...f, skuCode: e.target.value }))} className="input-field w-full" placeholder="Örn: KLF-TC-01" />
            </div>
          </div>
        </div>

        {/* Araç Bilgileri */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-blue-400 text-[18px]">directions_car</span>
            <h3 className="text-main text-sm font-medium">Araç Bilgileri</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Araç Markası</label>
              <select value={form.carBrand} onChange={e => setForm(f => ({ ...f, carBrand: e.target.value }))} className="input-field w-full">
                <option value="">Evrensel (Araç bağımsız)</option>
                {CAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Araç Modeli</label>
              <input value={form.carModel} onChange={e => setForm(f => ({ ...f, carModel: e.target.value }))} className="input-field w-full" placeholder="Örn: Corolla" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Model Yılı</label>
              <input value={form.carYear} onChange={e => setForm(f => ({ ...f, carYear: e.target.value }))} className="input-field w-full" placeholder="Örn: 2018-2024" />
            </div>
          </div>
        </div>

        {/* Tasarım & Varyant & Hammadde */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-purple-400 text-[18px]">palette</span>
            <h3 className="text-main text-sm font-medium">Tasarım & Hammadde (Stok Düşümü İçin)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="text-xs text-muted mb-1 block">Gerçek Hammadde Stok Başvurusu</label>
              <select value={form.materialId || ''} onChange={e => setForm(f => ({ ...f, materialId: e.target.value }))} className="input-field w-full">
                <option value="">Seçilmedi (Stok Düşemezsiniz)</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.stockQty} {m.unit} var)</option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="text-xs text-muted mb-1 block">Kullanılan Miktar {form.materialId ? materials.find(m => m.id === form.materialId)?.unit : '(Metre, Adet)'}</label>
              <input type="number" step="0.01" min="0" value={form.materialAmount === 0 ? '' : form.materialAmount} onChange={e => setForm(f => ({ ...f, materialAmount: Number(e.target.value) }))} className="input-field w-full" placeholder="Örn: 2" />
            </div>

            <div className="col-span-1 lg:col-span-2">
              <label className="text-xs text-muted mb-1 block">Tür (Varyant Etiketi)</label>
              <select value={form.fabricType} onChange={e => setForm(f => ({ ...f, fabricType: e.target.value as Product['fabricType'] }))} className="input-field w-full">
                {FABRIC_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Renk</label>
              <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="input-field w-full" placeholder="Renk" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Desen</label>
              <input value={form.pattern} onChange={e => setForm(f => ({ ...f, pattern: e.target.value }))} className="input-field w-full" placeholder="Desen adı" />
            </div>
          </div>
        </div>

        {/* Stok & Finans */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">payments</span>
            <h3 className="text-main text-sm font-medium">Stok & Finans</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Alış Fiyatı (₺)</label>
              <input type="number" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: Number(e.target.value) }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Satış Fiyatı (₺)</label>
              <input type="number" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: Number(e.target.value) }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Stok Adedi</label>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Min. Stok Uyarısı</label>
              <input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))} className="input-field w-full" />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Satış Kanalı</label>
              <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value as Product['channel'] }))} className="input-field w-full">
                {salesChannels.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Ek Bilgiler */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-amber-400 text-[18px]">note_alt</span>
            <h3 className="text-main text-sm font-medium">Ek Bilgiler</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Notlar</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input-field w-full resize-none" placeholder="Ek bilgi..." />
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)}
        title="Ürünü Sil"
        size="small"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm text-muted hover:text-main border border-divider rounded-xl transition-colors">İptal</button>
            <button onClick={() => confirmDelete && handleDelete(confirmDelete)} className="flex-1 px-4 py-2 text-sm text-main bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-colors">Sil</button>
          </>
        }
      >
        <p className="text-muted text-sm">Bu ürünü silmek istediğinize emin misiniz?</p>
      </Modal>

      <Modal 
        isOpen={showBulkModal} 
        onClose={() => setShowBulkModal(false)}
        title="Toplu Ürün Yönetimi"
        footer={
          <button onClick={() => setShowBulkModal(false)} className="px-5 py-2 text-sm text-muted hover:text-main transition-colors">Kapat</button>
        }
      >
        <div className="p-1 space-y-5">
          {/* Aksiyon Butonları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => { handleDownloadTemplate(); setShowBulkModal(false); }}
              className="flex flex-col items-center gap-3 bg-amber-500/10 border-2 border-dashed border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 rounded-2xl p-4 transition-all group">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-amber-400 text-[20px]">sim_card_download</span>
              </div>
              <div className="text-center">
                <p className="text-amber-400 font-semibold text-sm">Şablon İndir</p>
                <p className="text-muted-dark text-xs mt-1">Kod listesi içerir</p>
              </div>
            </button>

            <button onClick={() => { fileInputRef.current?.click(); setShowBulkModal(false); }}
              className="flex flex-col items-center gap-3 bg-emerald-500/10 border-2 border-dashed border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 rounded-2xl p-4 transition-all group">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-emerald-400 text-[20px]">upload_file</span>
              </div>
              <div className="text-center">
                <p className="text-emerald-400 font-semibold text-sm">Excel'den İçe Aktar</p>
                <p className="text-muted-dark text-xs mt-1">Toplu ürün eklemek için .xlsx dosyası yükleyin</p>
              </div>
            </button>

            <button onClick={() => { handleExportExcel(); setShowBulkModal(false); }}
              className="flex flex-col items-center gap-3 bg-blue-500/10 border-2 border-dashed border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 rounded-2xl p-4 transition-all group">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-blue-400 text-[20px]">download</span>
              </div>
              <div className="text-center">
                <p className="text-blue-400 font-semibold text-sm">Excel'e Dışa Aktar</p>
                <p className="text-muted-dark text-xs mt-1">Mevcut {products.length} ürünü Excel dosyasına indirin</p>
              </div>
            </button>
          </div>

          {/* Rehber */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pt-2 border-t border-divider-light">
              <span className="material-symbols-outlined text-primary text-[18px]">menu_book</span>
              <h3 className="text-main font-semibold text-sm">Kullanım Rehberi</h3>
            </div>

            {/* Adım 1 */}
            <div className="bg-overlay-light border border-divider-light rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">1</span>
                <p className="text-main text-sm font-medium">Excel Dosyası Hazırlama</p>
              </div>
              <p className="text-muted text-xs leading-relaxed ml-7">
                Önce <strong className="text-muted-light">"Dışa Aktar"</strong> ile mevcut ürünleri indirin ve şablon olarak kullanın. 
                Ya da boş bir Excel açıp aşağıdaki sütun başlıklarını ilk satıra yazın.
              </p>
            </div>

            {/* Adım 2 */}
            <div className="bg-overlay-light border border-divider-light rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">2</span>
                <p className="text-main text-sm font-medium">Zorunlu Sütunlar</p>
              </div>
              <div className="ml-7 flex flex-wrap gap-2">
                <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg">Ürün Adı ✱</span>
                <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg">SKU ✱</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Kategori</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Marka</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Model</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Yıl</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Kumaş Türü</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Renk</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Desen</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg">Hammadde (Kumaş) ID</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg">Kullanılan Metre</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Alış Fiyatı</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Satış Fiyatı</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Stok</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Min Stok</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Satış Kanalı</span>
                <span className="text-xs bg-overlay text-muted border border-divider px-2 py-1 rounded-lg">Notlar</span>
              </div>
              <p className="text-muted-dark text-[11px] mt-2 ml-7">✱ işaretli sütunlar zorunludur. Diğerleri boş bırakılabilir.</p>
            </div>

            {/* Adım 3 */}
            <div className="bg-overlay-light border border-divider-light rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">3</span>
                <p className="text-main text-sm font-medium">Kategori & Kumaş Kodları</p>
              </div>
              <div className="ml-7 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-muted-dark mb-1.5 uppercase font-medium">Kategoriler</p>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-light"><code className="text-primary bg-black/30 px-1 rounded">kilif</code> → Koltuk Kılıfı</p>
                    <p className="text-xs text-muted-light"><code className="text-primary bg-black/30 px-1 rounded">minder</code> → Oto Minderi</p>
                    <p className="text-xs text-muted-light"><code className="text-primary bg-black/30 px-1 rounded">yastikseti</code> → Yastık Seti</p>
                    <p className="text-xs text-muted-light"><code className="text-primary bg-black/30 px-1 rounded">konforseti</code> → Konfor Seti</p>
                    <p className="text-xs text-muted-light"><code className="text-primary bg-black/30 px-1 rounded">aksesuar</code> → Aksesuar</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-muted-dark mb-1.5 uppercase font-medium">Kumaşlar</p>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-light"><code className="text-purple-400 bg-black/30 px-1 rounded">jakar</code> → Jakar Dokuma</p>
                    <p className="text-xs text-muted-light"><code className="text-purple-400 bg-black/30 px-1 rounded">suet</code> → Süet</p>
                    <p className="text-xs text-muted-light"><code className="text-purple-400 bg-black/30 px-1 rounded">pelus</code> → Peluş</p>
                    <p className="text-xs text-muted-light"><code className="text-purple-400 bg-black/30 px-1 rounded">dijital_baski</code> → Dijital Baskı</p>
                    <p className="text-xs text-muted-light"><code className="text-purple-400 bg-black/30 px-1 rounded">diger</code> → Diğer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Uyarı */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-400 text-[18px] mt-0.5 shrink-0">warning</span>
              <div>
                <p className="text-amber-300 text-xs font-medium">Dikkat</p>
                <p className="text-amber-200/70 text-[11px] mt-0.5 leading-relaxed">
                  İçe aktarma mevcut ürünlerin üzerine yazmaz — her satır yeni ürün olarak eklenir. 
                  Dosyanız <strong>.xlsx</strong> formatında olmalıdır.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <style>{`.input-field { background: var(--color-overlay); border: 1px solid var(--color-border-divider); border-radius: 0.75rem; padding: 0.625rem 0.75rem; color: inherit; font-size: 0.875rem; outline: none; } .input-field:focus { border-color: rgba(233,114,38,0.5); } .input-field option { background: var(--color-surface); color: var(--color-text-main); }`}</style>
    </div>
  );
}
