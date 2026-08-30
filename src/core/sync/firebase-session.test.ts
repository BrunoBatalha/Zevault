// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { reassembleCiphertext, splitCiphertext, SYNC_CHUNK_SIZE } from './firebase-session';

describe('Firestore encrypted chunks', () => {
  it('divide e remonta o ciphertext preservando todos os bytes e a ordem', () => {
    const original = new Uint8Array(SYNC_CHUNK_SIZE * 2 + 17);
    original.forEach((_, index) => { original[index] = index % 251; });

    const chunks = splitCiphertext(original);
    const reassembled = new Uint8Array(reassembleCiphertext(chunks, original.byteLength));

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(SYNC_CHUNK_SIZE);
    expect(chunks[2]).toHaveLength(17);
    expect(Buffer.from(reassembled).equals(Buffer.from(original))).toBe(true);
  });

  it('rejeita chunks incompletos ou maiores do que o tamanho declarado', () => {
    expect(() => reassembleCiphertext([new Uint8Array([1, 2])], 3)).toThrow('incomplete');
    expect(() => reassembleCiphertext([new Uint8Array([1, 2, 3])], 2)).toThrow('exceed');
  });
});
