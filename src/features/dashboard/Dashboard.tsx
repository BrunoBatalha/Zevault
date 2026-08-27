/**
 * Dashboard
 * Painel principal com KPIs e gráficos financeiros
 */

import { Card } from '@/components/ui';
import { useData, useTheme } from '@/core/hooks';
import { useI18n } from '@/core/i18n';
import type { Account, Category, Transaction } from '@/types';
import {
    ArrowDownRight,
    ArrowUpRight,
    Wallet,
} from 'lucide-react';
import { useMemo } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';
import { buildFutureExpensesChart } from './future-expenses';

export const Dashboard = () => {
  const { t, formatCurrency, formatMonthYear } = useI18n();
  const { theme } = useTheme();
  const transactions = useData<Transaction>('transactions');
  const accounts = useData<Account>('accounts');
  const categories = useData<Category>('categories');
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#f1f5f9';
  const tooltipStyle = {
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    backgroundColor: isDark ? '#1e293b' : '#fff',
    color: isDark ? '#f8fafc' : '#1e293b',
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  // Calcular fluxo do mês atual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyMetrics = transactions.reduce(
    (acc, t) => {
      // Parse date explicitly to avoid timezone issues
      const [y, m, d] = t.date.split('-').map(Number);
      const tDate = new Date(y, m - 1, d);

      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear && t.status === 'paid') {
        if (t.type === 'income') acc.income += Number(t.amount);
        if (t.type === 'expense') acc.expense += Number(t.amount);
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  // Dados para o Gráfico
  const chartData = useMemo(() => {
    const data: Record<string, { date: string; income: number; expense: number; balance: number }> = {};
    transactions.forEach((t) => {
      if (t.status !== 'paid') return;
      const date = t.date; // YYYY-MM-DD
      if (!data[date]) data[date] = { date, income: 0, expense: 0, balance: 0 };
      if (t.type === 'income') data[date].income += Number(t.amount);
      if (t.type === 'expense') data[date].expense += Number(t.amount);
    });

    // Transformar em array e ordenar
    const sortedData = Object.values(data).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calcular saldo acumulado usando reduce
    let balance = 0;
    return sortedData
      .map((item) => {
        balance += item.income - item.expense;
        return { ...item, balance };
      })
      .slice(-30); // Últimos 30 dias com movimento
  }, [transactions]);

  const futureExpensesChart = useMemo(
    () => buildFutureExpensesChart(transactions, categories, new Date(), t('dashboard.uncategorized')),
    [categories, t, transactions],
  );

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-xl hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/20 transition-all duration-300 border-l-4 border-l-indigo-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('dashboard.totalBalance')}
              </p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                {formatCurrency(totalBalance)}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl shadow-sm">
              <Wallet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center mr-2 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +2.5%
            </span>
            <span className="text-xs">{t('dashboard.vsPreviousMonth')}</span>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-xl hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 transition-all duration-300 border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('dashboard.incomeMonth')}
              </p>
              <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">
                {formatCurrency(monthlyMetrics.income)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl shadow-sm">
              <ArrowUpRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-6 h-8"></div>
        </Card>

        <Card className="p-6 hover:shadow-xl hover:shadow-rose-100/50 dark:hover:shadow-rose-900/20 transition-all duration-300 border-l-4 border-l-rose-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('dashboard.expenseMonth')}
              </p>
              <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2 tracking-tight">
                {formatCurrency(monthlyMetrics.expense)}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl shadow-sm">
              <ArrowDownRight className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="mt-6 h-8"></div>
        </Card>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 min-h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('dashboard.cashFlow')}
            </h4>
            <select className="text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 focus:ring-indigo-500">
              <option>{t('dates.last30Days')}</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="date"
                tickFormatter={(t) => t.split('-')[2]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <RechartsTooltip
                cursor={{ fill: isDark ? '#334155' : '#f8fafc' }}
                contentStyle={tooltipStyle}
                formatter={(value) => value !== undefined ? formatCurrency(Number(value)) : ''}
              />
              <Bar dataKey="income" name={t('dashboard.income')} fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="expense" name={t('dashboard.expenses')} fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-8 min-h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('dashboard.balanceEvolution')}
            </h4>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('dashboard.accumulatedBalance')}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="date"
                tickFormatter={(t) => t.split('-')[2]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <RechartsTooltip contentStyle={tooltipStyle} formatter={(value) => value !== undefined ? formatCurrency(Number(value)) : ''} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorBalance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-8 min-h-[450px]">
        <div className="mb-8">
          <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('dashboard.futureExpenses')}
          </h4>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('dashboard.futureExpensesDescription')}
          </p>
        </div>

        {futureExpensesChart.data.length === 0 ? (
          <div className="flex h-[350px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            {t('dashboard.noFutureExpenses')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={futureExpensesChart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="month"
                tickFormatter={(month) => formatMonthYear(`${month}-01`)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <RechartsTooltip
                cursor={{ fill: isDark ? '#334155' : '#f8fafc' }}
                contentStyle={tooltipStyle}
                labelFormatter={(month) => formatMonthYear(`${month}-01`)}
                formatter={(value) => value !== undefined ? formatCurrency(Number(value)) : ''}
              />
              <Legend />
              {futureExpensesChart.categories.map((category) => (
                <Bar
                  key={category.key}
                  dataKey={category.key}
                  name={category.label}
                  fill={category.color}
                  stackId="future-expenses"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
};
