import crypto from 'crypto';

import { apiVersion as API_VERSION } from '../version.json';

/** Base URL for the containerised app */
export const APP_BASE_URL = 'http://localhost:3334';

/** MinIO internal endpoint as configured in the app container */
const MINIO_INTERNAL_ENDPOINT = 'http://minio:9000';

/** MinIO endpoint as accessible from the test runner host */
const MINIO_HOST_ENDPOINT = 'http://localhost:9010';

/** API key matching the hardcoded value in docker-compose.e2e.yml */
export const API_KEY = 'test-api-key-e2e';

/** API version from version.json, used for URL paths */
export { API_VERSION };

/**
 * Rewrites a URI returned by the API to be resolvable from the host machine.
 *
 * The app container generates URIs using its internal Docker network endpoint
 * (http://minio:9000). The test runner on the host cannot resolve 'minio',
 * so this function replaces the internal endpoint with the host-mapped port.
 */
export function resolveUri(uri: string): string {
    return uri.replace(MINIO_INTERNAL_ENDPOINT, MINIO_HOST_ENDPOINT);
}

type MultibaseDigestModule = typeof import('@uncefact/untp-utils/multibase-digest');

// @uncefact/untp-utils ships ESM only. ts-jest (and `tsc` with `module: "commonjs"`)
// downlevels `await import()` to `Promise.resolve(require())`, which fails on
// ESM-only packages. Routing the call through a Function constructor hides the
// `import()` from the TypeScript compiler so it survives to runtime as a true
// dynamic ESM import. Remove this shim once the build emits native ESM (or
// `module: "nodenext"` with ts-jest preserving dynamic `import()`); at that point
// `await import('...')` works directly.
const importEsm = new Function('specifier', 'return import(specifier)') as <T>(specifier: string) => Promise<T>;

/**
 * Computes a multibase-encoded multihash of the input, matching the format used
 * by CryptographyService (sha2-256, base58btc).
 *
 * @see https://github.com/multiformats/multihash Multihash specification
 * @see https://github.com/multiformats/multibase Multibase specification
 */
export async function computeHash(input: string | Buffer): Promise<string> {
    const { MultibaseDigest } = await importEsm<MultibaseDigestModule>('@uncefact/untp-utils/multibase-digest');
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
    const digest = await MultibaseDigest.fromData(bytes, { algorithm: 'sha2-256', base: 'base58btc' });
    return digest.toString();
}

/** Represents the encrypted envelope structure stored by the private API. */
export interface EncryptedEnvelope {
    cipherText: string;
    iv: string;
    tag: string;
    type: string;
    contentType: string;
}

/**
 * Decrypts an encrypted envelope using AES-256-GCM.
 *
 * This reverses the encryption performed by CryptographyService.encryptString().
 * The decryption key is returned by the private API endpoint.
 */
export function decryptEnvelope(envelope: EncryptedEnvelope, decryptionKey: string): string {
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(decryptionKey, 'hex'),
        Buffer.from(envelope.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
    let decrypted = decipher.update(envelope.cipherText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
