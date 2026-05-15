import { buildResource } from './resource';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../../package.json');

const ATTR_SERVICE_NAME = 'service.name';
const ATTR_SERVICE_VERSION = 'service.version';
const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = 'deployment.environment.name';

describe('buildResource', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.DEPLOYMENT_ENVIRONMENT;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('sets service.name to "storage-service"', () => {
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_SERVICE_NAME]).toBe('storage-service');
    });

    it('reads service.version from package.json by default', () => {
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_SERVICE_VERSION]).toBe(pkg.version);
    });

    it('honours an explicit serviceVersion override', () => {
        const attrs = buildResource({ serviceVersion: '9.9.9-test' }).attributes;
        expect(attrs[ATTR_SERVICE_VERSION]).toBe('9.9.9-test');
    });

    it('falls back to "local" when DEPLOYMENT_ENVIRONMENT is unset', () => {
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('local');
    });

    it('treats an empty DEPLOYMENT_ENVIRONMENT as unset', () => {
        process.env.DEPLOYMENT_ENVIRONMENT = '';
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('local');
    });

    it('treats a whitespace-only DEPLOYMENT_ENVIRONMENT as unset', () => {
        process.env.DEPLOYMENT_ENVIRONMENT = '   ';
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('local');
    });

    it('uses DEPLOYMENT_ENVIRONMENT from the process environment when set', () => {
        process.env.DEPLOYMENT_ENVIRONMENT = 'production';
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('production');
    });

    it('honours an explicit deploymentEnvironment option over the env var', () => {
        process.env.DEPLOYMENT_ENVIRONMENT = 'production';
        const attrs = buildResource({ deploymentEnvironment: 'staging' }).attributes;
        expect(attrs[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('staging');
    });

    it('falls back to the env var when the option is empty', () => {
        process.env.DEPLOYMENT_ENVIRONMENT = 'production';
        const attrs = buildResource({ deploymentEnvironment: '   ' }).attributes;
        expect(attrs[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('production');
    });
});
