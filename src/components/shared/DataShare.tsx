import { Button } from '@/components/ui';
import { ensureAnonymousUser, isFirebaseConfigured } from '@/config/firebase';
import type { SyncBackupDocument } from '@/core/database';
import { useI18n } from '@/core/i18n';
import {
  approveReceiver, cancelSyncRequest, cancelSyncSession, cleanupSession, completeSync,
  createBackupDocument, createConfirmationFingerprint, createEphemeralKeyPair, createSyncSession,
  decryptAndValidateBackup, describeCurrentDevice, downloadPayload, encryptBackupForReceiver,
  exportPublicKey, listenToSyncRequests, listenToSyncSession, publishPayload, replaceWithBackup,
  requestSync, type SyncRequest, type SyncSession,
} from '@/core/sync';
import { AlertCircle, CheckCircle2, Clock3, Copy, DownloadCloud, LockKeyhole, Send, ShieldCheck, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type FlowStatus = 'idle' | 'starting' | 'waiting' | 'approval' | 'encrypting' | 'requesting' | 'receiving' | 'preview' | 'success' | 'error';
type Role = 'owner' | 'receiver' | null;

const formatRemaining = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export const DataShare = () => {
  const { t } = useI18n();
  const initialCode = new URLSearchParams(window.location.search).get('syncCode')?.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6) ?? '';
  const [codeInput, setCodeInput] = useState(initialCode);
  const [code, setCode] = useState('');
  const [role, setRole] = useState<Role>(null);
  const [status, setStatus] = useState<FlowStatus>('idle');
  const [session, setSession] = useState<SyncSession | null>(null);
  const [requests, setRequests] = useState<SyncRequest[]>([]);
  const [fingerprints, setFingerprints] = useState<Record<string, string>>({});
  const [receiverFingerprint, setReceiverFingerprint] = useState('');
  const [pendingBackup, setPendingBackup] = useState<SyncBackupDocument | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState('');
  const [cleanupPending, setCleanupPending] = useState(false);
  const keyPairRef = useRef<CryptoKeyPair | null>(null);
  const downloadStartedRef = useRef(false);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  const stopListeners = useCallback(() => {
    unsubscribersRef.current.forEach((unsubscribe) => unsubscribe());
    unsubscribersRef.current = [];
  }, []);
  const discardSecrets = useCallback(() => {
    keyPairRef.current = null;
    downloadStartedRef.current = false;
  }, []);
  const resetLocalFlow = useCallback(() => {
    stopListeners(); discardSecrets(); setRole(null); setStatus('idle'); setCode(''); setSession(null);
    setRequests([]); setFingerprints({}); setReceiverFingerprint(''); setPendingBackup(null);
    setRemaining(0); setMessage(''); setCleanupPending(false);
  }, [discardSecrets, stopListeners]);
  const fail = useCallback((error: unknown) => {
    console.error('[Sync]', error);
    const detail = error instanceof Error ? error.message.toLowerCase() : '';
    setMessage(detail.includes('not found')
      ? t('settings.sync.errors.notFound')
      : detail.includes('expired') ? t('settings.sync.errors.expired') : t('settings.sync.errors.generic'));
    setStatus('error');
    discardSecrets();
    stopListeners();
  }, [discardSecrets, stopListeners, t]);

  useEffect(() => () => { stopListeners(); discardSecrets(); }, [discardSecrets, stopListeners]);

  useEffect(() => {
    if (!code || !role) return;
    const cancelOnPageHide = () => {
      if (role === 'owner') void cancelSyncSession(code);
      else void cancelSyncRequest(code);
    };
    window.addEventListener('pagehide', cancelOnPageHide);
    return () => window.removeEventListener('pagehide', cancelOnPageHide);
  }, [code, role]);

  useEffect(() => {
    if (!session || status === 'success') return;
    const expiresAt = session.status === 'waiting' ? session.joinExpiresAt.toMillis() : session.transferExpiresAt.toMillis();
    const update = () => {
      const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0 && !['encrypting', 'receiving', 'preview', 'success', 'error'].includes(status)) {
        setMessage(t('settings.sync.errors.expired')); setStatus('error'); discardSecrets(); stopListeners();
        if (role === 'owner') void cancelSyncSession(code);
        if (role === 'receiver') void cancelSyncRequest(code);
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [code, discardSecrets, role, session, status, stopListeners, t]);

  useEffect(() => {
    if (role !== 'owner' || !session?.ownerPublicKey) return;
    let active = true;
    Promise.all(requests.map(async (request) => [request.uid, await createConfirmationFingerprint(code, session.ownerPublicKey!, request.publicKey)] as const))
      .then((entries) => { if (active) setFingerprints(Object.fromEntries(entries)); }).catch(fail);
    return () => { active = false; };
  }, [code, fail, requests, role, session]);

  const observeOwnerSession = useCallback((sessionCode: string) => {
    unsubscribersRef.current.push(listenToSyncSession(sessionCode, (nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setStatus((current) => {
          if (current === 'encrypting') {
            setMessage(t('settings.sync.success.receivedByOther'));
            setCleanupPending(false);
            discardSecrets();
            return 'success';
          }
          return current;
        });
        return;
      }
      if (nextSession.status === 'completed') {
        setStatus('success'); setMessage(t('settings.sync.success.receivedByOther'));
        void cleanupSession(sessionCode, nextSession).then(() => setCleanupPending(false)).catch(() => setCleanupPending(true));
        discardSecrets();
      } else if (nextSession.status === 'cancelled') {
        setMessage(t('settings.sync.errors.cancelled')); setStatus('error'); discardSecrets();
      }
    }));
  }, [discardSecrets, t]);

  const handleStart = async () => {
    try {
      resetLocalFlow(); setStatus('starting'); setRole('owner');
      const keyPair = await createEphemeralKeyPair(); keyPairRef.current = keyPair;
      const created = await createSyncSession(await exportPublicKey(keyPair.publicKey));
      setCode(created.code); setSession(created.session); setStatus('waiting');
      unsubscribersRef.current.push(listenToSyncRequests(created.code, (nextRequests) => {
        setRequests(nextRequests);
        if (nextRequests.length > 0) setStatus((current) => current === 'waiting' ? 'approval' : current);
      }));
      observeOwnerSession(created.code);
    } catch (error) { fail(error); }
  };

  const handleApprove = async (request: SyncRequest) => {
    if (!keyPairRef.current || !session) return;
    try {
      setStatus('encrypting');
      const approvedSession = await approveReceiver(code, request);
      setSession(approvedSession);
      const encrypted = await encryptBackupForReceiver(await createBackupDocument(), keyPairRef.current.privateKey, request.publicKey, code, session.ownerUid, request.uid);
      await publishPayload(code, encrypted, approvedSession);
      setMessage(t('settings.sync.status.waitingImport'));
    } catch (error) { await cancelSyncSession(code).catch(() => undefined); fail(error); }
  };

  const receivePayload = useCallback(async (nextSession: SyncSession, sessionCode: string) => {
    if (downloadStartedRef.current || !keyPairRef.current || !nextSession.ownerPublicKey) return;
    downloadStartedRef.current = true;
    try {
      setStatus('receiving');
      const backup = await decryptAndValidateBackup(await downloadPayload(nextSession, sessionCode), {
        wrappedVaultKey: nextSession.wrappedVaultKey!, backupIv: nextSession.backupIv!, wrappedKeyIv: nextSession.wrappedKeyIv!,
        hkdfSalt: nextSession.hkdfSalt!, aad: nextSession.aad!, sha256: nextSession.sha256!,
      }, keyPairRef.current.privateKey, nextSession.ownerPublicKey, sessionCode);
      setPendingBackup(backup); setStatus('preview');
    } catch (error) { downloadStartedRef.current = false; fail(error); }
  }, [fail]);

  const observeReceiverSession = useCallback((sessionCode: string, receiverUid: string) => {
    unsubscribersRef.current.push(listenToSyncSession(sessionCode, (nextSession) => {
      setSession(nextSession);
      if (!nextSession) return;
      if (nextSession.status === 'approved' && nextSession.receiverUid === receiverUid) {
        setStatus('requesting'); setMessage(t('settings.sync.status.preparing'));
      }
      if (nextSession.status === 'payload_ready' && nextSession.receiverUid === receiverUid) void receivePayload(nextSession, sessionCode);
      if (nextSession.status === 'cancelled') {
        setMessage(t('settings.sync.errors.cancelled')); setStatus('error'); discardSecrets();
      }
    }));
  }, [discardSecrets, receivePayload, t]);

  const handleRequest = async () => {
    const normalizedCode = codeInput.trim().toUpperCase();
    if (normalizedCode.length !== 6) return;
    try {
      resetLocalFlow(); setCodeInput(normalizedCode); setCode(normalizedCode); setRole('receiver'); setStatus('requesting');
      const keyPair = await createEphemeralKeyPair(); keyPairRef.current = keyPair;
      const publicKey = await exportPublicKey(keyPair.publicKey);
      const currentSession = await requestSync(normalizedCode, publicKey, describeCurrentDevice());
      const user = await ensureAnonymousUser(); setSession(currentSession);
      if (!currentSession.ownerPublicKey) throw new Error('Owner public key is missing');
      setReceiverFingerprint(await createConfirmationFingerprint(normalizedCode, currentSession.ownerPublicKey, publicKey));
      observeReceiverSession(normalizedCode, user.uid);
    } catch (error) { fail(error); }
  };

  const handleImport = async () => {
    if (!pendingBackup || !session) return;
    try {
      setStatus('receiving'); await replaceWithBackup(pendingBackup); await completeSync(code);
      try { await cleanupSession(code, { ...session, status: 'completed' }); setCleanupPending(false); }
      catch { setCleanupPending(true); }
      setPendingBackup(null); setMessage(t('settings.sync.success.imported')); setStatus('success'); discardSecrets();
    } catch (error) { fail(error); }
  };

  const handleCancel = async () => {
    try {
      if (code && role === 'owner') await cancelSyncSession(code);
      if (code && role === 'receiver') await cancelSyncRequest(code);
    } catch (error) { console.warn('[Sync] Best-effort cancellation failed', error); }
    finally { resetLocalFlow(); }
  };
  const retryCleanup = async () => {
    if (!session || !code) return;
    try { await cleanupSession(code, { ...session, status: 'completed' }); setCleanupPending(false); }
    catch (error) { fail(error); setCleanupPending(true); }
  };

  const qrValue = useMemo(() => code ? `${window.location.origin}/settings?syncCode=${encodeURIComponent(code)}` : '', [code]);

  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="sync-title">
    <div className="flex items-start gap-3"><div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><ShieldCheck aria-hidden="true" className="h-5 w-5" /></div><div><h3 id="sync-title" className="text-lg font-semibold text-slate-900 dark:text-white">{t('settings.sync.title')}</h3><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{t('settings.sync.description')}</p></div></div>
    {!isFirebaseConfigured && <div className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />{t('settings.sync.notConfigured')}</div>}
    {isFirebaseConfigured && status === 'idle' && <div className="mt-6 grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-700"><Send aria-hidden="true" className="h-5 w-5 text-emerald-600" /><h4 className="mt-3 font-semibold text-slate-900 dark:text-white">{t('settings.sync.sendTitle')}</h4><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('settings.sync.sendDescription')}</p><Button onClick={handleStart} className="mt-5 w-full">{t('settings.sync.start')}</Button></div>
      <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-700"><DownloadCloud aria-hidden="true" className="h-5 w-5 text-emerald-600" /><h4 className="mt-3 font-semibold text-slate-900 dark:text-white">{t('settings.sync.receiveTitle')}</h4><label htmlFor="sync-code" className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('settings.sync.codeLabel')}</label><input id="sync-code" value={codeInput} onChange={(event) => setCodeInput(event.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6))} maxLength={6} placeholder="ABC234" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center font-mono text-xl tracking-[0.25em] text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" /><Button onClick={handleRequest} disabled={codeInput.length !== 6} className="mt-3 w-full">{t('settings.sync.request')}</Button></div>
    </div>}
    {isFirebaseConfigured && status === 'starting' && <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">{t('settings.sync.status.starting')}</p>}
    {isFirebaseConfigured && role === 'owner' && session && !['success', 'error'].includes(status) && <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">{qrValue && <QRCodeSVG value={qrValue} size={188} level="M" marginSize={1} className="h-auto w-full rounded bg-white" />}</div>
      <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('settings.sync.activeCode')}</p><div className="mt-2 flex items-center gap-2"><span className="font-mono text-3xl font-bold tracking-[0.2em] text-slate-900 dark:text-white">{code}</span><button type="button" onClick={() => void navigator.clipboard.writeText(code)} aria-label={t('settings.sync.copyCode')} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700"><Copy aria-hidden="true" className="h-5 w-5" /></button></div><p className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Clock3 aria-hidden="true" className="h-4 w-4" />{t('settings.sync.expiresIn', { time: formatRemaining(remaining) })}</p>
        {requests.length === 0 ? <p className="mt-5 text-sm text-slate-500">{t('settings.sync.status.waitingDevice')}</p> : <div className="mt-5 space-y-3">{requests.map((request) => <div key={request.uid} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30"><p className="font-semibold text-slate-900 dark:text-white">{request.deviceLabel}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('settings.sync.confirmFingerprint')}</p><p className="mt-2 font-mono text-2xl font-bold tracking-widest text-emerald-700 dark:text-emerald-300">{fingerprints[request.uid] ?? '--- ---'}</p><Button onClick={() => handleApprove(request)} disabled={status === 'encrypting'} className="mt-3">{t('settings.sync.authorize')}</Button></div>)}</div>}
        {message && <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{message}</p>}<Button variant="ghost" onClick={handleCancel} className="mt-4"><X aria-hidden="true" className="mr-2 h-4 w-4" />{t('common.cancel')}</Button></div>
    </div>}
    {isFirebaseConfigured && role === 'receiver' && !['success', 'error'].includes(status) && <div className="mt-6 rounded-xl border border-slate-200 p-5 dark:border-slate-700">
      {status !== 'preview' && <><p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><LockKeyhole aria-hidden="true" className="h-5 w-5 text-emerald-600" />{status === 'receiving' ? t('settings.sync.status.receiving') : t('settings.sync.status.waitingApproval')}</p><p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{t('settings.sync.confirmFingerprint')}</p><p className="mt-2 font-mono text-2xl font-bold tracking-widest text-emerald-700 dark:text-emerald-300">{receiverFingerprint || '--- ---'}</p>{message && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p>}<p className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Clock3 aria-hidden="true" className="h-4 w-4" />{t('settings.sync.expiresIn', { time: formatRemaining(remaining) })}</p></>}
      {status === 'preview' && pendingBackup && <div><h4 className="font-semibold text-slate-900 dark:text-white">{t('settings.sync.previewTitle')}</h4><p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{t('settings.sync.replaceWarning')}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">{Object.entries(pendingBackup.counts).map(([store, count]) => <div key={store} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><dt className="text-slate-500">{t(`settings.sync.stores.${store}`)}</dt><dd className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{count}</dd></div>)}</dl><Button onClick={handleImport} className="mt-5">{t('settings.sync.replaceAndImport')}</Button></div>}
      <Button variant="ghost" onClick={handleCancel} className="mt-4"><X aria-hidden="true" className="mr-2 h-4 w-4" />{t('common.cancel')}</Button>
    </div>}
    {status === 'success' && <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><p className="flex items-center gap-2 font-semibold"><CheckCircle2 aria-hidden="true" className="h-5 w-5" />{message}</p><p className="mt-2 text-sm">{cleanupPending ? t('settings.sync.success.cleanupPending') : t('settings.sync.success.cleaned')}</p><div className="mt-3 flex gap-2">{cleanupPending && <Button onClick={retryCleanup}>{t('settings.sync.retryCleanup')}</Button>}<Button variant="secondary" onClick={resetLocalFlow}>{t('common.close')}</Button></div></div>}
    {status === 'error' && <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"><p className="flex items-center gap-2 font-semibold"><AlertCircle aria-hidden="true" className="h-5 w-5" />{t('settings.sync.errorTitle')}</p><p className="mt-2 text-sm">{message}</p><Button variant="secondary" onClick={resetLocalFlow} className="mt-3">{t('settings.sync.tryAgain')}</Button></div>}
  </section>;
};
