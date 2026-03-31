import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { formatDate } from '../utils/helpers';
import type { CalendarEvent } from '../types';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const emptyEvent: Omit<CalendarEvent, 'id'> = {
  title: '', date: new Date().toISOString().split('T')[0], type: 'teslimat', completed: false, description: '',
};

export default function DeliveryCalendarPage() {
  const { calendarEvents, customOrders, addCalendarEvent, updateCalendarEvent } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [form, setForm] = useState(emptyEvent);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Pazartesi 0 olacak şekilde
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  // Sipariş teslim tarihlerini de takvime dahil edelim
  const orderEvents: CalendarEvent[] = customOrders.filter(o => o.deliveryDate).map(o => ({
    id: `order-${o.id}`,
    title: `${o.customerName} - ${o.carBrand}`,
    date: o.deliveryDate!,
    type: 'teslimat',
    completed: o.status === 'teslim_edildi',
    description: `${o.productType} / ${o.fabricType} / ${o.status}`,
    relatedOrderId: o.id
  }));

  const allEvents = [...calendarEvents, ...orderEvents];

  function handleSave() {
    if (!form.title) { setToast({ msg: 'Başlık zorunludur', type: 'error' }); return; }
    addCalendarEvent(form);
    setToast({ msg: 'Etkinlik eklendi', type: 'success' });
    setShowModal(false);
    setForm(emptyEvent);
  }

  function handleToggle(id: string, current: boolean) {
    if (id.startsWith('order-')) {
      setToast({ msg: 'Sipariş durumunu "Özel Siparişler" sayfasından değiştirmelisiniz.', type: 'info' });
      return;
    }
    updateCalendarEvent(id, { completed: !current });
  }

  const getTypeStyle = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'teslimat': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'uretim': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'siparis': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-muted border-slate-500/30';
    }
  };

  return (
    <div className="animate-page-enter space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Teslimat & Üretim Takvimi</h1>
          <p className="text-muted text-sm mt-1">Sipariş, üretim ve kargo takibi</p>
        </div>
        <button onClick={() => { setForm(emptyEvent); setShowModal(true); }} className="btn-press flex items-center gap-2 bg-primary hover:bg-primary-hover text-main px-4 py-2.5 rounded-xl font-medium text-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Etkinlik Ekle
        </button>
      </div>

      <div className="glass-panel -mx-4 sm:mx-0 rounded-none sm:rounded-2xl border-l-0 border-r-0 sm:border-l sm:border-r p-4 sm:p-5 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-main">{monthNames[month]} {year}</h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-overlay rounded-lg text-muted-light">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 bg-overlay hover:bg-overlay-hover rounded-lg text-sm text-muted-light font-medium">Bugün</button>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-overlay rounded-lg text-muted-light">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4"><div className="min-w-[600px]"><div className="grid grid-cols-7 gap-1 text-center mb-2">
            {dayNames.map(d => <div key={d} className="text-xs font-semibold text-muted-dark">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="p-2" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const dayEvents = allEvents.filter(e => e.date === dateStr);
              
              return (
                <div key={day} onClick={() => setSelectedDate(dateStr)} className={`min-h-[80px] p-1.5 border border-divider-light rounded-xl cursor-pointer hover:border-white/30 transition-colors ${isToday ? 'bg-primary/10 border-primary/30' : 'bg-white/[0.02]'}`}>
                  <div className={`text-right text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-muted'}`}>{day}</div>
                  <div className="space-y-1">
                    {dayEvents.map(e => (
                      <div key={e.id} title={e.description || e.title}
                        className={`text-[10px] p-1 rounded truncate border ${e.completed ? 'opacity-50 line-through' : ''} ${getTypeStyle(e.type)} cursor-default`}>
                        {e.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div></div>
        </div>

        <div className="md:w-80 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-divider pt-4 md:pt-0 md:pl-4">
          <h3 className="text-main font-semibold">Yaklaşan Tarihler</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {allEvents
              .filter(e => e.date >= new Date().toISOString().split('T')[0] && !e.completed)
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 8)
              .map(e => (
                <div key={e.id} className="bg-overlay border border-divider-light rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <button onClick={() => handleToggle(e.id, e.completed)} className={`mt-0.5 rounded-full flex items-center justify-center transition-colors ${e.completed ? 'text-emerald-400' : 'text-muted-dark hover:text-main'}`}>
                      <span className="material-symbols-outlined text-[20px]">{e.completed ? 'check_circle' : 'radio_button_unchecked'}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${e.completed ? 'text-muted-dark line-through' : 'text-main'}`}>{e.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 border rounded-md ${getTypeStyle(e.type)}`}>{e.type.toUpperCase()}</span>
                        <span className="text-xs text-muted">{formatDate(e.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            {allEvents.filter(e => e.date >= new Date().toISOString().split('T')[0] && !e.completed).length === 0 && (
              <p className="text-muted-dark text-sm text-center py-4">Yaklaşan kayıt yok</p>
            )}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Yeni Etkinlik"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main">İptal</button>
            <button onClick={handleSave} className="btn-press px-5 py-2 bg-primary hover:bg-primary-hover text-main text-sm font-medium rounded-xl">Kaydet</button>
          </>
        }
      >
        <div className="p-1 flex flex-col gap-4">
          <div>
            <label className="text-xs text-muted mb-1 block">Başlık *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-main focus:outline-none focus:border-primary/50 w-full" placeholder="Örn: X Firması Kumaş Teslimatı" />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Tarih</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-main focus:outline-none focus:border-primary/50 w-full" />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Tür</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CalendarEvent['type'] }))} className="bg-surface border border-divider rounded-xl px-3 py-2.5 text-sm text-main focus:outline-none focus:border-primary/50 w-full">
              <option value="teslimat">Teslimat (Kargo, Müşteri)</option>
              <option value="uretim">Üretim Başlangıç/Bitiş</option>
              <option value="siparis">Hammadde Siparişi</option>
              <option value="diger">Diğer</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Açıklama (Opsiyonel)</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="bg-overlay border border-divider rounded-xl px-3 py-2 text-sm text-main focus:outline-none focus:border-primary/50 w-full resize-none" />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={!!selectedDate} 
        onClose={() => setSelectedDate(null)}
        title={
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_today</span>
              {selectedDate && formatDate(selectedDate)}
            </div>
            <p className="text-xs text-muted mt-1 font-normal">Günün Etkinlikleri ve Teslimatları</p>
          </div>
        }
        footer={
          <button onClick={() => { setForm({ ...emptyEvent, date: selectedDate! }); setSelectedDate(null); setShowModal(true); }} className="btn-press px-5 py-2 bg-overlay-hover hover:bg-white/20 text-main text-sm font-medium rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Bu Güne Ekle
          </button>
        }
      >
        <div className="p-1 space-y-3">
          {selectedDate && allEvents.filter(e => e.date === selectedDate).length === 0 && (
            <div className="py-8 text-center text-muted-dark text-sm">Bu güne ait kayıt bulunmamaktadır.</div>
          )}
          {selectedDate && allEvents.filter(e => e.date === selectedDate).map(e => (
            <div key={e.id} className="bg-overlay border border-divider rounded-xl p-4 flex items-start gap-4">
              <button onClick={() => handleToggle(e.id, e.completed)} className={`mt-0.5 min-w-[24px] rounded-full flex items-center justify-center transition-colors ${e.completed ? 'text-emerald-400' : 'text-muted-dark hover:text-main'}`}>
                <span className="material-symbols-outlined text-[24px]">{e.completed ? 'check_circle' : 'radio_button_unchecked'}</span>
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-base font-medium mb-1 ${e.completed ? 'text-muted-dark line-through' : 'text-main'}`}>{e.title}</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 border rounded-md font-medium uppercase ${getTypeStyle(e.type)}`}>{e.type}</span>
                </div>
                {e.description && (
                  <p className="text-sm text-muted leading-relaxed bg-black/20 p-2 rounded-lg">{e.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
