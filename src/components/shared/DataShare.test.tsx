import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataShare } from './DataShare';

vi.mock('@/config/firebase', () => ({
  isFirebaseConfigured: true,
  ensureAnonymousUser: vi.fn(),
}));

vi.mock('@/core/sync', () => ({
  approveReceiver: vi.fn(), cancelSyncRequest: vi.fn(), cancelSyncSession: vi.fn(), cleanupSession: vi.fn(),
  completeSync: vi.fn(), createBackupDocument: vi.fn(), createConfirmationFingerprint: vi.fn(),
  createEphemeralKeyPair: vi.fn(), createSyncSession: vi.fn(), decryptAndValidateBackup: vi.fn(),
  describeCurrentDevice: vi.fn(), downloadPayload: vi.fn(), encryptBackupForReceiver: vi.fn(),
  exportPublicKey: vi.fn(), listenToSyncRequests: vi.fn(), listenToSyncSession: vi.fn(), publishPayload: vi.fn(),
  replaceWithBackup: vi.fn(), requestSync: vi.fn(),
}));

describe('DataShare', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/settings?syncCode=ABC234');
  });

  it('preenche o código recebido pelo deep link do QR', () => {
    render(<DataShare />);
    expect(screen.getByRole('textbox')).toHaveValue('ABC234');
    expect(screen.getByRole('button', { name: /request synchronization/i })).toBeEnabled();
  });
});
