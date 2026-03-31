import { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import Toast from '../components/Toast';

export default function SettingsPage() {
  const { materialTypes, materials, addMaterialType, deleteMaterialType, salesChannels, addSalesChannel, deleteSalesChannel, whatsappConfig, updateWhatsappConfig } = useData();
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newChannelLabel, setNewChannelLabel] = useState('');
  const [waPhone, setWaPhone] = useState(whatsappConfig?.phone || '');
  const [waApiKey, setWaApiKey] = useState(whatsappConfig?.apikey || '');
  const importRef = useRef<HTMLInputElement>(null);

  const ALL_KEYS = ['products', 'customOrders', 'materials', 'accounts', 'cariTransactions', 'suppliers', 'sales', 'purchases', 'cashEntries', 'reminders', 'calendarEvents', 'materialTypes', 'whatsappConfig'];

  function clearData() {
    if (window.confirm("TÜM VERİLERİ silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
      ALL_KEYS.forEach(k => localStorage.removeItem(`otomind_${k}`));
      setToast({ msg: 'Tüm veriler temizlendi. Yeniden başlatılıyor...', type: 'success' });
      setTimeout(() => window.location.reload(), 2000);
    }
  }

  function exportData() {
    const data: Record<string, unknown> = {};
    ALL_KEYS.forEach(k => {
      const saved = localStorage.getItem(`otomind_${k}`);
      if (saved) data[k] = JSON.parse(saved);
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `otomind-yedek-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ msg: 'Yedek dosyası indirildi', type: 'success' });
  }

  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        let count = 0;
        ALL_KEYS.forEach(k => {
          if (data[k]) {
            localStorage.setItem(`otomind_${k}`, JSON.stringify(data[k]));
            count++;
          }
        });
        // Also handle legacy key names
        if (data.customers) localStorage.setItem('otomind_accounts', JSON.stringify(data.customers));
        if (data.expenses) localStorage.setItem('otomind_cashEntries', JSON.stringify(data.expenses));
        
        setToast({ msg: `${count} veri grubu başarıyla içe aktarıldı. Yeniden başlatılıyor...`, type: 'success' });
        setTimeout(() => window.location.reload(), 2000);
      } catch {
        setToast({ msg: 'Geçersiz yedek dosyası!', type: 'error' });
      }
    };
    reader.readAsText(file);
  }

  function handleAddType() {
    if (!newTypeLabel.trim()) return;
    const val = newTypeLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (materialTypes.some(t => t.value === val)) {
      setToast({ msg: 'Bu tür zaten var', type: 'error' });
      return;
    }
    addMaterialType({ value: val, label: newTypeLabel.trim() });
    setNewTypeLabel('');
    setToast({ msg: 'Hammadde türü eklendi', type: 'success' });
  }

  function handleDeleteType(id: string, value: string) {
    const isUsed = materials.some(m => m.type === value);
    if (isUsed) {
      setToast({ msg: 'Bu türde kayıtlı hammaddeler var, silinemez!', type: 'error' });
      return;
    }
    if (window.confirm('Bu türü silmek istediğinize emin misiniz?')) {
      deleteMaterialType(id);
      setToast({ msg: 'Tür silindi', type: 'success' });
    }
  }

  function handleAddChannel() {
    if (!newChannelLabel.trim()) return;
    const val = newChannelLabel.trim().toLowerCase().replace(/\s+/g, '_');
    if (salesChannels.includes(val)) {
      setToast({ msg: 'Bu kanal zaten var', type: 'error' });
      return;
    }
    addSalesChannel(val);
    setNewChannelLabel('');
    setToast({ msg: 'Satış kanalı eklendi', type: 'success' });
  }

  function handleDeleteChannel(channel: string) {
    if (window.confirm('Bu kanalı silmek istediğinize emin misiniz? (Önceki kayıtlarda seçili kaldıysa orada görünmeye devam edecektir)')) {
      deleteSalesChannel(channel);
      setToast({ msg: 'Kanal silindi', type: 'success' });
    }
  }

  function handleSaveWhatsapp() {
    updateWhatsappConfig({ phone: waPhone.trim(), apikey: waApiKey.trim() });
    setToast({ msg: 'WhatsApp ayarları kaydedildi', type: 'success' });
  }

  return (
    <div className="animate-page-enter space-y-6 max-w-4xl">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={e => { if (e.target.files?.[0]) importData(e.target.files[0]); }} />

      <div>
        <h1 className="text-2xl font-bold text-main">Sistem Ayarları</h1>
        <p className="text-muted text-sm mt-1">Uygulama görünümü ve veri yönetimi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Hammadde Türleri */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-divider-light pb-4">
            <span className="material-symbols-outlined text-purple-400">category</span>
            <h2 className="text-lg font-semibold text-main">Hammadde Türleri</h2>
          </div>
          
          <div className="flex gap-2">
            <input 
              value={newTypeLabel} 
              onChange={e => setNewTypeLabel(e.target.value)} 
              placeholder="Yeni Tür Ekle..." 
              className="flex-1 bg-overlay border border-divider rounded-xl px-3 text-sm text-main focus:outline-none" 
            />
            <button onClick={handleAddType} className="bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 px-4 py-2 rounded-xl text-sm font-medium">Ekle</button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {materialTypes.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-white/[0.02] border border-divider-light rounded-xl p-3">
                <span className="text-sm text-muted-light">{t.label}</span>
                <button onClick={() => handleDeleteType(t.id, t.value)} className="text-muted-dark hover:text-red-400">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
            {materialTypes.length === 0 && <p className="text-sm text-muted-dark">Hiç tür yok</p>}
          </div>
        </div>

        {/* Satış Kanalları */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-divider-light pb-4">
            <span className="material-symbols-outlined text-orange-400">store</span>
            <h2 className="text-lg font-semibold text-main">Satış Kanalları</h2>
          </div>
          
          <div className="flex gap-2">
            <input 
              value={newChannelLabel} 
              onChange={e => setNewChannelLabel(e.target.value)} 
              placeholder="Yeni Kanal (Örn: Trendyol)..." 
              className="flex-1 bg-overlay border border-divider rounded-xl px-3 text-sm text-main focus:outline-none" 
            />
            <button onClick={handleAddChannel} className="bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 px-4 py-2 rounded-xl text-sm font-medium">Ekle</button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {salesChannels.map(c => (
              <div key={c} className="flex items-center justify-between bg-white/[0.02] border border-divider-light rounded-xl p-3">
                <span className="text-sm text-muted-light">{c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ')} ({c})</span>
                <button onClick={() => handleDeleteChannel(c)} className="text-muted-dark hover:text-red-400">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
            {salesChannels.length === 0 && <p className="text-sm text-muted-dark">Hiç kanal yok</p>}
          </div>
        </div>

        {/* Veri ve Yedekleme */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-divider-light pb-4">
            <span className="material-symbols-outlined text-blue-400">database</span>
            <h2 className="text-lg font-semibold text-main">Veri Yönetimi</h2>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-light mb-3">Sistem Yedeği</p>
            <div className="bg-overlay border border-divider rounded-xl p-4 space-y-3">
              <p className="text-xs text-muted leading-relaxed">
                Tüm verilerinizi güvende tutmak için JSON yedek dosyası indirebilir veya daha önce almış olduğunuz bir yedeği geri yükleyebilirsiniz.
              </p>
              <button onClick={exportData} className="btn-press flex items-center justify-center gap-2 w-full bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2.5 rounded-xl text-sm font-medium">
                <span className="material-symbols-outlined text-[20px]">download</span>
                Verileri Dışa Aktar (Yedekle)
              </button>
              <button onClick={() => importRef.current?.click()} className="btn-press flex items-center justify-center gap-2 w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 py-2.5 rounded-xl text-sm font-medium">
                <span className="material-symbols-outlined text-[20px]">upload</span>
                Yedekten Geri Yükle (İçe Aktar)
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-rose-400 mb-3">Tehlikeli İşlemler</p>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
              <p className="text-xs text-rose-300/70 mb-4 font-semibold">
                DİKKAT: Bu işlem sistemdeki tüm verileri kalıcı olarak siler ve demo veriye döndürür.
              </p>
              <button onClick={clearData} className="btn-press flex items-center justify-center gap-2 w-full bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-main transition-colors py-2.5 rounded-xl text-sm font-bold">
                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                Tüm Verileri Sıfırla
              </button>
            </div>
          </div>
        </div>
        
        {/* WhatsApp Entegrasyonu */}
        <div className="glass-panel p-6 rounded-2xl space-y-6 md:col-span-2">
          <div className="flex items-center gap-3 border-b border-divider-light pb-4">
            <span className="material-symbols-outlined text-green-400">forum</span>
            <h2 className="text-lg font-semibold text-main">WhatsApp Bildirim Ayarları (CallMeBot)</h2>
          </div>
          <div className="bg-overlay border border-divider rounded-xl p-5 space-y-4">
            <p className="text-sm text-muted-light">Sipariş teslimatlarında ve hatırlatıcılarda otomatik WhatsApp mesajı göndermek için CallMeBot API bilgilerini girin.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Telefon Numarası (Ülke kodu ile, örn: +905xxxxxxxxx)</label>
                <input value={waPhone} onChange={e => setWaPhone(e.target.value)} className="w-full bg-overlay border border-divider rounded-xl px-4 py-2 text-sm text-main focus:outline-none focus:border-green-500/50" placeholder="+905..." />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">API Key</label>
                <input value={waApiKey} onChange={e => setWaApiKey(e.target.value)} className="w-full bg-overlay border border-divider rounded-xl px-4 py-2 text-sm text-main focus:outline-none focus:border-green-500/50" placeholder="CallMeBot'tan alınan key" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleSaveWhatsapp} className="btn-press bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">save</span>
                WhatsApp Ayarlarını Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
