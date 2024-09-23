import crypto from 'crypto';
import { CryptographyService } from './crypto';
import { HashAlgorithm, EncryptionAlgorithm, ivLengthMap, keyLengthMap } from './index';
import { BadRequestError } from '../../errors';

jest.mock('crypto', () => ({
    randomBytes: jest.fn(),
    createCipheriv: jest.fn(),
    createHash: jest.fn(),
}));

describe('CryptographyService', () => {
    let service: CryptographyService;

    beforeEach(() => {
        service = new CryptographyService();
        jest.clearAllMocks();
    });

    describe('computeHash', () => {
        it('should compute hash correctly', () => {
            const input = 'test';
            const expectedHash = 'hashedValue';
            (crypto.createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue(expectedHash),
            });

            const result = service.computeHash(input);

            expect(crypto.createHash).toHaveBeenCalledWith(HashAlgorithm.SHA_256);
            expect(result).toBe(expectedHash);
        });
    });

    describe('generateEncryptionKey', () => {
        it('should generate an encryption key', () => {
            const fakeRandomBytes = Buffer.from('a'.repeat(keyLengthMap[EncryptionAlgorithm.AES_256_GCM]));
            (crypto.randomBytes as jest.Mock).mockReturnValue(fakeRandomBytes);

            const result = service.generateEncryptionKey();

            expect(crypto.randomBytes).toHaveBeenCalledWith(keyLengthMap[EncryptionAlgorithm.AES_256_GCM]);
            expect(result).toBe(fakeRandomBytes.toString('hex'));
        });
    });

    describe('encryptString', () => {
        it('should encrypt a string correctly with default algorithm', () => {
            const input = 'secret';
            const key = 'a'.repeat(keyLengthMap[EncryptionAlgorithm.AES_256_GCM] * 2); // hex string
            const fakeIv = Buffer.from('iv123456789012');
            const fakeCipher = {
                update: jest.fn().mockReturnValue('encryptedPart1'),
                final: jest.fn().mockReturnValue('encryptedPart2'),
                getAuthTag: jest.fn().mockReturnValue(Buffer.from('authTag')),
            };
            (crypto.randomBytes as jest.Mock)
                .mockReturnValueOnce(fakeIv) // for IV
                .mockReturnValue(Buffer.from('authTag'));

            (crypto.createCipheriv as jest.Mock).mockReturnValue(fakeCipher);

            const result = service.encryptString(input, key);

            expect(crypto.randomBytes).toHaveBeenCalledWith(ivLengthMap[EncryptionAlgorithm.AES_256_GCM]);
            expect(crypto.createCipheriv).toHaveBeenCalledWith(
                EncryptionAlgorithm.AES_256_GCM,
                Buffer.from(key, 'hex'),
                fakeIv,
            );
            expect(fakeCipher.update).toHaveBeenCalledWith(input, 'utf8', 'base64');
            expect(fakeCipher.final).toHaveBeenCalledWith('base64');
            expect(fakeCipher.getAuthTag).toHaveBeenCalled();

            expect(result).toEqual({
                cipherText: 'encryptedPart1encryptedPart2',
                iv: fakeIv.toString('base64'),
                tag: 'YXV0aFRhZw==', // 'authTag' in base64
                type: EncryptionAlgorithm.AES_256_GCM,
            });
        });

        it('should encrypt a string correctly with specified algorithm', () => {
            const input = 'secret';
            const key = 'b'.repeat(64); // AES-256-GCM
            const algorithm = EncryptionAlgorithm.AES_256_GCM;
            const fakeIv = Buffer.from('iv123456789012');
            const fakeCipher = {
                update: jest.fn().mockReturnValue('encryptedPart1'),
                final: jest.fn().mockReturnValue('encryptedPart2'),
                getAuthTag: jest.fn().mockReturnValue(Buffer.from('authTag')),
            };
            (crypto.randomBytes as jest.Mock).mockReturnValueOnce(fakeIv).mockReturnValue(Buffer.from('authTag'));

            (crypto.createCipheriv as jest.Mock).mockReturnValue(fakeCipher);

            const result = service.encryptString(input, key, algorithm);

            expect(crypto.randomBytes).toHaveBeenCalledWith(ivLengthMap[EncryptionAlgorithm.AES_256_GCM]);
            expect(crypto.createCipheriv).toHaveBeenCalledWith(algorithm, Buffer.from(key, 'hex'), fakeIv);
            expect(fakeCipher.update).toHaveBeenCalledWith(input, 'utf8', 'base64');
            expect(fakeCipher.final).toHaveBeenCalledWith('base64');
            expect(fakeCipher.getAuthTag).toHaveBeenCalled();

            expect(result).toEqual({
                cipherText: 'encryptedPart1encryptedPart2',
                iv: fakeIv.toString('base64'),
                tag: 'YXV0aFRhZw==',
                type: algorithm,
            });
        });

        it('should throw an error for invalid key length', () => {
            const input = 'secret';
            const invalidKey = 'shortkey';
            const exceptionMessage = `Invalid key length for ${EncryptionAlgorithm.AES_256_GCM} algorithm. Expected 64 characters, got ${invalidKey.length}.`;

            expect(() => service.encryptString(input, invalidKey)).toThrow(new Error(exceptionMessage));
        });
    });
});
