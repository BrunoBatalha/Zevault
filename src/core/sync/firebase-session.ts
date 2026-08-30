import { ensureAnonymousUser, getFirebaseServices } from '@/config/firebase';
import {
  Bytes,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { EncryptedSyncPayload } from './crypto';

export type SyncStatus = 'waiting' | 'approved' | 'payload_ready' | 'completed' | 'cancelled';

export interface SyncSession {
  protocolVersion: 1;
  status: SyncStatus;
  ownerUid: string;
  ownerPublicKey?: JsonWebKey;
  receiverUid?: string;
  receiverPublicKey?: JsonWebKey;
  createdAt: Timestamp;
  joinExpiresAt: Timestamp;
  transferExpiresAt: Timestamp;
  completedAt?: Timestamp;
  chunkCount?: number;
  chunkSize?: number;
  wrappedVaultKey?: string;
  backupIv?: string;
  wrappedKeyIv?: string;
  hkdfSalt?: string;
  aad?: string;
  sha256?: string;
  payloadSize?: number;
}

export interface SyncRequest {
  uid: string;
  publicKey: JsonWebKey;
  deviceLabel: string;
  createdAt: Timestamp;
}

export interface SyncChunk {
  index: number;
  totalChunks: number;
  size: number;
  bytes: Bytes;
  expiresAt: Timestamp;
}

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const JOIN_DURATION_MS = 5 * 60 * 1000;
const TRANSFER_DURATION_MS = 10 * 60 * 1000;
const MAX_PAYLOAD_BYTES = 50 * 1024 * 1024;
const BATCH_CHUNK_LIMIT = 10;
const BATCH_DELETE_LIMIT = 10;
export const SYNC_CHUNK_SIZE = 700 * 1024;

const generateCode = (): string => {
  const random = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(random, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join('');
};

const chunkId = (index: number): string => index.toString().padStart(6, '0');
const sessionRef = (code: string) => doc(getFirebaseServices().firestore, 'syncSessions', code);
const chunkRef = (code: string, index: number) => doc(sessionRef(code), 'syncChunks', chunkId(index));

export const splitCiphertext = (ciphertext: Uint8Array): Uint8Array[] => {
  if (ciphertext.byteLength > MAX_PAYLOAD_BYTES) throw new Error('Encrypted backup exceeds the 50 MB limit');
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < ciphertext.byteLength; offset += SYNC_CHUNK_SIZE) {
    chunks.push(ciphertext.slice(offset, offset + SYNC_CHUNK_SIZE));
  }
  return chunks;
};

export const reassembleCiphertext = (chunks: Uint8Array[], expectedSize: number): ArrayBuffer => {
  if (!Number.isInteger(expectedSize) || expectedSize < 1 || expectedSize > MAX_PAYLOAD_BYTES) {
    throw new Error('Invalid encrypted payload size');
  }
  const output = new Uint8Array(expectedSize);
  let offset = 0;
  for (const chunk of chunks) {
    if (offset + chunk.byteLength > expectedSize) throw new Error('Encrypted chunks exceed expected size');
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (offset !== expectedSize) throw new Error('Encrypted chunks are incomplete');
  return output.buffer;
};

export const createSyncSession = async (ownerPublicKey: JsonWebKey): Promise<{ code: string; session: SyncSession }> => {
  const user = await ensureAnonymousUser();
  const { firestore } = getFirebaseServices();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateCode();
    const now = Date.now();
    const session: SyncSession = {
      protocolVersion: 1,
      status: 'waiting',
      ownerUid: user.uid,
      ownerPublicKey,
      createdAt: Timestamp.fromMillis(now),
      joinExpiresAt: Timestamp.fromMillis(now + JOIN_DURATION_MS),
      transferExpiresAt: Timestamp.fromMillis(now + JOIN_DURATION_MS),
    };
    const created = await runTransaction(firestore, async (transaction) => {
      const reference = doc(firestore, 'syncSessions', code);
      if ((await transaction.get(reference)).exists()) return false;
      transaction.set(reference, session);
      return true;
    });
    if (created) return { code, session };
  }
  throw new Error('Could not allocate a synchronization code');
};

export const requestSync = async (code: string, publicKey: JsonWebKey, deviceLabel: string): Promise<SyncSession> => {
  const user = await ensureAnonymousUser();
  const normalizedCode = code.trim().toUpperCase();
  const reference = sessionRef(normalizedCode);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) throw new Error('Synchronization session not found');
  const session = snapshot.data() as SyncSession;
  if (session.status !== 'waiting' || session.joinExpiresAt.toMillis() <= Date.now()) {
    throw new Error('Synchronization session expired');
  }
  await setDoc(doc(collection(reference, 'requests'), user.uid), {
    uid: user.uid,
    publicKey,
    deviceLabel,
    createdAt: Timestamp.now(),
  } satisfies SyncRequest);
  return session;
};

