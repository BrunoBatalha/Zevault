// @vitest-environment node
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { Bytes, collection, deleteDoc, doc, getDoc, getDocs, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = 'demo-zevault';
let environment: RulesTestEnvironment;

const waitingSession = (ownerUid: string) => ({
  protocolVersion: 1,
  status: 'waiting',
  ownerUid,
  ownerPublicKey: { kty: 'EC', crv: 'P-256', x: 'x', y: 'y' },
  createdAt: Timestamp.now(),
  joinExpiresAt: Timestamp.fromMillis(Date.now() + 110_000),
  transferExpiresAt: Timestamp.fromMillis(Date.now() + 110_000),
});

beforeAll(async () => {
  environment = await initializeTestEnvironment({ projectId });
});

beforeEach(async () => {
  await environment.clearFirestore();
});

afterAll(async () => {
  await environment.cleanup();
});

describe('sync session rules', () => {
  it('permite criação pelo dono, nega listagem e nega alteração por terceiro', async () => {
    const ownerDb = environment.authenticatedContext('owner').firestore();
    const outsiderDb = environment.authenticatedContext('outsider').firestore();
    await assertSucceeds(setDoc(doc(ownerDb, 'syncSessions', 'ABC234'), waitingSession('owner')));
    await assertFails(getDocs(collection(outsiderDb, 'syncSessions')));
    await assertSucceeds(getDoc(doc(outsiderDb, 'syncSessions', 'ABC234')));
    await assertSucceeds(getDoc(doc(outsiderDb, 'syncSessions', 'MISSING')));
    await assertFails(updateDoc(doc(outsiderDb, 'syncSessions', 'ABC234'), { status: 'cancelled' }));
  });

  it('permite solicitação própria e conclusão somente pelo receptor confirmado', async () => {
    const ownerDb = environment.authenticatedContext('owner').firestore();
    const receiverDb = environment.authenticatedContext('receiver').firestore();
    await setDoc(doc(ownerDb, 'syncSessions', 'ABC234'), waitingSession('owner'));
    await assertSucceeds(setDoc(doc(receiverDb, 'syncSessions/ABC234/requests/receiver'), {
      uid: 'receiver', publicKey: { kty: 'EC', crv: 'P-256', x: 'rx', y: 'ry' },
      deviceLabel: 'Chrome', createdAt: Timestamp.now(),
    }));
    await assertSucceeds(updateDoc(doc(ownerDb, 'syncSessions', 'ABC234'), {
      status: 'approved', receiverUid: 'receiver',
      receiverPublicKey: { kty: 'EC', crv: 'P-256', x: 'rx', y: 'ry' },
      transferExpiresAt: Timestamp.fromMillis(Date.now() + 590_000),
    }));
    await assertFails(updateDoc(doc(receiverDb, 'syncSessions', 'ABC234'), { status: 'completed' }));
    await updateDoc(doc(ownerDb, 'syncSessions', 'ABC234'), {
      status: 'payload_ready', chunkCount: 1, chunkSize: 716800, payloadSize: 3,
    });
    await assertSucceeds(updateDoc(doc(receiverDb, 'syncSessions', 'ABC234'), {
      status: 'completed', completedAt: Timestamp.now(),
    }));
    const outsiderDb = environment.authenticatedContext('outsider').firestore();
    await assertFails(deleteDoc(doc(outsiderDb, 'syncSessions', 'ABC234')));
    await assertSucceeds(deleteDoc(doc(receiverDb, 'syncSessions', 'ABC234')));
  });
});

describe('encrypted chunk rules', () => {
  it('restringe escrita, leitura e exclusão aos participantes e estados corretos', async () => {
    const expiresAt = Timestamp.fromMillis(Date.now() + 590_000);
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'syncSessions', 'ABC234'), {
        ...waitingSession('owner'), status: 'approved', receiverUid: 'receiver',
        transferExpiresAt: expiresAt,
      });
    });
    const ownerDb = environment.authenticatedContext('owner').firestore();
    const receiverDb = environment.authenticatedContext('receiver').firestore();
    const outsiderDb = environment.authenticatedContext('outsider').firestore();
    const path = 'syncSessions/ABC234/syncChunks/000000';
    const chunk = { index: 0, totalChunks: 1, size: 3, bytes: Bytes.fromUint8Array(new Uint8Array([1, 2, 3])), expiresAt };
    await assertSucceeds(setDoc(doc(ownerDb, path), chunk));
    await assertFails(getDoc(doc(receiverDb, path)));
    await assertFails(getDoc(doc(outsiderDb, path)));
    await updateDoc(doc(ownerDb, 'syncSessions', 'ABC234'), {
      status: 'payload_ready', chunkCount: 1, chunkSize: 716800, payloadSize: 3,
    });
    await assertSucceeds(getDoc(doc(receiverDb, path)));
    await assertFails(deleteDoc(doc(receiverDb, path)));
    await updateDoc(doc(receiverDb, 'syncSessions', 'ABC234'), { status: 'completed', completedAt: Timestamp.now() });
    await assertSucceeds(deleteDoc(doc(receiverDb, path)));
  });
});
