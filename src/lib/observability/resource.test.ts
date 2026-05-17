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
        delete process.env.OTEL_SERVICE_NAME;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('falls back to "storage-service" when OTEL_SERVICE_NAME is unset', () => {
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_SERVICE_NAME]).toBe('storage-service');
    });

    it('treats an empty OTEL_SERVICE_NAME as unset', () => {
        process.env.OTEL_SERVICE_NAME = '';
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_SERVICE_NAME]).toBe('storage-service');
    });

    it('treats a whitespace-only OTEL_SERVICE_NAME as unset', () => {
        process.env.OTEL_SERVICE_NAME = '   ';
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_SERVICE_NAME]).toBe('storage-service');
    });

    it('uses OTEL_SERVICE_NAME from the process environment when set', () => {
        process.env.OTEL_SERVICE_NAME = 'storage-staging';
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_SERVICE_NAME]).toBe('storage-staging');
    });

    it('honours an explicit serviceName option over the env var', () => {
        process.env.OTEL_SERVICE_NAME = 'storage-staging';
        const attrs = buildResource({ serviceName: 'storage-explicit' }).attributes;
        expect(attrs[ATTR_SERVICE_NAME]).toBe('storage-explicit');
    });

    it('reads service.version from package.json by default', () => {
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_SERVICE_VERSION]).toBe(pkg.version);
    });

    it('honours an explicit serviceVersion override', () => {
        const attrs = buildResource({ serviceVersion: '9.9.9-test' }).attributes;
        expect(attrs[ATTR_SERVICE_VERSION]).toBe('9.9.9-test');
    });

    it('falls back to "development" when DEPLOYMENT_ENVIRONMENT is unset', () => {
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('development');
    });

    it('treats an empty DEPLOYMENT_ENVIRONMENT as unset', () => {
        process.env.DEPLOYMENT_ENVIRONMENT = '';
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('development');
    });

    it('treats a whitespace-only DEPLOYMENT_ENVIRONMENT as unset', () => {
        process.env.DEPLOYMENT_ENVIRONMENT = '   ';
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('development');
    });

    it('uses DEPLOYMENT_ENVIRONMENT from the process environment when set', () => {
        process.env.DEPLOYMENT_ENVIRONMENT = 'production';
        const attrs = buildResource().attributes;
        expect(attrs[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('production');
    });

    it('honours an explicit deploymentEnvironment option over the env var', () => {
        process.env.DEPLOYMENT_ENVIRONMENT = 'production';
        const attrs = buildResource({ deploymentEnvironment: 'development' }).attributes;
        expect(attrs[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('development');
    });

    it('falls back to the env var when the option is empty', () => {
        process.env.DEPLOYMENT_ENVIRONMENT = 'production';
        const attrs = buildResource({ deploymentEnvironment: '   ' }).attributes;
        expect(attrs[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('production');
    });
});
