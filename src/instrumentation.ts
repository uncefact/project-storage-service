/**
 * OpenTelemetry SDK initialiser. Opt-in: the SDK only starts when an OTLP
 * endpoint (`OTEL_EXPORTER_OTLP_ENDPOINT` or the traces-specific
 * `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`) is set in the environment. When neither
 * is set the service runs as before, so deployments that have not yet adopted
 * observability are unaffected.
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
import { OTLPTraceExporter as OTLPGrpcTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPTraceExporter as OTLPHttpTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import type { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { NodeSDK } from '@opentelemetry/sdk-node';

import { buildResource } from './lib/observability/resource';
import { resolveOtlpProtocol } from './lib/observability/protocol';

// Start when either the general endpoint or the traces-specific endpoint is
// configured. The exporter itself resolves which one to use (signal-specific
// takes precedence); the gate only needs to detect that tracing was configured
// at all, so that setting only `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` still starts
// the SDK.
const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() || process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?.trim();

if (endpoint) {
    // The service only emits traces, but `NodeSDK` will silently spin up an
    // OTLP metrics exporter and an OTLP logs exporter when `OTEL_*_EXPORTER`
    // are unset (or, equivalently for NodeSDK, set to an empty string, which
    // is what templated deployments such as Kubernetes manifests often pass
    // through). Our trace default of `grpc` lives in `resolveOtlpProtocol`
    // (a code default, not an env var), so when `OTEL_EXPORTER_OTLP_PROTOCOL`
    // is also unset the SDK falls back to the spec default `http/protobuf`
    // for metrics and logs and they fail every export against a gRPC-only
    // collector with `Parse Error: Expected HTTP/`. Default the two signals
    // to `none` here when the operator has not given a real value, so the
    // SDK only starts the trace pipeline; operators who want metrics or logs
    // set the matching env var to `otlp` explicitly.
    if (!process.env.OTEL_METRICS_EXPORTER?.trim()) {
        process.env.OTEL_METRICS_EXPORTER = 'none';
    }
    if (!process.env.OTEL_LOGS_EXPORTER?.trim()) {
        process.env.OTEL_LOGS_EXPORTER = 'none';
    }

    const { protocol, unrecognised } = resolveOtlpProtocol(process.env.OTEL_EXPORTER_OTLP_PROTOCOL);

    if (unrecognised) {
        // Use `console`, not the app's pino logger, on purpose. This module runs
        // before `sdk.start()` registers OpenTelemetry's require-hook, and pino
        // is auto-instrumented (it injects trace context into log lines).
        // Importing the logger here would load pino into the module cache before
        // that hook exists, so OTel could never patch it and logs would silently
        // lose trace correlation. The shutdown handler below uses `console` for
        // the same reason.
        // eslint-disable-next-line no-console
        console.warn(
            `Unsupported OTEL_EXPORTER_OTLP_PROTOCOL "${process.env.OTEL_EXPORTER_OTLP_PROTOCOL}"; ` +
                `falling back to "${protocol}". Supported values: grpc, http/protobuf.`,
        );
    }

    // Both exporters are constructed without options on purpose: each reads the
    // standard `OTEL_EXPORTER_OTLP_*` env vars itself, including the endpoint and
    // the TLS material for an mTLS-fronted collector. For the HTTP exporter an
    // explicit `url` would be used verbatim and skip the `/v1/traces` path it
    // otherwise appends, so we let it resolve the endpoint from the environment.
    const traceExporter: SpanExporter =
        protocol === 'http/protobuf' ? new OTLPHttpTraceExporter() : new OTLPGrpcTraceExporter();

    const sdk = new NodeSDK({
        resource: buildResource(),
        traceExporter,
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
