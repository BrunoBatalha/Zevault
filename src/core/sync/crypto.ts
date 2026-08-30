import { prepareSyncBackup, type SyncBackupDocument } from '@/core/database';

export interface EncryptedSyncPayload {
  ciphertext: Uint8Array;
  wrappedVaultKey: string;
  backupIv: string;
  wrappedKeyIv: string;
  hkdfSalt: string;
  aad: string;
  sha256: string;
}

const encoder = new TextEncoder();

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => bytes.slice().buffer as ArrayBuffer;

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

export const base64ToBytes = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

export const createEphemeralKeyPair = (): Promise<CryptoKeyPair> =>
  crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);

export const exportPublicKey = (key: CryptoKey): Promise<JsonWebKey> => crypto.subtle.exportKey('jwk', key);

export const importPublicKey = (key: JsonWebKey): Promise<CryptoKey> =>
  crypto.subtle.importKey('jwk', key, { name: 'ECDH', namedCurve: 'P-256' }, true, []);

export const deriveTransferKey = async (
  privateKey: CryptoKey,
  remotePublicKey: JsonWebKey,
  salt: Uint8Array,
  context: string,
): Promise<CryptoKey> => {
  const publicKey = await importPublicKey(remotePublicKey);
  const sharedSecret = await crypto.subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256);
  const hkdfKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: toArrayBuffer(salt), info: encoder.encode(context) },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

export const createConfirmationFingerprint = async (
  code: string,
  ownerPublicKey: JsonWebKey,
  receiverPublicKey: JsonWebKey,
): Promise<string> => {
  const transcript = `${code}|${ownerPublicKey.x}|${ownerPublicKey.y}|${receiverPublicKey.x}|${receiverPublicKey.y}`;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(transcript)));
  const value = (((digest[0] << 16) | (digest[1] << 8) | digest[2]) % 1_000_000).toString().padStart(6, '0');
  return `${value.slice(0, 3)} ${value.slice(3)}`;
};

export const encryptBackupForReceiver = async (
  backup: SyncBackupDocument,
  ownerPrivateKey: CryptoKey,
  receiverPublicKey: JsonWebKey,
  code: string,
  ownerUid: string,
  receiverUid: string,
): Promise<EncryptedSyncPayload> => {
  const aad = `zevault-sync:v1:${code}:${ownerUid}:${receiverUid}`;
  const aadBytes = encoder.encode(aad);
  const backupBytes = encoder.encode(JSON.stringify(backup));
  const backupIv = crypto.getRandomValues(new Uint8Array(12));
  const wrappedKeyIv = crypto.getRandomValues(new Uint8Array(12));
  const hkdfSalt = crypto.getRandomValues(new Uint8Array(32));
  const vaultKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: backupIv, additionalData: aadBytes },
    vaultKey,
    backupBytes,
  ));
  const transferKey = await deriveTransferKey(ownerPrivateKey, receiverPublicKey, hkdfSalt, `zevault-sync-key-wrap-v1:${code}`);
  const rawVaultKey = new Uint8Array(await crypto.subtle.exportKey('raw', vaultKey));
  const wrappedVaultKey = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: wrappedKeyIv, additionalData: aadBytes },
    transferKey,
    rawVaultKey,
  ));
  rawVaultKey.fill(0);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', ciphertext));
  return {
    ciphertext,
    wrappedVaultKey: bytesToBase64(wrappedVaultKey),
    backupIv: bytesToBase64(backupIv),
    wrappedKeyIv: bytesToBase64(wrappedKeyIv),
    hkdfSalt: bytesToBase64(hkdfSalt),
    aad,
    sha256: bytesToBase64(digest),
  };
};

export const decryptAndValidateBackup = async (
  ciphertext: ArrayBuffer,
  payload: Omit<EncryptedSyncPayload, 'ciphertext'>,
  receiverPrivateKey: CryptoKey,
  ownerPublicKey: JsonWebKey,
  code: string,
): Promise<SyncBackupDocument> => {
  const cipherBytes = new Uint8Array(ciphertext);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', cipherBytes));
  if (bytesToBase64(digest) !== payload.sha256) throw new Error('Encrypted backup integrity check failed');
  const transferKey = await deriveTransferKey(
    receiverPrivateKey,
    ownerPublicKey,
    base64ToBytes(payload.hkdfSalt),
    `zevault-sync-key-wrap-v1:${code}`,
  );
  const rawVaultKey = new Uint8Array(await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(payload.wrappedKeyIv)), additionalData: encoder.encode(payload.aad) },
    transferKey,
    toArrayBuffer(base64ToBytes(payload.wrappedVaultKey)),
  ));
  const vaultKey = await crypto.subtle.importKey('raw', rawVaultKey, 'AES-GCM', false, ['decrypt']);
  rawVaultKey.fill(0);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(payload.backupIv)), additionalData: encoder.encode(payload.aad) },
    vaultKey,
    cipherBytes,
  );
  return prepareSyncBackup(JSON.parse(new TextDecoder().decode(plaintext)));
};
