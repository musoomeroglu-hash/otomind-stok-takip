import { useState } from 'react';

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'otomind' && password === '4003') {
      if (remember) {
        localStorage.setItem('otomind_auth', 'true');
      } else {
        sessionStorage.setItem('otomind_auth', 'true');
      }
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm bg-surface border border-divider rounded-3xl p-8 relative z-10 shadow-2xl flex flex-col animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-main text-3xl">directions_car</span>
          </div>
          <h1 className="text-2xl font-bold text-main tracking-wide">OTOMIND</h1>
          <p className="text-sm text-muted mt-1 text-center">Stok ve Üretim Takip</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">Kullanıcı Adı</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark text-[20px]">person</span>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(false); }}
                className="w-full bg-overlay border border-divider rounded-xl pl-10 pr-4 py-3 text-sm text-main placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Kullanıcı adınız..."
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">Şifre</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark text-[20px]">lock</span>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                className="w-full bg-overlay border border-divider rounded-xl pl-10 pr-4 py-3 text-sm text-main placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> Hatalı bilgi girdiniz.</p>}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setRemember(!remember)}
              className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${remember ? 'bg-primary border-primary' : 'bg-overlay border-divider'}`}
            >
              {remember && <span className="material-symbols-outlined text-[14px] text-main font-bold">check</span>}
            </button>
            <span className="text-sm text-muted-light select-none cursor-pointer" onClick={() => setRemember(!remember)}>Beni Hatırla</span>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-main font-medium py-3 rounded-xl transition-all btn-press shadow-lg shadow-primary/20 mt-4"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
