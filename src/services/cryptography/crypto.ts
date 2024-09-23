import crypto from 'crypto';
import { HashAlgorithm, EncryptionAlgorithm, ICryptographyService, ivLengthMap, keyLengthMap } from './index';

/**
 * Service for cryptography operations.
 */
export class CryptographyService implements ICryptographyService {
    /**
     * Computes the hash of the input string.
     * @param {string} input - The input string to compute the hash for.
     * @param {HashAlgorithm} [algorithm=HashAlgorithm.SHA_256] - The hash algorithm to use.
     * @returns {string} The computed hash as a hexadecimal string.
     */
    computeHash(input: string, algorithm: HashAlgorithm = HashAlgorithm.SHA_256) {
        const hash = crypto.createHash(algorithm).update(input).digest('hex');

        return hash;
    }

    /**
     * Generates an encryption key for the specified algorithm.
     * @param {EncryptionAlgorithm} [algorithm=EncryptionAlgorithm.AES_256_GCM] - The encryption algorithm to generate the key for.
     * @returns {string} The generated encryption key as a hexadecimal string.
     */
    generateEncryptionKey(algorithm: EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM) {
        const encryptionKey = crypto.randomBytes(keyLengthMap[algorithm]).toString('hex');

        return encryptionKey;
    }

    /**
     * Encrypts a string using the provided key with the specified encryption algorithm.
     * @param {string} input - The string to encrypt.
     * @param {string} key - The encryption key to use (hexadecimal string).
     * @param {EncryptionAlgorithm} [algorithm=EncryptionAlgorithm.AES_256_GCM] - The encryption algorithm to use.
     * @returns {IEncryptionResult} An object containing the encrypted data:
     *          - cipherText: The encrypted string (Base64 encoded).
     *          - iv: The initialization vector used for encryption (Base64 encoded).
     *          - tag: The authentication tag for GCM mode (Base64 encoded).
     *          - type: The encryption algorithm used.
     * @throws {Error} If the key length is invalid for the specified algorithm.
     */
    encryptString(input: string, key: string, algorithm = EncryptionAlgorithm.AES_256_GCM) {
        if (key.length !== keyLengthMap[algorithm] * 2) {
            throw new Error(
                `Invalid key length for ${algorithm} algorithm. Expected ${keyLengthMap[algorithm] * 2} characters, got ${key.length}.`,
            );
        }

        const iv = crypto.randomBytes(ivLengthMap[algorithm]);
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);

        let cipherText = cipher.update(input, 'utf8', 'base64');
        cipherText += cipher.final('base64');

        const authTag = cipher.getAuthTag().toString('base64');

        return {
            cipherText,
            iv: iv.toString('base64'),
            tag: authTag,
            type: algorithm,
        };
    }
}
