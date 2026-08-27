import { lazy } from 'react';

const Dashboard = lazy(() =>
  import('@/features/dashboard').then((m) => ({ default: m.Dashboard }))
);
const AccountList = lazy(() =>
  import('@/features/accounts').then((m) => ({ default: m.AccountList }))
);
const CreditCardList = lazy(() =>
  import('@/features/credit-cards').then((m) => ({ default: m.CreditCardList }))
);
const TransactionList = lazy(() =>
  import('@/features/transactions').then((m) => ({ default: m.TransactionList }))
);
const CategoryList = lazy(() =>
  import('@/features/categories').then((m) => ({ default: m.CategoryList }))
);
const SettingsView = lazy(() =>
  import('@/features/settings').then((m) => ({ default: m.SettingsView }))
);
const LandingPage = lazy(() =>
  import('@/features/landing').then((m) => ({ default: m.LandingPage }))
);

export {
  Dashboard,
  AccountList,
  CreditCardList,
  TransactionList,
  CategoryList,
  SettingsView,
  LandingPage,
};
