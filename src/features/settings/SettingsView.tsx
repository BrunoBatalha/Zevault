/**
 * Settings View
 * Configurações do aplicativo: idioma, exportação, importação e reset
 */

import { ConfirmationModal, DataShare } from '@/components/shared';
import { Button, Card } from '@/components/ui';
import { db } from '@/core/database';
import { useI18n } from '@/core/i18n';
import {
    AlertTriangle,
    Check,
    Download,
    Globe,
    Settings,
    Trash2,
    Upload,
} from 'lucide-react';
import { useState } from 'react';

interface SettingsViewProps {
  userName: string;
  onUserNameChange: (name: string) => void;
}

export const SettingsView = ({ userName, onUserNameChange }: SettingsViewProps) => {
  const { t, locale, setLocale, availableLocales } = useI18n();
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(userName);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const languageNames: Record<string, string> = {
    'pt-BR': 'Português (Brasil)',
    'en-US': 'English (US)',
    'es-ES': 'Español',
  };

  const handleExport = async () => {
    try {
      const data = {
        accounts: await db.getAll('accounts'),
        categories: await db.getAll('categories'),
        creditCards: await db.getAll('creditCards'),
        transactions: await db.getAll('transactions'),
        costCenters: await db.getAll('costCenters'),
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financier-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar:', err);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validação básica
      if (!data.accounts || !data.categories || !data.transactions) {
        throw new Error('Arquivo inválido');
      }

      // Limpar e importar
      await db.clear('accounts');
      await db.clear('categories');
      await db.clear('creditCards');
      await db.clear('transactions');
      await db.clear('costCenters');

      for (const acc of data.accounts) await db.add('accounts', acc);
      for (const cat of data.categories) await db.add('categories', cat);
      for (const card of data.creditCards || []) await db.add('creditCards', card);
      for (const trans of data.transactions) await db.add('transactions', trans);
      for (const cc of data.costCenters || []) await db.add('costCenters', cc);

      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (err) {
      console.error('Erro ao importar:', err);
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }

    // Limpar input
    event.target.value = '';
  };

  const handleReset = async () => {
    try {
      await db.clear('accounts');
      await db.clear('categories');
      await db.clear('creditCards');
      await db.clear('transactions');
      await db.clear('costCenters');

      // Re-popular com dados padrão
      await db.seed();

      setShowResetModal(false);
      window.location.reload();
    } catch (err) {
      console.error('Erro ao resetar:', err);
    }
  };

  const handleSaveName = () => {
    if (newName.trim()) {
      onUserNameChange(newName.trim());
      setEditingName(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6" />
          {t('settings.title')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Perfil */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            {t('settings.profile.title')}
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <Button onClick={handleSaveName}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingName(false);
                      setNewName(userName);
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-slate-800 dark:text-white">
                    {userName}
                  </p>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {t('settings.profile.editName')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Idioma */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            {t('settings.language.title')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('settings.language.description')}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {availableLocales.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocale(loc)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  locale === loc
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <span className="block text-2xl mb-1">
                  {loc === 'pt-BR' ? '🇧🇷' : loc === 'en-US' ? '🇺🇸' : '🇪🇸'}
                </span>
                <span
                  className={`text-sm font-medium ${
                    locale === loc
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {languageNames[loc]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Exportação e Importação */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-500" />
            {t('settings.data.title')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('settings.data.description')}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              {t('settings.data.export')}
            </Button>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <span className="inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                {t('settings.data.import')}
              </span>
            </label>

            {importStatus === 'success' && (
              <span className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
                <Check className="w-4 h-4" />
                {t('settings.data.importSuccess')}
              </span>
            )}
            {importStatus === 'error' && (
              <span className="text-rose-600 dark:text-rose-400 text-sm flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {t('settings.data.importError')}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Compartilhamento de Dados */}
      <DataShare />

      {/* Zona de Perigo */}
      <Card>
        <div className="p-6 border-2 border-rose-200 dark:border-rose-900 rounded-lg">
          <h3 className="text-lg font-semibold text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {t('settings.danger.title')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('settings.danger.description')}
          </p>
          <Button variant="danger" onClick={() => setShowResetModal(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t('settings.danger.reset')}
          </Button>
        </div>
      </Card>

      {/* Modal de Confirmação de Reset */}
      <ConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title={t('settings.danger.resetModal.title')}
        message={t('settings.danger.resetModal.message')}
        confirmText={t('settings.danger.resetModal.confirm')}
        isDanger
      />
    </div>
  );
};
