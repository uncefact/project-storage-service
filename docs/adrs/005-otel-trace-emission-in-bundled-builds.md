# ADR: Enable OpenTelemetry trace emission in the bundled production build

- **Date:** 2026-06-12
- **Status:** accepted

## Context

ADR 004 added selectable transports (OTLP/gRPC and OTLP/HTTP) for trace export. End-to-end verification of that change against a real OpenTelemetry collector surfaced two distinct problems that prevented the OpenTelemetry feature from emitting any traces in the production build:

1. **The bundled artifact defeated auto-instrumentation.** The build packs everything through webpack (`target: 'node'`, no `externals`) so `dist/index.js` inlines every npm dependency, including `express` and the OTel exporters. OpenTelemetry's auto-instrumentations rely on a require-hook (`require-in-the-middle`) that intercepts `require('express')`, `require('@aws-sdk/...')`, and the rest at call time. When those modules are inlined, the application never issues those `require` calls at runtime, so the hook never fires, and no instrumentation patches apply. Empirically, hitting `GET /health-check` on the bundled service produced zero spans even though the SDK started and the export endpoint was reachable. The OTLP exporters were also being inlined, which is wrong for the gRPC exporter because it loads a native binding.

2. **NodeSDK silently started extra signal pipelines.** When `OTEL_EXPORTER_OTLP_ENDPOINT` is set and `OTEL_METRICS_EXPORTER` / `OTEL_LOGS_EXPORTER` are unset, NodeSDK quietly stands up OTLP metric and log exporters. Their transport is resolved from `OTEL_EXPORTER_OTLP_PROTOCOL`, defaulting to `http/protobuf` per the OpenTelemetry specification when the variable is unset. The service's trace default (`grpc`, set in `resolveOtlpProtocol` as a code default, not via the env var) means the protocol env var is normally unset in the deployments this service targets. Against a gRPC-only collector, every metric and log export then failed with `Parse Error: Expected HTTP/`. The service has no custom metric instruments or OTel log records, so the pipelines also produced no useful signal even when they did reach a collector.

The service is documented as a trace-emitting feature only. Neither problem was caused by ADR 004, and both predate it, but ADR 004's verification was the first end-to-end check that surfaced them.

## Decision

Two changes, both required to make the documented trace feature actually emit traces in production:

- **Externalise `node_modules` in the webpack build.** Add `webpack-node-externals` and set `externals: [nodeExternals()]`. Application code is still bundled into `dist/index.js`, but `express`, the OTel packages, and the rest stay as runtime `require()` calls resolved against the on-disk `node_modules` directory. This lets the auto-instrumentation require-hook patch each library on first load. The gRPC exporter's native binding loads against the on-disk install instead of a webpack-bundled copy. The runtime image already ships `node_modules`, so this is an internal build change with no operational impact.

- **Default `OTEL_METRICS_EXPORTER` and `OTEL_LOGS_EXPORTER` to `none` when unset.** In `src/instrumentation.ts`, inside the existing `if (endpoint)` block and before `NodeSDK` is constructed, set each variable to `none` when its current value is `undefined`. Explicit operator values are preserved (`=== undefined`, not falsiness). NodeSDK then only stands up the trace pipeline; operators who want metrics or logs opt in by setting the matching variable to `otlp` themselves. This is the service's first explicit statement of its observability scope: traces only, by default.

## Consequences

- Tracing now works as the docs describe. Real `GET /health-check` requests against the bundled service produce HTTP server spans, express middleware spans, and AWS SDK spans at the collector over both supported transports.
- `dist/index.js` shrinks dramatically (around 9.7 MB to around 91 KB at the time of writing) because the bundle is now application code only. The runtime image is the same size overall (node_modules was already there).
- The service is explicitly trace-only by default. Operators upgrading from a deployment that had nothing useful in metrics or logs anyway will see no behaviour change; operators who set `OTEL_METRICS_EXPORTER=otlp` or `OTEL_LOGS_EXPORTER=otlp` will still get the pipelines they ask for, but the signal will be whatever the auto-instrumentations contribute until application code adds custom metrics or OTel log records.
- The build now depends on `webpack-node-externals` as a devDependency. The runtime image must continue to include `node_modules`; the existing Dockerfile already does, but any future deployment artefact that strips it would lose tracing entirely.
- `process.env` is mutated inside the instrumentation module to install the defaults. This is the standard way to steer NodeSDK's env-driven exporter selection and is the same channel an operator uses; the only alternative the SDK accepts is constructing the readers programmatically, which is reasonable but less symmetric with how the trace exporter is already wired (see Alternatives).

## Alternatives Considered

- **Use a `node --require ./dist/instrumentation.js dist/index.js` pattern instead of externalising.** Rejected as the primary fix. It would require splitting the build into multiple webpack entries and changing the start script, and on its own it does not address the fundamental problem: with `express` inlined, the require-hook still cannot patch it even if `sdk.start()` runs first. Externalising the libraries is what restores the patch point; the `--require` pattern only helps with module load ordering, which is a smaller secondary concern.
- **Stop using webpack entirely and ship a `tsc` build.** Rejected for this change. It is a larger structural shift with implications for the dev workflow, the Swagger UI asset copy step, and the deployment shape, and externalising achieves the same correctness outcome without that disruption. It remains an option if the bundle stops earning its place for other reasons.
- **Allowlist specific libraries to externalise rather than all of `node_modules`.** Rejected. It would couple the build config to the exact set of OTel auto-instrumentation packages and any future ones; the whole-`node_modules` externalisation matches how the runtime image is already shaped, with no operational downside.
- **Disable metrics and logs programmatically by passing `metricReaders: []` and `logRecordProcessors: []` to `NodeSDK`.** Considered seriously. It would keep `process.env` untouched and locate the decision at the SDK construction site, which is closer in style to how the trace exporter is wired. The env-mutation approach was chosen instead because it composes with the same env vars an operator uses to opt in, so the operator override path is the symmetric inverse of the default rather than a separate code branch. Either approach delivers the same operator-facing behaviour; both are defensible. Worth revisiting if the bootstrap module grows other env-driven decisions and a single configuration object becomes clearer than scattered env defaults.
- **Leave the metric and log auto-export running and document the failures as cosmetic.** Rejected. Spending real CPU and network on exports that will never succeed against the documented gRPC default, and that carry no signal the service produces, is the worst of both worlds. Off-by-default with explicit opt-in is honest about what the service actually emits.

## References

- Relates to ADR 004 (selectable OTLP transports for traces), whose verification surfaced these issues.
- `@opentelemetry/sdk-node` env-driven exporter selection (`OTEL_METRICS_EXPORTER`, `OTEL_LOGS_EXPORTER`, `OTEL_EXPORTER_OTLP_PROTOCOL`).
- `webpack-node-externals` for externalising `node_modules` in webpack `target: 'node'` builds.
- `require-in-the-middle` (the OpenTelemetry auto-instrumentation patching mechanism).
