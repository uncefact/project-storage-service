import { resourceFromAttributes } from '@opentelemetry/resources';
import type { Resource } from '@opentelemetry/resources';

import pkg from '../../../package.json';

// OpenTelemetry semantic-conventions attribute keys. Spelled as string literals
// rather than imported from `@opentelemetry/semantic-conventions/incubating`
// because TypeScript's classic moduleResolution does not honour package.json
// `exports` subpaths.
const ATTR_SERVICE_NAME = 'service.name';
const ATTR_SERVICE_VERSION = 'service.version';
const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = 'deployment.environment.name';

const SERVICE_NAME = 'storage-service';
const DEFAULT_ENVIRONMENT = 'local';

export interface BuildResourceOptions {
    /** Overrides `process.env.DEPLOYMENT_ENVIRONMENT`. */
    deploymentEnvironment?: string;
    /** Overrides the version read from `package.json`. */
    serviceVersion?: string;
}

/**
 * Build the OpenTelemetry {@link Resource} for the storage service.
 *
 * Resource attributes are the segregation mechanism the shared observability
 * backend uses to tenant signals, so the values here are load-bearing: a wrong
 * `service.name` or `deployment.environment.name` will silently break
 * dashboards built against the canonical labels.
 *
 * Defaults derive from `process.env.DEPLOYMENT_ENVIRONMENT` and the package's
 * own `package.json`; tests inject explicit values via {@link BuildResourceOptions}.
 * An empty or whitespace-only environment string is treated as absent so
 * misconfigured deployments that ship `DEPLOYMENT_ENVIRONMENT=` fall back to
 * the default rather than tagging telemetry with an empty environment.
 *
 * @see https://opentelemetry.io/docs/specs/semconv/resource/ Resource semantic conventions
 */
export function buildResource(options: BuildResourceOptions = {}): Resource {
    const envFromOptions = options.deploymentEnvironment?.trim();
    const envFromProcess = process.env.DEPLOYMENT_ENVIRONMENT?.trim();
    const deploymentEnvironment = envFromOptions || envFromProcess || DEFAULT_ENVIRONMENT;

    const serviceVersion = options.serviceVersion ?? pkg.version;

    return resourceFromAttributes({
        [ATTR_SERVICE_NAME]: SERVICE_NAME,
        [ATTR_SERVICE_VERSION]: serviceVersion,
        [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: deploymentEnvironment,
    });
}
