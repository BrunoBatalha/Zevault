// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { SyncBackupDocument } from '@/core/database';
import {
  createConfirmationFingerprint,
  createEphemeralKeyPair,
  decryptAndValidateBackup,
  encryptBackupForReceiver,
  exportPublicKey,
} from './crypto';

const backup: SyncBackupDocument = {
  protocolVersion: 1,
  schemaVersion: 3,
  createdAt: '2026-08-30T12:00:00.000Z',
  counts: { accounts: 1, categories: 0, costCenters: 0, transactions: 0, creditCards: 0 },
  data: {
    accounts: [{ id: 1, name: 'Banco', balance: 100 }],
    categories: [], costCenters: [], transactions: [], creditCards: [],
  },
};

describe('E2EE sync crypto', () => {
  it('protege e recupera um backup com pares efêmeros distintos', async () => {
    const owner = await createEphemeralKeyPair();
    const receiver = await createEphemeralKeyPair();
    const ownerPublic = await exportPublicKey(owner.publicKey);
    const receiverPublic = await exportPublicKey(receiver.publicKey);
    const encrypted = await encryptBackupForReceiver(backup, owner.privateKey, receiverPublic, 'ABC234', 'owner', 'receiver');

    const decrypted = await decryptAndValidateBackup(
      encrypted.ciphertext.buffer as ArrayBuffer,
      encrypted,
      receiver.privateKey,
      ownerPublic,
      'ABC234',
    );

    expect(decrypted).toEqual(backup);
  });

  it('rejeita chave privada de outro dispositivo', async () => {
    const owner = await createEphemeralKeyPair();
    const receiver = await createEphemeralKeyPair();
    const attacker = await createEphemeralKeyPair();
    const encrypted = await encryptBackupForReceiver(
      backup,
      owner.privateKey,
      await exportPublicKey(receiver.publicKey),
      'ABC234', 'owner', 'receiver',
    );

    await expect(decryptAndValidateBackup(
      encrypted.ciphertext.buffer as ArrayBuffer,
      encrypted,
      attacker.privateKey,
      await exportPublicKey(owner.publicKey),
      'ABC234',
    )).rejects.toThrow();
  });

  it('detecta adulteração do ciphertext antes de importar', async () => {
    const owner = await createEphemeralKeyPair();
    const receiver = await createEphemeralKeyPair();
    const encrypted = await encryptBackupForReceiver(
      backup,
      owner.privateKey,
      await exportPublicKey(receiver.publicKey),
      'ABC234', 'owner', 'receiver',
    );
    encrypted.ciphertext[0] ^= 1;

    await expect(decryptAndValidateBackup(
      encrypted.ciphertext.buffer as ArrayBuffer,
      encrypted,
      receiver.privateKey,
      await exportPublicKey(owner.publicKey),
      'ABC234',
    )).rejects.toThrow('integrity');
  });

  it('gera a mesma impressão para o mesmo transcript', async () => {
    const owner = await createEphemeralKeyPair();
    const receiver = await createEphemeralKeyPair();
    const ownerPublic = await exportPublicKey(owner.publicKey);
    const receiverPublic = await exportPublicKey(receiver.publicKey);
    await expect(createConfirmationFingerprint('ABC234', ownerPublic, receiverPublic))
      .resolves.toMatch(/^\d{3} \d{3}$/);
  });
});
