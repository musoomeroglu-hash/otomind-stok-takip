import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { CariAccount, CariTransaction } from '../types';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const emptyAccount: Omit<CariAccount, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '', type: 'musteri', phone: '', email: '', address: '', notes: '', taxNumber: '',
  balance: 0, totalDebit: 0, totalCredit: 0
};

const emptyTransaction: Omit<CariTransaction, 'id' | 'createdAt'> = {
  accountId: '', type: 'borc', amount: 0, description: '', date: new Date().toISOString().split('T')[0]
};

export default function AccountsPage() {
  const { accounts, cariTransactions, addAccount, updateAccount, deleteAccount, addCariTransaction, deleteCariTransaction, addCashEntry, firmaBilgileri } = useData();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => (localStorage.getItem('cari_view_mode') as 'card' | 'list') || 'card');
  
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editAccount, setEditAccount] = useState<CariAccount | null>(null);
  const [accountForm, setAccountForm] = useState(emptyAccount);
  
  const [selectedAccountForTx, setSelectedAccountForTx] = useState<CariAccount | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txForm, setTxForm] = useState(emptyTransaction);
  
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const filteredAccounts = accounts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || (a.phone && a.phone.includes(q));
    const matchType = !filterType || a.type === filterType;
    return matchSearch && matchType;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  function openAddAccount() {
    setAccountForm(emptyAccount);
    setEditAccount(null);
    setShowAccountModal(true);
  }

  function openEditAccount(a: CariAccount) {
    setAccountForm({ ...a });
    setEditAccount(a);
    setShowAccountModal(true);
  }

  function handleSaveAccount() {
    if (!accountForm.name) {
      setToast({ msg: 'Cari adı zorunludur', type: 'error' });
      return;
    }
    if (editAccount) {
      updateAccount(editAccount.id, accountForm);
      setToast({ msg: 'Cari güncellendi', type: 'success' });
    } else {
      addAccount(accountForm);
      setToast({ msg: 'Cari eklendi', type: 'success' });
    }
    setShowAccountModal(false);
  }

  function handleDeleteAccount(id: string) {
    if (window.confirm("Bu cariyi silmek istediğinize emin misiniz? (Tüm işlemleri kalacaktır)")) {
      deleteAccount(id);
      setToast({ msg: 'Cari silindi', type: 'success' });
      setSelectedAccountForTx(null);
    }
  }

  function openAddTransaction(a: CariAccount) {
    setTxForm({ ...emptyTransaction, accountId: a.id });
    setShowTxModal(true);
  }

  function handleSaveTransaction() {
    if (!txForm.amount || txForm.amount <= 0 || !txForm.description) {
      setToast({ msg: 'Geçerli tutar ve açıklama giriniz', type: 'error' });
      return;
    }
    
    addCariTransaction(txForm);
    
    const account = accounts.find(a => a.id === txForm.accountId);
    if (account) {
      // Bakiye hesaplama:
      // borc = birinin bize borcu var → balance azalır (negatif yöne, alacağımız artar)
      // alacak = biz birine borçluyuz → balance artar (pozitif yöne, borcumuz artar)
      // tahsilat = bize ödeme yapıldı → balance artar (borç kapanır, alacak azalır)
      // odeme = biz ödedik → balance azalır (borcumuz kapanır)
      
      let balanceChange = 0;
      let debitChange = 0;
      let creditChange = 0;

      switch (txForm.type) {
        case 'borc':
          // Birinin bize borcu var - bakiye negatife gider (alacağımız artar)
          balanceChange = -txForm.amount;
          debitChange = txForm.amount;
          break;
        case 'alacak':
          // Biz birine borçluyuz - bakiye pozitife gider (borcumuz artar)
          balanceChange = txForm.amount;
          creditChange = txForm.amount;
          break;
        case 'tahsilat':
          // Bize ödeme yapıldı - bakiye pozitife gider (alacağımız azalır/kapanır)
          balanceChange = txForm.amount;
          debitChange = 0;
          // Kasaya GELİR olarak yansıt
          addCashEntry({
            type: 'giris',
            category: 'diger',
            description: `Cari Tahsilat: ${account.name} - ${txForm.description}`,
            amount: txForm.amount,
            paymentMethod: 'nakit',
            date: txForm.date,
          });
          break;
        case 'odeme':
          // Biz ödeme yaptık - bakiye negatife gider (borcumuz azalır/kapanır)
          balanceChange = -txForm.amount;
          creditChange = 0;
          // Kasaya GİDER olarak yansıt
          addCashEntry({
            type: 'cikis',
            category: 'diger',
            description: `Cari Ödeme: ${account.name} - ${txForm.description}`,
            amount: txForm.amount,
            paymentMethod: 'nakit',
            date: txForm.date,
          });
          break;
      }

      updateAccount(account.id, {
        totalDebit: account.totalDebit + debitChange,
        totalCredit: account.totalCredit + creditChange,
        balance: account.balance + balanceChange
      });
    }

    setToast({ msg: 'İşlem eklendi', type: 'success' });
    setShowTxModal(false);
    
    // Update local state for ekstre
    if (selectedAccountForTx) {
      const balChange = txForm.type === 'borc' ? -txForm.amount 
        : txForm.type === 'alacak' ? txForm.amount 
        : txForm.type === 'tahsilat' ? txForm.amount 
        : -txForm.amount;
      setSelectedAccountForTx({
        ...selectedAccountForTx,
        balance: selectedAccountForTx.balance + balChange
      });
    }
  }
  
  function getAccountTransactions(accountId: string) {
    return cariTransactions.filter(t => t.accountId === accountId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  function handlePrintAccount(account: CariAccount) {
    const txs = getAccountTransactions(account.id);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const f = firmaBilgileri || {};
    const firmaHtml = `
      <div style="text-align: left; margin-bottom: 20px; font-size: 14px;">
        <strong style="font-size: 18px;">${f.firmaAdi || 'BİZİM FİRMA'}</strong><br/>
        ${f.adres ? f.adres + '<br/>' : ''}
        ${f.telefon ? 'Tel: ' + f.telefon + '<br/>' : ''}
        ${f.email ? 'E-posta: ' + f.email + '<br/>' : ''}
        ${f.vergiDairesi ? 'VD: ' + f.vergiDairesi : ''} ${f.vergiNo ? 'VN: ' + f.vergiNo : ''}
      </div>
    `;

    const karsiTarafHtml = `
      <div style="text-align: right; margin-bottom: 20px; font-size: 14px;">
        <strong style="font-size: 18px;">Sayın / Firma:</strong> <span style="font-size: 18px;">${account.name}</span><br/>
        ${account.phone ? 'Tel: ' + account.phone + '<br/>' : ''}
        ${account.address ? account.address + '<br/>' : ''}
        ${account.taxNumber ? 'Vergi No / TCKN: ' + account.taxNumber + '<br/>' : ''}
      </div>
    `;

    const txsHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left;" border="1">
        <thead>
          <tr>
            <th style="padding: 10px; background: #f5f5f5;">Tarih</th>
            <th style="padding: 10px; background: #f5f5f5;">Açıklama</th>
            <th style="padding: 10px; background: #f5f5f5;">İşlem Tipi</th>
            <th style="padding: 10px; background: #f5f5f5; text-align: right;">Tutar</th>
          </tr>
        </thead>
        <tbody>
          ${txs.length === 0 ? '<tr><td colspan="4" style="text-align: center; padding: 10px;">İşlem bulunamadı</td></tr>' : ''}
          ${txs.slice().reverse().map(tx => `
            <tr>
              <td style="padding: 10px;">${new Date(tx.date).toLocaleDateString('tr-TR')}</td>
              <td style="padding: 10px;">${tx.description}</td>
              <td style="padding: 10px;">${getTxTypeLabel(tx.type)}</td>
              <td style="padding: 10px; text-align: right;">${formatCurrency(tx.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    let bakiyeMesaji = 'Hesabınızda bakiye bulunmamaktadır.';
    if (account.balance < 0) {
      bakiyeMesaji = `${account.name} — ${formatCurrency(Math.abs(account.balance))} borcunuz bulunmaktadır.`;
    } else if (account.balance > 0) {
      bakiyeMesaji = `${account.name} — ${formatCurrency(account.balance)} alacağınız bulunmaktadır.`;
    }

    const html = `
      <html>
        <head>
          <title>${account.name} - Cari Bakiye Ekstresi</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
            .title { font-size: 24px; font-weight: bold; margin: 0 0 10px 0; text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            .date { color: #666; font-size: 14px; text-align: right; margin-top: -10px; margin-bottom: 30px; }
            .balance-box { font-size: 20px; font-weight: bold; color: #000; padding: 20px; border: 2px dashed #999; border-radius: 12px; text-align: center; margin: 20px 0; background-color: #fcfcfc; }
            .footer { text-align: center; font-size: 12px; color: #999; margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              body { -webkit-print-color-adjust: exact; padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1 class="title">Bakiye Ekstresi</h1>
          <div class="date">Tarih: ${new Date().toLocaleDateString('tr-TR')} Saat: ${new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</div>
          <div class="header">
            ${firmaHtml}
            ${karsiTarafHtml}
          </div>
          
          <div class="balance-box">
            ${bakiyeMesaji}
          </div>

          <h3 style="margin-top: 30px;">Cari Hareket Tablosu</h3>
          ${txsHtml}

          <div class="footer">
            Bu belge ${f.firmaAdi || 'sistem'} tarafından oluşturulmuştur.
          </div>
          <script>
            window.onload = function() { setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 500); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  // balance < 0 → alacağımız var (birinin bize borcu var)
  // balance > 0 → borçluyuz (biz birine borçluyuz)
  const totalReceivables = accounts.reduce((acc, a) =>  a.balance < 0 ? acc + Math.abs(a.balance) : acc, 0); 
  const totalPayables = accounts.reduce((acc, a) => a.balance > 0 ? acc + a.balance : acc, 0); 

  function getBalanceLabel(balance: number): { color: string; label: string } {
    if (balance < 0) return { color: 'text-emerald-400', label: `${formatCurrency(Math.abs(balance))} Alacağımız Var` };
    if (balance > 0) return { color: 'text-rose-400', label: `${formatCurrency(balance)} Borçluyuz` };
    return { color: 'text-muted', label: formatCurrency(0) };
  }

  function getTxTypeLabel(type: CariTransaction['type']): string {
    switch (type) {
      case 'borc': return 'Borç Girişi';
      case 'alacak': return 'Alacak Girişi';
      case 'tahsilat': return 'Tahsilat';
      case 'odeme': return 'Ödeme';
      default: return type;
    }
  }

  function getTxTypeColor(type: CariTransaction['type']): string {
    switch (type) {
      case 'borc': return 'text-amber-400';
      case 'alacak': return 'text-orange-400';
      case 'tahsilat': return 'text-emerald-400';
      case 'odeme': return 'text-rose-400';
      default: return 'text-muted';
    }
  }

  return (
    <div className="animate-page-enter space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Cari Hesaplar</h1>
          <p className="text-muted text-sm mt-1">{accounts.length} cari kayıtlı</p>
        </div>
        <button onClick={openAddAccount} className="btn-press flex items-center gap-2 bg-primary hover:bg-primary-hover text-main px-4 py-2.5 rounded-xl font-medium text-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Yeni Cari Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">call_received</span>
          </div>
          <div>
            <p className="text-muted text-xs">Toplam Alacağımız</p>
            <p className="text-main font-bold">{formatCurrency(totalReceivables)}</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-rose-400 text-[20px]">call_made</span>
          </div>
          <div>
            <p className="text-muted text-xs">Toplam Borcumuz</p>
            <p className="text-main font-bold">{formatCurrency(totalPayables)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark text-[18px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari ara..."
            className="w-full bg-overlay border border-divider rounded-xl pl-9 pr-4 py-2.5 text-sm text-main placeholder-slate-500 focus:outline-none focus:border-primary/50" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-overlay border border-divider rounded-xl px-3 py-2.5 text-sm text-muted-light focus:outline-none">
          <option value="">Tüm Tipler</option>
          <option value="musteri">Müşteri</option>
          <option value="tedarikci">Tedarikçi</option>
          <option value="diger">Diğer</option>
        </select>
        
        <div className="flex bg-overlay border border-divider rounded-xl p-1">
          <button 
            onClick={() => { setViewMode('card'); localStorage.setItem('cari_view_mode', 'card'); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${viewMode === 'card' ? 'bg-primary text-main' : 'text-muted-light hover:text-main'}`}
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span> Kart
          </button>
          <button 
            onClick={() => { setViewMode('list'); localStorage.setItem('cari_view_mode', 'list'); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${viewMode === 'list' ? 'bg-primary text-main' : 'text-muted-light hover:text-main'}`}
          >
            <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span> Liste
          </button>
        </div>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAccounts.map(account => {
            const { color: bColor, label: bLabel } = getBalanceLabel(account.balance);
            return (
              <div key={account.id} onClick={() => setSelectedAccountForTx(account)} className="glass-panel card-hover p-4 rounded-xl cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-main font-medium">{account.name}</h3>
                    <p className="text-xs text-muted-dark uppercase">{account.type}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handlePrintAccount(account); }} className="text-muted-dark hover:text-blue-400" title="Yazdır"><span className="material-symbols-outlined text-[16px]">print</span></button>
                    <button onClick={(e) => { e.stopPropagation(); openEditAccount(account); }} className="text-muted-dark hover:text-main" title="Düzenle"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id); }} className="text-muted-dark hover:text-red-400" title="Sil"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-divider-light flex flex-col gap-1">
                  <p className={`text-lg font-bold ${bColor}`}>{bLabel}</p>
                  {account.taxNumber && <p className="text-xs text-muted-light">VN: {account.taxNumber}</p>}
                  <p className="text-[10px] text-muted-dark mt-1">Son İşlem: {formatDate(account.updatedAt)}</p>
                </div>
              </div>
            );
          })}
          {filteredAccounts.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-dark">Kayıtlı cari bulunamadı</div>
          )}
        </div>
      ) : (
        <div className="glass-panel -mx-4 sm:mx-0 rounded-none sm:rounded-2xl border-l-0 border-r-0 sm:border-l sm:border-r overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider-light">
                  <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">CARİ ADI</th>
                  <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">TİPİ</th>
                  <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">TELEFON</th>
                  <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">VERGİ NO</th>
                  <th className="text-left text-xs text-muted-dark font-medium px-4 py-3">BAKİYE</th>
                  <th className="text-right text-xs text-muted-dark font-medium px-4 py-3">İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(account => {
                  const { color: bColor, label: bLabel } = getBalanceLabel(account.balance);
                  return (
                    <tr key={account.id} onClick={() => setSelectedAccountForTx(account)} className="border-b border-white/[0.04] hover:bg-overlay-border-light cursor-pointer">
                      <td className="px-4 py-3 font-medium text-main">{account.name}</td>
                      <td className="px-4 py-3"><span className="bg-overlay px-2 py-1 rounded text-xs text-muted-light uppercase">{account.type}</span></td>
                      <td className="px-4 py-3 text-sm text-muted-light">{account.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted-light">{account.taxNumber || '-'}</td>
                      <td className={`px-4 py-3 text-sm font-bold ${bColor}`}>{bLabel}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); handlePrintAccount(account); }} className="p-1.5 hover:bg-blue-500/20 rounded-lg text-muted hover:text-blue-400" title="Yazdır"><span className="material-symbols-outlined text-[16px]">print</span></button>
                        <button onClick={(e) => { e.stopPropagation(); openEditAccount(account); }} className="p-1.5 hover:bg-white/10 rounded-lg text-muted hover:text-main" title="Düzenle"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id); }} className="p-1.5 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-400" title="Sil"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                      </td>
                    </tr>
                  )
                })}
                {filteredAccounts.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-dark">Kayıtlı cari bulunamadı</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal 
        isOpen={showAccountModal} 
        onClose={() => setShowAccountModal(false)}
        title={editAccount ? 'Cari Düzenle' : 'Yeni Cari'}
        footer={
          <>
            <button onClick={() => setShowAccountModal(false)} className="px-4 py-2 text-sm text-muted hover:text-main">İptal</button>
            <button onClick={handleSaveAccount} className="btn-press px-5 py-2 bg-primary hover:bg-primary-hover text-main text-sm font-medium rounded-xl">Kaydet</button>
          </>
        }
      >
        {/* Cari Profili */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-[18px]">person</span>
            <h3 className="text-main text-sm font-medium">Cari Profili</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Cari Adı / Ünvanı *</label>
              <input value={accountForm.name} onChange={e => setAccountForm(f => ({ ...f, name: e.target.value }))} className="input-field w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Tipi *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-main cursor-pointer select-none">
                  <input type="radio" value="musteri" checked={accountForm.type === 'musteri'} onChange={() => setAccountForm(f => ({ ...f, type: 'musteri' }))} className="accent-[#E97226] w-4 h-4" /> Müşteri
                </label>
                <label className="flex items-center gap-2 text-sm text-main cursor-pointer select-none">
                  <input type="radio" value="tedarikci" checked={accountForm.type === 'tedarikci'} onChange={() => setAccountForm(f => ({ ...f, type: 'tedarikci' }))} className="accent-[#E97226] w-4 h-4" /> Tedarikçi
                </label>
                <label className="flex items-center gap-2 text-sm text-main cursor-pointer select-none">
                  <input type="radio" value="diger" checked={accountForm.type === 'diger'} onChange={() => setAccountForm(f => ({ ...f, type: 'diger' }))} className="accent-[#E97226] w-4 h-4" /> Diğer
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* İletişim Bilgileri */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-blue-400 text-[18px]">contact_phone</span>
            <h3 className="text-main text-sm font-medium">İletişim Bilgileri</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Telefon</label>
              <input value={accountForm.phone || ''} onChange={e => setAccountForm(f => ({ ...f, phone: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">E-posta</label>
              <input value={accountForm.email || ''} onChange={e => setAccountForm(f => ({ ...f, email: e.target.value }))} className="input-field w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Vergi / TC Kimlik No</label>
              <input maxLength={11} value={accountForm.taxNumber || ''} onChange={e => setAccountForm(f => ({ ...f, taxNumber: e.target.value.replace(/[^0-9]/g, '') }))} className="input-field w-full" placeholder="Sadece rakam..." />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Adres</label>
              <textarea rows={2} value={accountForm.address || ''} onChange={e => setAccountForm(f => ({ ...f, address: e.target.value }))} className="input-field w-full resize-none" />
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
              <textarea rows={2} value={accountForm.notes || ''} onChange={e => setAccountForm(f => ({ ...f, notes: e.target.value }))} className="input-field w-full resize-none" placeholder="Cari ile ilgili notlarınız..." />
            </div>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={!!selectedAccountForTx} 
        onClose={() => setSelectedAccountForTx(null)}
        title={selectedAccountForTx?.name}
        footer={
          <div className="text-right">
            <p className="text-xs text-muted">Güncel Cari Bakiye</p>
            {selectedAccountForTx && (() => {
              const { color, label } = getBalanceLabel(selectedAccountForTx.balance);
              return <p className={`text-xl font-bold ${color}`}>{label}</p>;
            })()}
          </div>
        }
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-muted uppercase">{selectedAccountForTx?.type} EKSTRESİ</p>
          <button onClick={() => selectedAccountForTx && openAddTransaction(selectedAccountForTx)} className="flex items-center gap-1 bg-overlay-hover hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm text-main">
            <span className="material-symbols-outlined text-[18px]">add</span> Manuel İşlem
          </button>
        </div>
        
        <div className="overflow-x-auto scrollbar-thin min-h-[300px]">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-divider">
                <th className="text-left text-xs text-muted pb-2 px-2">TARİH</th>
                <th className="text-left text-xs text-muted pb-2 px-2">İŞLEM/AÇIKLAMA</th>
                <th className="text-left text-xs text-muted pb-2 px-2">TİP</th>
                <th className="text-right text-xs text-muted pb-2 px-2">TUTAR</th>
                <th className="text-right text-xs text-muted pb-2 px-2">İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {selectedAccountForTx && getAccountTransactions(selectedAccountForTx.id).map(tx => (
                  <tr key={tx.id} className="border-b border-divider-light hover:bg-overlay-border-light">
                    <td className="py-3 px-2 text-sm text-muted-light">{formatDate(tx.date)}</td>
                    <td className="py-3 px-2 text-sm text-main">
                      <span className="font-medium">{tx.description}</span>
                      {tx.relatedType && <span className="ml-2 text-[10px] bg-overlay px-1.5 py-0.5 rounded text-muted uppercase">{tx.relatedType}</span>}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                        tx.type === 'tahsilat' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        tx.type === 'odeme' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        tx.type === 'borc' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      }`}>
                        {getTxTypeLabel(tx.type)}
                      </span>
                    </td>
                    <td className={`py-3 px-2 text-sm text-right font-medium ${getTxTypeColor(tx.type)}`}>
                      {(tx.type === 'tahsilat' || tx.type === 'odeme') ? '💰 ' : ''}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button onClick={() => {
                        if(window.confirm('İşlemi silmek istediğinize emin misiniz? Bakiye otomatik güncellenecektir.')) {
                          deleteCariTransaction(tx.id);
                          // Bakiye geri alma
                          let reverseBalance = 0;
                          if (tx.type === 'borc') reverseBalance = tx.amount;
                          else if (tx.type === 'alacak') reverseBalance = -tx.amount;
                          else if (tx.type === 'tahsilat') reverseBalance = -tx.amount;
                          else if (tx.type === 'odeme') reverseBalance = tx.amount;

                          selectedAccountForTx && updateAccount(selectedAccountForTx.id, {
                            totalDebit: selectedAccountForTx.totalDebit - (tx.type === 'borc' ? tx.amount : 0),
                            totalCredit: selectedAccountForTx.totalCredit - (tx.type === 'alacak' ? tx.amount : 0),
                            balance: selectedAccountForTx.balance + reverseBalance
                          });
                          selectedAccountForTx && setSelectedAccountForTx({
                              ...selectedAccountForTx,
                              balance: selectedAccountForTx.balance + reverseBalance
                          });
                        }
                      }} className="text-muted-dark hover:text-red-400 p-1"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                    </td>
                  </tr>
              ))}
              {selectedAccountForTx && getAccountTransactions(selectedAccountForTx.id).length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-dark text-sm">Hiç işlem bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal 
        isOpen={showTxModal} 
        onClose={() => setShowTxModal(false)}
        title="Manuel İşlem Ekle"
        size="small"
        footer={
          <>
            <button onClick={() => setShowTxModal(false)} className="flex-1 px-4 py-2 text-sm text-muted bg-overlay rounded-xl hover:bg-overlay-hover transition-colors">İptal</button>
            <button onClick={handleSaveTransaction} className="flex-1 px-4 py-2 text-sm text-main bg-primary hover:bg-primary-hover rounded-xl font-medium btn-press transition-colors">Ekle</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted mb-2 block">İşlem Tipi</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTxForm({...txForm, type: 'borc'})} 
                className={`py-2.5 text-xs rounded-lg border transition-all text-center ${txForm.type === 'borc' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 font-medium' : 'border-divider text-muted hover:bg-overlay'}`}>
                <span className="material-symbols-outlined text-[16px] block mx-auto mb-1">receipt_long</span>
                Borç Gir
              </button>
              <button onClick={() => setTxForm({...txForm, type: 'alacak'})} 
                className={`py-2.5 text-xs rounded-lg border transition-all text-center ${txForm.type === 'alacak' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400 font-medium' : 'border-divider text-muted hover:bg-overlay'}`}>
                <span className="material-symbols-outlined text-[16px] block mx-auto mb-1">request_quote</span>
                Alacak Gir
              </button>
              <button onClick={() => setTxForm({...txForm, type: 'tahsilat'})} 
                className={`py-2.5 text-xs rounded-lg border transition-all text-center ${txForm.type === 'tahsilat' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 font-medium' : 'border-divider text-muted hover:bg-overlay'}`}>
                <span className="material-symbols-outlined text-[16px] block mx-auto mb-1">savings</span>
                Tahsilat Al
                <span className="block text-[9px] mt-0.5 opacity-70">→ Kasaya Gelir</span>
              </button>
              <button onClick={() => setTxForm({...txForm, type: 'odeme'})} 
                className={`py-2.5 text-xs rounded-lg border transition-all text-center ${txForm.type === 'odeme' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 font-medium' : 'border-divider text-muted hover:bg-overlay'}`}>
                <span className="material-symbols-outlined text-[16px] block mx-auto mb-1">payments</span>
                Ödeme Yap
                <span className="block text-[9px] mt-0.5 opacity-70">→ Kasaya Gider</span>
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Tutar (₺)</label>
            <input type="number" min="0.01" step="0.01" value={txForm.amount || ''} onChange={e => setTxForm({...txForm, amount: Number(e.target.value)})} className="input-field w-full text-lg font-medium" />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Açıklama</label>
            <input value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} className="input-field w-full" placeholder="Örn: Nakit tahsilat" />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Tarih</label>
            <input type="date" value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} className="input-field w-full" />
          </div>
          
          {/* Kasaya yansıma bilgisi */}
          {(txForm.type === 'tahsilat' || txForm.type === 'odeme') && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${txForm.type === 'tahsilat' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>Bu işlem <strong>Kasa</strong>'ya {txForm.type === 'tahsilat' ? 'gelir' : 'gider'} olarak yansıtılacaktır.</span>
            </div>
          )}
          {(txForm.type === 'borc' || txForm.type === 'alacak') && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>Bu işlem sadece cari bakiyeyi günceller, kasaya yansımaz.</span>
            </div>
          )}
        </div>
      </Modal>

      <style>{`.input-field { background: var(--color-overlay); border: 1px solid var(--color-border-divider); border-radius: 0.75rem; padding: 0.625rem 0.75rem; color: inherit; font-size: 0.875rem; outline: none; } .input-field:focus { border-color: rgba(233,114,38,0.5); }`}</style>
    </div>
  );
}
