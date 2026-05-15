import { CryptographyService } from './crypto';
import { HashAlgorithm, MultibaseEncoding } from './index';

describe('CryptographyService', () => {
    const service = new CryptographyService();

    describe('computeHash', () => {
        it('produces a stable base58btc multibase-encoded multihash for known input', async () => {
            const hash = await service.computeHash('hello world');
            // base58btc-encoded sha2-256 multihash of "hello world".
            // Leading "z" is the base58btc multibase prefix.
            expect(hash).toBe('zQmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4');
        });

        it('hashes a Buffer input equivalently to the same bytes as a string', async () => {
            const stringHash = await service.computeHash('hello world');
            const bufferHash = await service.computeHash(Buffer.from('hello world'));
            expect(bufferHash).toBe(stringHash);
        });

        it('re-encodes the same digest under base64 when requested', async () => {
            const hash = await service.computeHash('hello world', {
                base: MultibaseEncoding.BASE_64,
            });
            // base64-encoded sha2-256 multihash of "hello world".
            // Leading "m" is the base64 multibase prefix.
            expect(hash).toBe('mEiC5TSe5k00+CKUuUtfafav6xITv43pTgO6QiPes4u/N6Q');
        });

        it('produces a sha2-512 digest when requested', async () => {
            const hash = await service.computeHash('hello world', {
                algorithm: HashAlgorithm.SHA512,
            });
            // base58btc-encoded sha2-512 multihash of "hello world".
            expect(hash).toBe(
                'z8Vtkv2tdQ43bNGdWN9vNx9GVS9wrbXHk4ZW8kmucPmaYJwwedXir52kti9wJhcik4HehyqgLrQ1hBuirviLhxgRBNv',
            );
        });

        it('hashes empty input', async () => {
            // base58btc-encoded sha2-256 multihash of the empty byte string.
            const hash = await service.computeHash('');
            expect(hash).toBe('zQmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n');
        });
    });
});