export const listenToSyncRequests = (code: string, callback: (requests: SyncRequest[]) => void): Unsubscribe =>
  onSnapshot(collection(sessionRef(code), 'requests'), (snapshot) => {
    callback(snapshot.docs.map((item) => item.data() as SyncRequest));
  });

export const listenToSyncSession = (code: string, callback: (session: SyncSession | null) => void): Unsubscribe =>
  onSnapshot(sessionRef(code), (snapshot) => callback(snapshot.exists() ? snapshot.data() as SyncSession : null));

export const approveReceiver = async (code: string, request: SyncRequest): Promise<SyncSession> => {
  const user = await ensureAnonymousUser();
  const { firestore } = getFirebaseServices();
  return await runTransaction(firestore, async (transaction) => {
    const reference = sessionRef(code);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error('Synchronization session not found');
    const session = snapshot.data() as SyncSession;
    if (session.ownerUid !== user.uid || session.status !== 'waiting' || session.joinExpiresAt.toMillis() <= Date.now()) {
      throw new Error('Synchronization session cannot be approved');
    }
    const requestReference = doc(collection(reference, 'requests'), request.uid);
    if (!(await transaction.get(requestReference)).exists()) throw new Error('Synchronization request not found');
    const transferExpiresAt = Timestamp.fromMillis(Date.now() + TRANSFER_DURATION_MS);
    transaction.update(reference, {
      status: 'approved',
      receiverUid: request.uid,
      receiverPublicKey: request.publicKey,
      transferExpiresAt,
    });
    return {
      ...session,
      status: 'approved',
      receiverUid: request.uid,
      receiverPublicKey: request.publicKey,
      transferExpiresAt,
    };
  });
};

const deleteChunks = async (code: string, count: number): Promise<void> => {
  const { firestore } = getFirebaseServices();
  for (let start = 0; start < count; start += BATCH_DELETE_LIMIT) {
    const batch = writeBatch(firestore);
    const end = Math.min(count, start + BATCH_DELETE_LIMIT);
    for (let index = start; index < end; index += 1) batch.delete(chunkRef(code, index));
    await batch.commit();
  }
};

export const publishPayload = async (
  code: string,
  payload: EncryptedSyncPayload,
  approvedSession?: SyncSession,
): Promise<void> => {
  const reference = sessionRef(code);
  let session = approvedSession;
  if (!session) {
    const snapshot = await getDoc(reference);
    if (!snapshot.exists()) throw new Error('Synchronization session not found');
    session = snapshot.data() as SyncSession;
  }
  if (session.status !== 'approved') {
    throw new Error(`Synchronization session is not approved (status: ${session.status})`);
  }
  if (session.transferExpiresAt.toMillis() <= Date.now()) {
    throw new Error('Synchronization transfer expired');
  }
  const chunks = splitCiphertext(payload.ciphertext);
  const { firestore } = getFirebaseServices();
  try {
    for (let start = 0; start < chunks.length; start += BATCH_CHUNK_LIMIT) {
      const batch = writeBatch(firestore);
      const end = Math.min(chunks.length, start + BATCH_CHUNK_LIMIT);
      for (let index = start; index < end; index += 1) {
        const chunk = chunks[index];
        batch.set(chunkRef(code, index), {
          index,
          totalChunks: chunks.length,
          size: chunk.byteLength,
          bytes: Bytes.fromUint8Array(chunk),
          expiresAt: session.transferExpiresAt,
        } satisfies SyncChunk);
      }
      await batch.commit();
    }
    await updateDoc(reference, {
      status: 'payload_ready',
      chunkCount: chunks.length,
      chunkSize: SYNC_CHUNK_SIZE,
      wrappedVaultKey: payload.wrappedVaultKey,
      backupIv: payload.backupIv,
      wrappedKeyIv: payload.wrappedKeyIv,
      hkdfSalt: payload.hkdfSalt,
      aad: payload.aad,
      sha256: payload.sha256,
      payloadSize: payload.ciphertext.byteLength,
    });
  } catch (error) {
    await deleteChunks(code, chunks.length).catch(() => undefined);
    throw error;
  }
};

