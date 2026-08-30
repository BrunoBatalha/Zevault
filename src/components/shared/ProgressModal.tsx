import { Share2 } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  progress: number;
  title: string;
  message?: string;
}

export const ProgressModal = ({ isOpen, progress, title, message }: ProgressModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-all p-4">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white mb-6">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
            <Share2 className="w-5 h-5" />
          </div>
          {title}
        </div>

        <div className="space-y-6">
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden border border-slate-200/50 dark:border-slate-600/50">
            <div 
              className="bg-emerald-600 h-full transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
              {Math.round(progress)}%
            </div>
            {message && (
              <p className="text-slate-500 dark:text-slate-400 text-center font-medium">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          {progress >= 100 ? (
            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Processamento concluído
            </div>
          ) : (
            <div className="text-sm text-slate-400 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
              </div>
              Organizando seus dados...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
