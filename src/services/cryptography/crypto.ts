import {
    AesGcmEncryptionAdapter,
    EncryptionAlgorithm as PkgEncryptionAlgorithm,
} from '@uncefact/untp-ri-services/encryption';
import { LocalKeyGenerator } from '@uncefact/untp-ri-services/key-provider';
import {
    HashAlgorithm,
    MultibaseEncoding,
    EncryptionAlgorithm,
    ICryptographyService,
    IComputeHashOptions,
    IEncryptionResult,
} from './index';

type MultibaseDigestModule = typeof import('@uncefact/untp-utils/multibase-digest');

// @uncefact/untp-utils ships ESM only. ts-jest (and `tsc` with `module: "commonjs"`)
// downlevels `await import()` to `Promise.resolve(require())`, which fails on
// ESM-only packages. Routing the call through a Function constructor hides the
// `import()` from the TypeScript compiler so it survives to runtime as a true
// dynamic ESM import. Remove this shim once the build emits native ESM (or
// `module: "nodenext"` with ts-jest preserving dynamic `import()`); at that point
// `await import('...')` works directly.
const importEsm = new Function('specifier', 'return import(specifier)') as <T>(specifier: string) => Promise<T>;

// Cache the import() promise (not the resolved module) so concurrent first
// callers share a single ESM load. Cleared on rejection so a transient load
// failure does not become permanent for the process lifetime.
let digestMultibaseModulePromise: Promise<MultibaseDigestModule> | undefined;

async function loadMultibaseDigest(): Promise<MultibaseDigestModule> {
    if (!digestMultibaseModulePromise) {
        const pending = importEsm<MultibaseDigestModule>('@uncefact/untp-utils/multibase-digest');
        pending.catch((err) => {
            console.error(
                '[CryptographyService] Failed to dynamically import "@uncefact/untp-utils/multibase-digest"; the module cache will be cleared so the next call retries.',
                err,
            );
            if (digestMultibaseModulePromise === pending) {
                digestMultibaseModulePromise = undefined;
            }
        });
        digestMultibaseModulePromise = pending;
    }
    return digestMultibaseModulePromise;
}

/**
 * Cryptography service that delegates hashing to @uncefact/untp-utils and
 * encryption to @uncefact/untp-ri-services. Hash output is a multibase-encoded
 * multihash: the bytes self-describe the algorithm (multihash prefix) and the
 * string self-describes its text encoding (multibase prefix character).
 *
 * @see https://github.com/multiformats/multihash Multihash specification
 * @see https://github.com/multiformats/multibase Multibase specification
 */
export class CryptographyService implements ICryptographyService {
    async computeHash(input: string | Buffer, options: IComputeHashOptions = {}): Promise<string> {
        const algorithm = options.algorithm ?? HashAlgorithm.SHA256;
        const base = options.base ?? MultibaseEncoding.BASE58_BTC;
        const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
        const { MultibaseDigest } = await loadMultibaseDigest();
        try {
            const digest = await MultibaseDigest.fromData(bytes, { algorithm, base });
            return digest.toString();
        } catch (err) {
            console.error(
                `[CryptographyService.computeHash] MultibaseDigest.fromData failed (algorithm=${algorithm}, base=${base}, bytes=${bytes.byteLength}).`,
                err,
            );
            throw err;
        }
    }

    async generateEncryptionKey(_algorithm: EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM): Promise<string> {
        const { plaintextKey } = await new LocalKeyGenerator().generateKey();
        return plaintextKey;
    }

    encryptString(
        input: string,
        key: string,
        _algorithm: EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM,
    ): IEncryptionResult {
        return new AesGcmEncryptionAdapter(key).encrypt(input, PkgEncryptionAlgorithm.AES_256_GCM);
    }
}
