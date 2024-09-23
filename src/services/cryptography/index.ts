export * from './crypto';

export enum HashAlgorithm {
    SHA_256 = 'sha256',
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

export interface ICryptographyService {
    /**
     * Generates a hash from a given string.
     * @param input The string to hash.
     * @param algorithm The hash algorithm to use (default: SHA-256).
     * @returns The hash of the input string.
     */
    computeHash(input: string, algorithm?: HashAlgorithm): string;

    /**
     * Generates a cryptographic key.
     * This key is intended for use with the encryptString method.
     * @param algorithm The encryption algorithm to generate a key for (default: AES-256-GCM).
     * @returns The generated key as a hexadecimal string.
     */
    generateEncryptionKey(algorithm?: EncryptionAlgorithm): string;

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
