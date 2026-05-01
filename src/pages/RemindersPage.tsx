import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { formatDate } from '../utils/helpers';
import type { Reminder } from '../types';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

import { sendWhatsappMessage } from '../utils/helpers';

const empty: Omit<Reminder, 'id' | 'createdAt'> = {
  title: '', description: '', priority: 'orta', date: new Date().toISOString().split('T')[0], time: '', completed: false, sendWhatsapp: false
};

export default function RemindersPage() {
  const { reminders, addReminder, updateReminder, deleteReminder, whatsappConfig } = useData();
  const [filter, setFilter] = useState<'tumu' | 'aktif' | 'tamamlanan'>('aktif');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const filtered = reminders.filter(r => {
    if (filter === 'aktif') return !r.completed;
    if (filter === 'tamamlanan') return r.completed;
    return true;
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const priorityColors = {
    dusuk: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    orta: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    yuksek: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  };

  const priorityLabels = { dusuk: 'Düşük', orta: 'Orta', yuksek: 'Yüksek' };

  function handleSave() {
    if (!form.title) { setToast({ msg: 'Başlık zorunludur', type: 'error' }); return; }
    addReminder(form);
    setToast({ msg: 'Hatırlatıcı eklendi', type: 'success' });
    setShowModal(false);
    setForm(empty);
  }

  return (
    <div className="animate-page-enter space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Hatırlatıcılar</h1>
          <p className="text-muted text-sm mt-1">Stok, sipariş ve müşteri takibi için yapacaklarınız</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-press flex items-center gap-2 bg-primary hover:bg-primary-hover text-main px-4 py-2.5 rounded-xl font-medium text-sm">
          <span className="material-symbols-outlined text-[18px]">add_alert</span>
          Yeni Hatırlatıcı
        </button>
      </div>

      <div className="flex bg-overlay border border-divider rounded-xl p-1 w-max">
        {['tumu', 'aktif', 'tamamlanan'].map(mode => (
          <button
            key={mode}
            onClick={() => setFilter(mode as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === mode ? 'bg-surface text-main shadow-sm' : 'text-muted hover:text-main'}`}
          >
             {mode === 'tumu' ? 'Tümü' : mode === 'aktif' ? 'Aktif' : 'Tamamlanan'}
             <span className="ml-2 text-[10px] bg-overlay-hover px-1.5 py-0.5 rounded-md">
                {mode === 'aktif' ? reminders.filter(r => !r.completed).length : mode === 'tamamlanan' ? reminders.filter(r => r.completed).length : reminders.length}
             </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(r => (
          <div key={r.id} className={`glass-panel p-5 rounded-2xl transition-all ${r.completed ? 'opacity-60' : 'hover:border-divider'}`}>
            <div className="flex items-start gap-4">
              <button
                onClick={() => updateReminder(r.id, { completed: !r.completed })}
                className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${r.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 hover:border-primary'}`}
              >
                {r.completed && <span className="material-symbols-outlined text-main text-[16px]">check</span>}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`font-semibold text-lg truncate flex items-center gap-2 ${r.completed ? 'text-muted line-through' : 'text-main'}`}>
                    {r.title}
                    {r.sendWhatsapp && <span className="material-symbols-outlined text-green-400 text-[16px]" title="WhatsApp Bildirimi Aktif">forum</span>}
                  </h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${priorityColors[r.priority]}`}>{priorityLabels[r.priority]}</span>
                    <button onClick={() => deleteReminder(r.id)} className="p-1 hover:bg-overlay-hover rounded-lg text-muted-dark hover:text-red-400" title="Sil">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
                
                {r.description && <p className={`mt-2 text-sm line-clamp-2 ${r.completed ? 'text-muted-dark' : 'text-muted'}`}>{r.description}</p>}
                
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                    !r.completed && r.date < new Date().toISOString().split('T')[0] 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                      : 'bg-overlay text-muted'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    {formatDate(r.date)} {r.time && `- ${r.time}`}
                  </div>
                  
                  {r.sendWhatsapp && !r.completed && (
                    <button onClick={() => {
                      if (!whatsappConfig?.phone || !whatsappConfig?.apikey) {
                        setToast({ msg: 'WhatsApp ayarları eksik! Ayarlar sayfasını kontrol edin.', type: 'error' });
                        return;
                      }
                      const msg = `🔔 *HATIRLATICI*\n\n*${r.title}*\n${r.description ? r.description + '\n\n' : '\n'}Tarih: ${formatDate(r.date)} ${r.time || ''}`;
                      sendWhatsappMessage(whatsappConfig.phone, msg, whatsappConfig.apikey);
                      setToast({ msg: 'WhatsApp mesajı tetiklendi', type: 'success' });
                    }} className="flex items-center gap-1 bg-green-500/10 text-green-400 hover:bg-green-500/20 px-2.5 py-1.5 rounded-lg transition-colors border border-green-500/20">
                      <span className="material-symbols-outlined text-[14px]">send</span>
                      Şimdi Gönder
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-dark glass-panel rounded-2xl">
            Bu kategoride hatırlatıcı yok.
          </div>
        )}
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Yeni Hatırlatıcı"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main">İptal</button>
            <button onClick={handleSave} className="btn-press px-5 py-2 bg-primary hover:bg-primary-hover text-main text-sm font-medium rounded-xl">Kaydet</button>
          </>
        }
      >
        {/* Hatırlatıcı Hedefi */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-[18px]">notifications_active</span>
            <h3 className="text-main text-sm font-medium">Hatırlatıcı Hedefi</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Başlık *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-main focus:outline-none focus:border-primary/50 w-full" placeholder="Örn: X Müşterisini Ara" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Tarih</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-main focus:outline-none focus:border-primary/50 w-full" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Saat (Opsiyonel)</label>
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-main focus:outline-none focus:border-primary/50 w-full" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Öncelik</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Reminder['priority'] }))} className="bg-surface border border-divider rounded-xl px-3 py-2.5 text-sm text-main focus:outline-none focus:border-primary/50 w-full">
                <option value="dusuk">Düşük</option>
                <option value="orta">Orta</option>
                <option value="yuksek">Yüksek</option>
              </select>
            </div>
          </div>
        </div>

        {/* İçerik */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-purple-400 text-[18px]">message</span>
            <h3 className="text-main text-sm font-medium">İçerik</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Açıklama</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-main focus:outline-none focus:border-primary/50 w-full resize-none" />
            </div>
            
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer w-max">
                <input type="checkbox" checked={form.sendWhatsapp || false} onChange={e => setForm(f => ({ ...f, sendWhatsapp: e.target.checked }))} className="w-4 h-4 rounded border-white/20 bg-overlay text-green-500 focus:ring-green-500/50" />
                <span className="text-sm text-muted-light flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-green-400 text-[18px]">forum</span>
                  WhatsApp üzerinden bildirim gönder
                </span>
              </label>
              {form.sendWhatsapp && (!whatsappConfig?.phone || !whatsappConfig?.apikey) && (
                <p className="text-xs text-rose-400 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">warning</span> WhatsApp ayarları (Ayarlar sayfasında) eksik.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