export const downloadPayload = async (session: SyncSession, code: string): Promise<ArrayBuffer> => {
  const count = session.chunkCount;
  const expectedSize = session.payloadSize;
  if (!Number.isInteger(count) || !count || count < 1 || count > Math.ceil(MAX_PAYLOAD_BYTES / SYNC_CHUNK_SIZE)) {
    throw new Error('Invalid encrypted chunk count');
  }
  if (!Number.isInteger(expectedSize) || !expectedSize) throw new Error('Invalid encrypted payload size');

  const chunks = new Array<Uint8Array>(count);
  for (let start = 0; start < count; start += BATCH_CHUNK_LIMIT) {
    const end = Math.min(count, start + BATCH_CHUNK_LIMIT);
    const snapshots = await Promise.all(
      Array.from({ length: end - start }, (_, offset) => getDoc(chunkRef(code, start + offset))),
    );
    snapshots.forEach((snapshot, offset) => {
      const expectedIndex = start + offset;
      if (!snapshot.exists()) throw new Error(`Encrypted chunk ${expectedIndex} is missing`);
      const chunk = snapshot.data() as SyncChunk;
      const bytes = chunk.bytes.toUint8Array();
      if (chunk.index !== expectedIndex || chunk.totalChunks !== count || chunk.size !== bytes.byteLength) {
        throw new Error(`Encrypted chunk ${expectedIndex} is invalid`);
      }
      chunks[expectedIndex] = bytes;
    });
  }
  return reassembleCiphertext(chunks, expectedSize);
};

export const completeSync = async (code: string): Promise<void> => {
  await updateDoc(sessionRef(code), { status: 'completed', completedAt: Timestamp.now() });
};

export const cleanupSession = async (code: string, session: SyncSession): Promise<void> => {
  if (session.chunkCount) await deleteChunks(code, session.chunkCount);
  if (session.receiverUid) {
    await deleteDoc(doc(collection(sessionRef(code), 'requests'), session.receiverUid)).catch(() => undefined);
  }
  await deleteDoc(sessionRef(code)).catch(() => undefined);
};

export const cancelSyncSession = async (code: string): Promise<void> => {
  const snapshot = await getDoc(sessionRef(code));
  if (!snapshot.exists()) return;
  const session = snapshot.data() as SyncSession;
  await updateDoc(sessionRef(code), { status: 'cancelled', transferExpiresAt: Timestamp.now() });
  if (session.chunkCount) await deleteChunks(code, session.chunkCount);
};

export const cancelSyncRequest = async (code: string): Promise<void> => {
  const user = await ensureAnonymousUser();
  await deleteDoc(doc(collection(sessionRef(code), 'requests'), user.uid));
};

export const describeCurrentDevice = (): string => {
  const platform = navigator.platform || 'Web';
  const browser = /Edg\//.test(navigator.userAgent) ? 'Edge'
    : /Chrome\//.test(navigator.userAgent) ? 'Chrome'
      : /Firefox\//.test(navigator.userAgent) ? 'Firefox'
        : /Safari\//.test(navigator.userAgent) ? 'Safari' : 'Browser';
  return `${browser} · ${platform}`;
};
