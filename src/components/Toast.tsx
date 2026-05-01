import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    error: 'bg-red-500/20 border-red-500/40 text-red-300',
    info: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  };
  const icons = { success: 'check_circle', error: 'error', info: 'info' };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] animate-slide-in flex items-center gap-3 px-4 py-3 rounded-xl border ${colors[type]} backdrop-blur-lg shadow-2xl`}>
      <span className="material-symbols-outlined text-[20px]">{icons[type]}</span>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}
