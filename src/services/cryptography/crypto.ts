import {
    computeHash as pkgComputeHash,
    AesGcmEncryptionAdapter,
    EncryptionAlgorithm as PkgEncryptionAlgorithm,
} from '@uncefact/untp-ri-services/encryption';
import { LocalKeyGenerator } from '@uncefact/untp-ri-services/key-provider';
import { HashAlgorithm, EncryptionAlgorithm, ICryptographyService, IEncryptionResult } from './index';

/**
 * Cryptography service that delegates to @uncefact/untp-ri-services.
 */
export class CryptographyService implements ICryptographyService {
    computeHash(input: string | Buffer, _algorithm: HashAlgorithm = HashAlgorithm.SHA_256): string {
        return pkgComputeHash(input);
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
