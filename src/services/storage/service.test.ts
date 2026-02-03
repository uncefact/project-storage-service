describe('initialiseStorageService', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.doMock('./local', () => ({
            LocalStorageService: jest.fn().mockImplementation(() => ({
                uploadFile: jest.fn(),
            })),
        }));
        jest.doMock('./gcp', () => ({
            GCPStorageService: jest.fn().mockImplementation(() => ({
                uploadFile: jest.fn(),
            })),
        }));
        jest.doMock('./aws', () => ({
            AWSStorageService: jest.fn().mockImplementation(() => ({
                uploadFile: jest.fn(),
            })),
        }));
    });

    it('should return a LocalStorageService instance when the STORAGE_TYPE is local', () => {
        jest.doMock('../../config', () => {
            return {
                __esModule: true,
                STORAGE_TYPE: 'local',
            };
        });
        const { LocalStorageService } = require('./local');
        return import('../../config').then(() => {
            const initialiseStorageService = require('./service').initialiseStorageService;
            initialiseStorageService();

            expect(LocalStorageService).toHaveBeenCalledTimes(1);
        });
    });

    it('should return a GCPStorageService instance when the STORAGE_TYPE is gcp', () => {
        jest.doMock('../../config', () => {
            return {
                __esModule: true,
                STORAGE_TYPE: 'gcp',
            };
        });
        const { GCPStorageService } = require('./gcp');
        return import('../../config').then(() => {
            const initialiseStorageService = require('./service').initialiseStorageService;
            initialiseStorageService();

            expect(GCPStorageService).toHaveBeenCalledTimes(1);
        });
    });

    it('should return an AWSStorageService instance when the STORAGE_TYPE is aws', () => {
        jest.doMock('../../config', () => {
            return {
                __esModule: true,
                STORAGE_TYPE: 'aws',
            };
        });
        const { AWSStorageService } = require('./aws');
        return import('../../config').then(() => {
            const initialiseStorageService = require('./service').initialiseStorageService;
            initialiseStorageService();

            expect(AWSStorageService).toHaveBeenCalledTimes(1);
        });
    });

    it('should throw an error when the STORAGE_TYPE is invalid', () => {
        jest.doMock('../../config', () => {
            return {
                __esModule: true,
                STORAGE_TYPE: 'invalid',
            };
        });
        return import('../../config').then(() => {
            const initialiseStorageService = require('./service').initialiseStorageService;
            expect(() => {
                initialiseStorageService();
            }).toThrow('Invalid storage type');
        });
    });

});
