/**
 * Landing Page
 * Página de apresentação do produto com SEO e foco em privacidade
 */

import { Button } from '@/components/ui';
import { useI18n } from '@/core/i18n';
import {
    Check,
    ChevronRight,
    Database,
    Globe,
    Lock,
    Menu,
    ShieldCheck,
    Smartphone,
    Upload,
} from 'lucide-react';
import { useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-white overflow-y-auto selection:bg-emerald-100 selection:text-emerald-950">
      {/* Navbar Semantic */}
      <header className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl text-slate-900 dark:text-white tracking-tight">
            <img
              src="/zevault-mark.png"
              alt=""
              className="h-11 w-11 rounded-xl object-contain shadow-lg shadow-emerald-200/70 dark:shadow-none"
            />
            Zevault
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a
              href="#features"
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
            >
              {t('landing.nav.features')}
            </a>
            <a
              href="#privacy"
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
            >
              {t('landing.nav.privacy')}
            </a>
            <a
              href="#backup"
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
            >
              {t('landing.nav.backup')}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              onClick={onGetStarted}
              variant="success"
              className="shadow-lg shadow-emerald-200/50 dark:shadow-none hidden md:inline-flex"
            >
              {t('landing.nav.accessSystem')}
            </Button>
            <button
              aria-label={t('landing.nav.openMenu')}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu (Landing) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute top-20 left-0 right-0 mx-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col p-4 gap-3 text-sm">
              <a
                href="#features"
                className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.nav.features')}
              </a>
              <a
                href="#privacy"
                className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.nav.privacy')}
              </a>
              <a
                href="#backup"
                className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.nav.backup')}
              </a>
              <div className="pt-2">
                <Button
                  onClick={() => {
                    onGetStarted();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  {t('landing.nav.accessSystem')}
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/60 via-slate-50 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 -z-10" />
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
              <ShieldCheck className="w-4 h-4" /> {t('landing.hero.badge')}
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 leading-[1.1]">
              {t('landing.hero.title')} <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                {t('landing.hero.titleHighlight')}
              </span>
            </h1>
            <p
              className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t('landing.hero.description') }}
            />
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 dark:shadow-none hover:shadow-2xl hover:shadow-emerald-300 hover:-translate-y-1"
              >
                {t('landing.hero.cta')} <ChevronRight className="w-5 h-5 ml-2" />
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm hover:shadow-md">
                {t('landing.hero.docs')}
              </button>
            </div>
          </div>
        </section>

        {/* Features / SEO Grid */}
        <section id="features" className="py-32 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
                {t('landing.features.title')}
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                {t('landing.features.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <article className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-emerald-100 dark:hover:border-emerald-900 hover:shadow-xl hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 transition-all duration-300 group">
                <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-slate-100 dark:border-slate-600">
                  <Database className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {t('landing.features.storage.title')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('landing.features.storage.description')}
                </p>
              </article>

              <article className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-emerald-100 dark:hover:border-emerald-900 hover:shadow-xl hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 transition-all duration-300 group">
                <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-slate-100 dark:border-slate-600">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {t('landing.features.privacy.title')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('landing.features.privacy.description')}
                </p>
              </article>

              <article className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-emerald-100 dark:hover:border-emerald-900 hover:shadow-xl hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 transition-all duration-300 group">
                <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-slate-100 dark:border-slate-600">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {t('landing.features.backup.title')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('landing.features.backup.description')}
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section id="privacy" className="py-32 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight leading-tight">
                  {t('landing.comparison.title')}
                </h2>
                <p className="text-slate-400 text-xl mb-10 leading-relaxed">
                  {t('landing.comparison.description')}
                </p>
                <ul className="space-y-6">
                  <li className="flex items-center gap-4">
                    <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400">
                      <Check className="w-6 h-6" />
                    </div>
                    <span className="text-lg">{t('landing.comparison.offlineFirst')}</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400">
                      <Check className="w-6 h-6" />
                    </div>
                    <span className="text-lg">{t('landing.comparison.noFees')}</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400">
                      <Check className="w-6 h-6" />
                    </div>
                    <span className="text-lg">{t('landing.comparison.compliant')}</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-950 rounded-3xl p-8 border border-slate-800 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500" />
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="ml-auto text-xs text-slate-500 font-mono">security_check.js</span>
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('landing.comparison.terminal.dbLocation')}</span>
                    <span className="text-emerald-400">{t('landing.comparison.terminal.dbLocationValue')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('landing.comparison.terminal.externalAccess')}</span>
                    <span className="text-amber-400">{t('landing.comparison.terminal.externalAccessValue')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('landing.comparison.terminal.encryption')}</span>
                    <span className="text-amber-400">{t('landing.comparison.terminal.encryptionValue')}</span>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 mt-6 text-xs text-slate-300 leading-loose">
                    {t('landing.comparison.terminal.systemInit')}
                    <br />
                    {t('landing.comparison.terminal.connecting')}
                    <br />
                    {t('landing.comparison.terminal.syncDisabled')}
                    <br />
                    {t('landing.comparison.terminal.ready')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="py-32 bg-emerald-700 text-center px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-600 to-emerald-800"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">
              {t('landing.cta.title')}
            </h2>
            <p className="text-emerald-100 mb-10 max-w-xl mx-auto text-lg">
              {t('landing.cta.description')}
            </p>
            <button
              onClick={onGetStarted}
              className="px-10 py-4 bg-white text-emerald-700 font-bold rounded-xl shadow-2xl hover:bg-emerald-50 transition-all hover:scale-105"
            >
              {t('landing.cta.button')}
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">{t('landing.footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
              <Globe className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
              <Smartphone className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
