import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  return (
    <aside
      aria-label="Notification"
      className="fixed bottom-20 md:bottom-6 right-4 z-50 flex items-center gap-2.5 rounded-xl bg-zinc-900/95 border border-zinc-700/80 px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-2xl backdrop-blur-md animate-fade-in transition-all"
    >
      {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
      {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />}
      {(!toast.type || toast.type === 'info') && <Info className="h-4 w-4 text-blue-400 shrink-0" />}
      <span>{toast.message}</span>
    </aside>
  );
};
