export * from './crypto';

/**
 * Hash algorithms accepted by {@link ICryptographyService.computeDigestMultibase}. String
 * values match the multihash codec names used by `@uncefact/untp-utils`.
 * Extend when upstream adds support for new algorithms.
 */
export enum HashAlgorithm {
    SHA256 = 'sha2-256',
    SHA512 = 'sha2-512',
}

/**
 * Multibase encodings accepted by {@link ICryptographyService.computeDigestMultibase}.
 * String values match the multibase codec names used by `@uncefact/untp-utils`.
 * Extend when upstream adds support for new encodings.
 */
export enum MultibaseEncoding {
    BASE58_BTC = 'base58btc',
    BASE_64 = 'base64',
}

export enum EncryptionAlgorithm {
    AES_256_GCM = 'aes-256-gcm',
}

export const keyLengthMap = {
    [EncryptionAlgorithm.AES_256_GCM]: 32,
};

export const tagLengthMap = {
    [EncryptionAlgorithm.AES_256_GCM]: 16,
};

export const ivLengthMap = {
    [EncryptionAlgorithm.AES_256_GCM]: 12,
};

export interface IEncryptionResult {
    cipherText: string; // Base64 encoded
    iv: string; // Base64 encoded
    tag: string; // Base64 encoded
    type: EncryptionAlgorithm;
}

export interface IComputeDigestMultibaseOptions {
    algorithm?: HashAlgorithm;
    base?: MultibaseEncoding;
}

export interface ICryptographyService {
    /**
     * Computes a multibase-encoded multihash of the input. The returned string
     * self-describes the hash algorithm (via the multihash prefix) and the
     * text encoding (via the multibase prefix character), so callers and
     * verifiers do not need out-of-band metadata to recover them.
     *
     * @param input The string or Buffer to hash.
     * @param options Optional algorithm and multibase encoding. Defaults to
     *   `sha2-256` and `base58btc`.
     * @returns The multibase-encoded multihash as a string.
     * @throws Rejects if the ESM multibase-digest module fails to load, or if
     *   the underlying `@uncefact/untp-utils` helper rejects the algorithm or
     *   base. Implementations are expected to surface the upstream error.
     * @see https://github.com/multiformats/multihash Multihash specification
     * @see https://github.com/multiformats/multibase Multibase specification
     */
    computeDigestMultibase(input: string | Buffer, options?: IComputeDigestMultibaseOptions): Promise<string>;

    /**
     * Generates a cryptographic key.
     * This key is intended for use with the encryptString method.
     * @param algorithm The encryption algorithm to generate a key for (default: AES-256-GCM).
     * @returns The generated key as a hexadecimal string.
     */
    generateEncryptionKey(algorithm?: EncryptionAlgorithm): Promise<string>;

    /**
     * Encrypts a given string using a cryptographic key.
     * @param input The string to encrypt.
     * @param key The cryptographic key for encryption (hexadecimal string).
     * @param algorithm The encryption algorithm to use (default: AES-256-GCM).
     * @returns An object implementing IEncryptionResult containing the encrypted data.
     * @throws Error if the key length is invalid for the specified algorithm.
     */
    encryptString(input: string, key: string, algorithm?: EncryptionAlgorithm): IEncryptionResult;
}
