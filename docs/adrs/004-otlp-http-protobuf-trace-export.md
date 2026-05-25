# ADR: Support OTLP/HTTP trace export alongside gRPC, selected by protocol

- **Date:** 2026-05-25
- **Status:** proposed
- **Superseded by:** _(none)_

## Context

Version 4.0.0 added opt-in OpenTelemetry tracing. The SDK starts only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set, and as shipped it exported traces over OTLP/gRPC (conventionally port 4317).

The centralised observability collector the service is expected to export to accepts traces over OTLP/HTTP only (conventionally port 4318); it exposes no gRPC receiver. That collector is also fronted by a reverse proxy that terminates mutual TLS and derives the caller's identity from the client certificate it presents. So the service must be able to export over OTLP/HTTP, and whichever transport it uses, it must present a TLS client certificate and trust the collector's certificate.

At the same time, OTLP/gRPC export is a documented capability of 4.0.0. Removing it would break any deployment that enabled gRPC export: the SDK would still start (the opt-in gate is unchanged) but would attempt protobuf-over-HTTP against a gRPC receiver and drop every span, with no startup-time failure to signal the misconfiguration. The change therefore needs to add HTTP support without regressing existing gRPC deployments.

## Decision

Support both transports and select between them at runtime using the standard `OTEL_EXPORTER_OTLP_PROTOCOL` environment variable:

- `grpc` exports over OTLP/gRPC.
- `http/protobuf` exports over OTLP/HTTP with protobuf encoding.

When `OTEL_EXPORTER_OTLP_PROTOCOL` is unset, the transport defaults to **gRPC**. This preserves 4.0.0 behaviour exactly, so existing gRPC deployments keep exporting with no configuration change, and the change ships as a non-breaking feature. A deployment that targets the HTTP-only collector sets `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`.

Protocol parsing lives in a small pure function (`src/lib/observability/protocol.ts`) so the decision is unit-testable in isolation from the SDK bootstrap. Matching is case-insensitive and whitespace-trimmed. A non-empty value that matches no supported transport (for example `http/json`, whose exporter this service does not ship, or a typo) falls back to the gRPC default and is reported with a warning rather than silently downgraded.

The chosen exporter is constructed with no explicit options. Both the gRPC and HTTP exporters read the standard `OTEL_EXPORTER_OTLP_*` environment variables themselves: the endpoint from `OTEL_EXPORTER_OTLP_ENDPOINT` (the HTTP exporter additionally appends `/v1/traces`), and TLS material from `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE`, `OTEL_EXPORTER_OTLP_CLIENT_KEY`, and `OTEL_EXPORTER_OTLP_CERTIFICATE`. Mutual TLS is therefore handled by the exporter library for either transport and supplied entirely through deployment configuration.

The opt-in gate is unchanged: the SDK still starts only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set, so deployments that have not adopted observability are unaffected.

## Consequences

- A collector that accepts only OTLP/HTTP and enforces mutual TLS is reachable by setting `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`, an `https://` endpoint, and the three certificate paths. The exporter library handles the mTLS handshake and the request path; no transport or TLS wiring lives in the service code.
- Existing gRPC deployments are unaffected. The default transport stays gRPC, so no operator who enabled tracing in 4.0.0 has to change anything, and the release is not breaking.
- The service now carries both exporter dependencies and a runtime branch between them. This is a small, well-bounded cost: the branch is one pure function with full unit coverage, and the second dependency is already present transitively via `@opentelemetry/sdk-node`.
- The default transport diverges from the OpenTelemetry specification's own default for `OTEL_EXPORTER_OTLP_PROTOCOL` (`http/protobuf`). Backward compatibility with 4.0.0 was judged more important than matching the spec default, and the divergence is documented for operators.

## Alternatives Considered

- **Switch to OTLP/HTTP only and remove gRPC.** Rejected. It breaks any deployment that enabled gRPC export in 4.0.0: the endpoint's expected protocol and port change under an unchanged variable name, so spans are dropped with no startup-time failure until the operator repoints. Supporting both avoids the regression for the cost of one runtime branch.
- **Support both, but default to `http/protobuf` to match the OpenTelemetry spec default.** Rejected. It carries the same silent regression as removing gRPC, because the default path changes for existing gRPC deployments. Defaulting to gRPC keeps 4.0.0 behaviour and still lets HTTP deployments opt in with one variable.
- **Add OTLP/HTTP with JSON encoding (`http/json`) as well.** Rejected for now. The target collector accepts protobuf, protobuf is the OpenTelemetry-recommended HTTP encoding and is more compact on the wire, and shipping a third exporter dependency for a transport nothing needs is unjustified. The resolver reports `http/json` as unsupported rather than pretending to honour it, and adding it later is an additive change if a real need arises.
- **Pass the endpoint URL explicitly to the exporter constructor.** Rejected. For the HTTP exporter an explicit `url` is used verbatim and skips the `/v1/traces` path the exporter otherwise appends, silently routing spans to the wrong path. Delegating endpoint resolution to the standard environment variable fixes the path handling and lets the same env-var mechanism supply the TLS material for both transports, keeping certificate handling out of the service code.

## References

- Relates to the OpenTelemetry tracing integration introduced in 4.0.0.
- OpenTelemetry OTLP exporter configuration (`OTEL_EXPORTER_OTLP_PROTOCOL`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_CERTIFICATE`, `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE`, `OTEL_EXPORTER_OTLP_CLIENT_KEY`).
