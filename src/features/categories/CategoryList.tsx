/**
 * Lista de Categorias
 * Exibe e gerencia categorias (CRUD)
 */

import { ConfirmationModal } from '@/components/shared';
import { Badge, Button, Card } from '@/components/ui';
import { db } from '@/core/database';
import { useData } from '@/core/hooks';
import { useI18n } from '@/core/i18n';
import type { Category } from '@/types';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CategoryModal } from './CategoryModal';

export const CategoryList = () => {
  const { t } = useI18n();
  const categories = useData<Category>('categories');
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Custom Confirmation Modal State
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const initiateDelete = (id: number) => setDeleteId(id);

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await db.delete('categories', deleteId);
      } catch (err) {
        console.error('Erro ao excluir categoria:', err);
      }
      setDeleteId(null);
    }
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={t('categories.searchPlaceholder')}
            className="pl-10 pr-4 py-2 w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 dark:placeholder-slate-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Button onClick={openNew} icon={Plus}>
          {t('categories.newCategory')}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('common.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('common.type')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredCategories
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {cat.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={cat.type}>{t(`categories.types.${cat.type}`)}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => openEdit(cat)}
                          className="text-emerald-600 hover:text-emerald-900 flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" /> {t('common.edit')}
                        </button>
                        <button
                          onClick={() => cat.id && initiateDelete(cat.id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-slate-500">
                    {t('categories.emptyState')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryToEdit={editingCategory}
      />

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('categories.deleteTitle')}
        message={t('categories.deleteMessage')}
      />
    </div>
  );
};
