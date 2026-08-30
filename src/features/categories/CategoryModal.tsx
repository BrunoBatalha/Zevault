/**
 * Modal de Categoria
 * Formulário para criar/editar categorias
 */

import { Button } from '@/components/ui';
import { db } from '@/core/database';
import { useI18n } from '@/core/i18n';
import type { Category } from '@/types';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
}

export const CategoryModal = ({ isOpen, onClose, categoryToEdit = null }: CategoryModalProps) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({ name: '', type: 'expense' as Category['type'] });

  useEffect(() => {
    if (categoryToEdit) {
      setFormData(categoryToEdit);
    } else {
      setFormData({ name: '', type: 'expense' });
    }
  }, [categoryToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (categoryToEdit?.id) {
        await db.update('categories', categoryToEdit.id, formData);
      } else {
        await db.add('categories', formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {categoryToEdit ? t('categories.modal.editTitle') : t('categories.modal.newTitle')}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('categories.modal.name')}
            </label>
            <input
              type="text"
              required
              placeholder={t('categories.modal.namePlaceholder')}
              className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('categories.modal.type')}
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-md">
              {(['income', 'expense'] as const).map((tp) => (
                <button
                  type="button"
                  key={tp}
                  onClick={() => setFormData({ ...formData, type: tp })}
                  className={`flex-1 text-sm py-1.5 rounded-md capitalize font-medium transition-all ${
                    formData.type === tp
                      ? 'bg-white dark:bg-slate-600 shadow text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t(`categories.types.${tp}`)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              {t('categories.modal.typeHint')}
            </p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('categories.modal.save')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
