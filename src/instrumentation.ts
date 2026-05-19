/**
 * OpenTelemetry SDK initialiser. Opt-in: the SDK only starts when
 * `OTEL_EXPORTER_OTLP_ENDPOINT` is set in the environment. When the variable
 * is absent the service runs as before, so deployments that have not yet
 * adopted observability are unaffected.
 *
 * This module is loaded for its side effects only. Import it once at the very
 * top of the entry path (above any `http` / `express` import) so the SDK can
 * patch module exports before they are first used:
 *
 *     import './instrumentation';
 *     import { app } from './app';
 *     // ...
 *
 * In production the entry binary can also pass `--require ./dist/instrumentation.js`
 * to Node for the same effect without changing the bundle order.
 *
 * @see ../../../README.md  Observability env vars.
 */
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { NodeSDK } from '@opentelemetry/sdk-node';

import { buildResource } from './lib/observability/resource';

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();

if (endpoint) {
    const sdk = new NodeSDK({
        resource: buildResource(),
        traceExporter: new OTLPTraceExporter({ url: endpoint }),
        // Disable fs auto-instrumentation: every internal Node/Express/AWS-SDK
        // file read becomes a span, drowning out the spans operators actually
        // care about (HTTP, S3, handler logic). Flip this back on temporarily
        // if a specific investigation needs filesystem-level traces.
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-fs': { enabled: false },
            }),
        ],
    });

    sdk.start();

    // Process must exit after the SDK flushes, otherwise lingering handles
    // (timers, sockets) hold the process up until the container manager sends
    // SIGKILL, which drops any in-flight spans. Exit explicitly with the right
    // code so containers see a clean shutdown.
    const shutdown = async () => {
        try {
            await sdk.shutdown();
            process.exit(0);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('OpenTelemetry SDK shutdown failed', err);
            process.exit(1);
        }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
