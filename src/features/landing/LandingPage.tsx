import { Button } from '@/components/ui';
import { useI18n } from '@/core/i18n';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CalendarClock, Check,
  ChevronRight, CreditCard, Database, Download, Menu, ReceiptText, RefreshCw,
  ShieldCheck, Tags, Wallet, X,
} from 'lucide-react';
import { useState } from 'react';

interface LandingPageProps { onGetStarted: () => void }

const featureIcons = [Wallet, ReceiptText, CreditCard, CalendarClock, Tags, RefreshCw];
const benefitIcons = [Database, ShieldCheck, RefreshCw];

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen overflow-y-auto bg-white font-sans text-slate-950 selection:bg-emerald-100 selection:text-emerald-950 dark:bg-slate-950 dark:text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-6">
          <a href="#top" className="flex items-center gap-3 font-bold tracking-tight" aria-label="Zevault">
            <img src="/zevault-mark.png" alt="" className="h-10 w-10 rounded-xl object-contain shadow-md shadow-emerald-200/60 dark:shadow-none" />
            <span className="text-xl">Zevault</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex dark:text-slate-300" aria-label={t('landing.nav.ariaLabel')}>
            <a href="#benefits" className="transition-colors hover:text-emerald-700 dark:hover:text-emerald-300">{t('landing.nav.benefits')}</a>
            <a href="#features" className="transition-colors hover:text-emerald-700 dark:hover:text-emerald-300">{t('landing.nav.features')}</a>
            <a href="#privacy" className="transition-colors hover:text-emerald-700 dark:hover:text-emerald-300">{t('landing.nav.privacy')}</a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <Button onClick={onGetStarted} variant="success" className="min-h-11 px-5">{t('landing.nav.accessSystem')}</Button>
            </div>
            <button type="button" aria-label={mobileMenuOpen ? t('landing.nav.closeMenu') : t('landing.nav.openMenu')} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="border-t border-slate-200 bg-white px-5 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950" aria-label={t('landing.nav.ariaLabel')}>
            <div className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-semibold">
              {(['benefits', 'features', 'privacy'] as const).map((item) => <a key={item} href={`#${item}`} onClick={closeMobileMenu} className="rounded-lg px-3 py-3 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">{t(`landing.nav.${item}`)}</a>)}
              <Button onClick={() => { onGetStarted(); closeMobileMenu(); }} className="mt-2 min-h-11 w-full">{t('landing.nav.accessSystem')}</Button>
            </div>
          </nav>
        )}
      </header>

      <main id="top" className="pt-18">
        <section className="relative isolate overflow-hidden pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pb-32">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.14),transparent_32%),radial-gradient(circle_at_85%_30%,rgba(20,184,166,0.12),transparent_30%)] dark:bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.16),transparent_32%),radial-gradient(circle_at_85%_30%,rgba(20,184,166,0.12),transparent_30%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] dark:opacity-20" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)] lg:gap-12">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" />{t('landing.hero.badge')}</div>
              <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-6xl dark:text-white">{t('landing.hero.title')}{' '}<span className="bg-gradient-to-r from-emerald-700 to-teal-500 bg-clip-text text-transparent dark:from-emerald-300 dark:to-teal-300">{t('landing.hero.titleHighlight')}</span></h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl lg:mx-0 dark:text-slate-300">{t('landing.hero.description')}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <button onClick={onGetStarted} className="inline-flex min-h-13 items-center justify-center rounded-xl bg-emerald-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 dark:shadow-none">{t('landing.hero.cta')}<ChevronRight className="ml-2 h-5 w-5" /></button>
                <a href="#benefits" className="inline-flex min-h-13 items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-base font-bold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">{t('landing.hero.secondaryCta')}</a>
              </div>
              <ul className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium text-slate-600 lg:justify-start dark:text-slate-300">
                {(['noSignup', 'free', 'offline'] as const).map((item) => <li key={item} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" />{t(`landing.hero.proof.${item}`)}</li>)}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-2xl lg:max-w-none" aria-label={t('landing.preview.ariaLabel')}>
              <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-emerald-300/25 to-teal-300/10 blur-2xl" />
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
                <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="ml-3 text-xs font-semibold text-slate-400">{t('landing.preview.title')}</span></div>
                <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 sm:px-6 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"><ShieldCheck className="h-4 w-4" />{t('landing.preview.securityLabel')}</div>
                <div className="p-4 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(['balance', 'committed', 'available'] as const).map((item, index) => <div key={item} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t(`landing.preview.${item}`)}</p>{index === 0 ? <Wallet className="h-4 w-4 text-slate-400" /> : index === 1 ? <CalendarClock className="h-4 w-4 text-amber-500" /> : <ShieldCheck className="h-4 w-4 text-emerald-500" />}</div><p className={`mt-2 text-lg font-bold sm:text-xl ${index === 2 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-950 dark:text-white'}`}>{t(`landing.preview.${item}Value`)}</p></div>)}
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-[1.25fr_0.75fr]">
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex items-center justify-between"><p className="text-sm font-bold">{t('landing.preview.cashFlow')}</p><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('landing.preview.lastDays')}</span></div><div className="mt-5 flex h-28 items-end gap-2" aria-hidden="true">{[36, 58, 45, 76, 54, 88, 66, 94, 73, 82].map((height, index) => <div key={index} className="flex h-full flex-1 items-end gap-0.5"><span className="w-1/2 rounded-t-sm bg-emerald-500" style={{ height: `${height}%` }} /><span className="w-1/2 rounded-t-sm bg-rose-300 dark:bg-rose-700" style={{ height: `${Math.max(22, 82 - height / 2)}%` }} /></div>)}</div></div>
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><p className="text-sm font-bold">{t('landing.preview.recent')}</p><div className="mt-3 space-y-3"><div className="flex items-center gap-2"><span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 dark:bg-emerald-950"><ArrowUpRight className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1 truncate text-xs font-medium">{t('landing.preview.income')}</span><span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{t('landing.preview.incomeValue')}</span></div><div className="flex items-center gap-2"><span className="rounded-lg bg-rose-50 p-1.5 text-rose-700 dark:bg-rose-950"><ArrowDownRight className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1 truncate text-xs font-medium">{t('landing.preview.expense')}</span><span className="text-xs font-bold">{t('landing.preview.expenseValue')}</span></div><div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{t('landing.preview.reminder')}</div></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-950 py-8 text-white dark:border-slate-800">
          <div className="mx-auto grid max-w-7xl items-center gap-4 px-5 sm:px-6 md:grid-cols-[auto_1fr] md:gap-8">
            <p className="text-5xl font-extrabold tracking-tight text-emerald-400">68%</p>
            <p className="max-w-4xl text-sm leading-6 text-slate-300 sm:text-base">{t('landing.evidence.text')}{' '}<a href="https://cetic.br/pt/tics/privacidade-e-protecao-de-dados-pessoais/2023/usuarios/PR5/" target="_blank" rel="noreferrer" className="font-semibold text-emerald-300 underline decoration-emerald-600 underline-offset-4 hover:text-emerald-200">{t('landing.evidence.source')}</a></p>
          </div>
        </section>

        <section id="benefits" className="scroll-mt-20 bg-slate-50 py-20 sm:py-28 dark:bg-slate-900/60">
          <div className="mx-auto max-w-7xl px-5 sm:px-6"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">{t('landing.benefits.eyebrow')}</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{t('landing.benefits.title')}</h2><p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">{t('landing.benefits.subtitle')}</p></div>
            <div className="mt-14 grid gap-5 lg:grid-cols-3">{(['exposure', 'account', 'transfer'] as const).map((item, index) => { const Icon = benefitIcons[index]; return <article key={item} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900"><span className="inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"><Icon className="h-6 w-6" /></span><h3 className="mt-5 text-xl font-bold">{t(`landing.benefits.${item}.title`)}</h3><p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{t(`landing.benefits.${item}.description`)}</p></article>; })}</div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">{t('landing.features.eyebrow')}</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{t('landing.features.title')}</h2><p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">{t('landing.features.subtitle')}</p></div>
            <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{(['accounts', 'transactions', 'cards', 'future', 'organization', 'backup'] as const).map((item, index) => { const Icon = featureIcons[index]; return <article key={item} className="group"><span className="inline-flex rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-700 transition-transform group-hover:-translate-y-1 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"><Icon className="h-6 w-6" /></span><h3 className="mt-5 text-lg font-bold">{t(`landing.features.${item}.title`)}</h3><p className="mt-2 leading-7 text-slate-600 dark:text-slate-400">{t(`landing.features.${item}.description`)}</p></article>; })}</div>
          </div>
        </section>

        <section className="bg-slate-950 py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-300">{t('landing.howItWorks.eyebrow')}</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{t('landing.howItWorks.title')}</h2><p className="mt-5 text-lg leading-8 text-slate-300">{t('landing.howItWorks.subtitle')}</p></div><ol className="grid gap-4">{(['setup', 'record', 'decide'] as const).map((item, index) => <li key={item} className="flex gap-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-emerald-950">{index + 1}</span><div><h3 className="font-bold text-white">{t(`landing.howItWorks.${item}.title`)}</h3><p className="mt-2 leading-7 text-slate-400">{t(`landing.howItWorks.${item}.description`)}</p></div></li>)}</ol></div></div>
        </section>

        <section id="privacy" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">{t('landing.privacy.eyebrow')}</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{t('landing.privacy.title')}</h2><p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">{t('landing.privacy.description')}</p><ul className="mt-7 space-y-4">{(['local', 'backup', 'sync', 'device'] as const).map((item) => <li key={item} className="flex items-start gap-3"><span className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Check className="h-4 w-4" /></span><span className="leading-7 text-slate-700 dark:text-slate-300">{t(`landing.privacy.${item}`)}</span></li>)}</ul></div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-4"><span className="rounded-2xl bg-emerald-100 p-4 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Database className="h-7 w-7" /></span><div><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('landing.privacy.cardLabel')}</p><p className="mt-1 text-xl font-bold">{t('landing.privacy.cardValue')}</p></div></div><div className="my-7 h-px bg-slate-200 dark:bg-slate-800" /><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-white p-4 dark:bg-slate-950"><Download className="h-5 w-5 text-emerald-600" /><p className="mt-3 font-bold">{t('landing.privacy.exportTitle')}</p><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{t('landing.privacy.exportDescription')}</p></div><div className="rounded-xl bg-white p-4 dark:bg-slate-950"><RefreshCw className="h-5 w-5 text-emerald-600" /><p className="mt-3 font-bold">{t('landing.privacy.syncTitle')}</p><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{t('landing.privacy.syncDescription')}</p></div></div></div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-6 sm:pb-28"><div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-emerald-600 px-6 py-14 text-center text-white sm:px-12 sm:py-18"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_35%)]" /><div className="relative mx-auto max-w-2xl"><h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{t('landing.cta.title')}</h2><p className="mt-5 text-lg leading-8 text-emerald-50">{t('landing.cta.description')}</p><button onClick={onGetStarted} className="mt-8 inline-flex min-h-13 items-center justify-center rounded-xl bg-white px-8 py-3.5 font-bold text-emerald-800 shadow-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{t('landing.cta.button')}<ArrowRight className="ml-2 h-5 w-5" /></button><p className="mt-4 text-sm text-emerald-100">{t('landing.cta.note')}</p></div></div></section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 py-9 dark:border-slate-800 dark:bg-slate-950"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-center sm:px-6 md:flex-row md:text-left"><div className="flex items-center gap-2.5 font-bold"><img src="/zevault-mark.png" alt="" className="h-8 w-8 rounded-lg" />Zevault</div><p className="text-sm text-slate-500 dark:text-slate-400">{t('landing.footer.copyright', { year: new Date().getFullYear() })}</p></div></footer>
    </div>
  );
};
