/**
 * Modal de Onboarding
 * Primeira execução para capturar nome do usuário
 */

import { Button } from '@/components/ui';
import { useI18n } from '@/core/i18n';
import { useState } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (name: string) => void;
}

export const OnboardingModal = ({ isOpen, onComplete }: OnboardingModalProps) => {
  const { t } = useI18n();
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-white text-3xl font-bold">F</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t('onboarding.welcome')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">{t('onboarding.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('onboarding.nameLabel')}
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={t('onboarding.namePlaceholder')}
              className="w-full rounded-xl border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 border text-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full py-3 text-lg">
            {t('onboarding.startButton')}
          </Button>
        </form>
      </div>
    </div>
  );
};
