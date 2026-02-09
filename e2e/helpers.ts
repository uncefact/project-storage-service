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

/**
 * Computes a SHA-256 hash of the input, matching the format used by CryptographyService.
 */
export function computeHash(input: string | Buffer): string {
    return crypto.createHash('sha256').update(input).digest('hex');
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
