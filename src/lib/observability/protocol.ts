/**
 * Resolution of the OTLP export transport from the `OTEL_EXPORTER_OTLP_PROTOCOL`
 * environment variable.
 *
 * The service supports two OpenTelemetry transports: OTLP/gRPC and OTLP/HTTP
 * with protobuf encoding. gRPC is the default so that deployments configured
 * before HTTP support existed keep exporting unchanged; HTTP is opted into
 * explicitly. This module owns the parsing of that choice so the decision is
 * unit-testable in isolation from the SDK bootstrap that consumes it.
 *
 * @see https://opentelemetry.io/docs/specs/otel/protocol/exporter/ OTLP exporter configuration (`OTEL_EXPORTER_OTLP_PROTOCOL`)
 */

/** The OTLP transports the service can export traces over. */
export type OtlpProtocol = 'grpc' | 'http/protobuf';

/** The transport used when `OTEL_EXPORTER_OTLP_PROTOCOL` is unset or unrecognised. */
export const DEFAULT_OTLP_PROTOCOL: OtlpProtocol = 'grpc';

export interface ResolvedOtlpProtocol {
    /** The transport to export over. Falls back to {@link DEFAULT_OTLP_PROTOCOL}. */
    readonly protocol: OtlpProtocol;
    /**
     * True when a non-empty value was supplied that matched no supported
     * transport. The caller surfaces this so a misconfiguration does not
     * silently downgrade to the default. Only ever true alongside
     * `protocol === DEFAULT_OTLP_PROTOCOL`; the unrecognised input fell back.
     */
    readonly unrecognised: boolean;
}

/**
 * Resolve the OTLP transport from a raw `OTEL_EXPORTER_OTLP_PROTOCOL` value.
 *
 * Matching is case-insensitive and ignores surrounding whitespace. Unset,
 * empty, or whitespace-only input resolves to {@link DEFAULT_OTLP_PROTOCOL}
 * with `unrecognised: false`, since "not configured" is not a misconfiguration.
 * A non-empty value that matches no supported transport (for example
 * `http/json`, which this service does not ship, or a typo) resolves to the
 * default with `unrecognised: true` so the caller can warn.
 *
 * @param raw the environment variable value, or `undefined` when unset.
 * @returns the resolved transport and whether the input was an unrecognised non-empty value.
 */
export function resolveOtlpProtocol(raw: string | undefined): ResolvedOtlpProtocol {
    const normalised = raw?.trim().toLowerCase();

    if (!normalised) {
        return { protocol: DEFAULT_OTLP_PROTOCOL, unrecognised: false };
    }

    if (normalised === 'grpc' || normalised === 'http/protobuf') {
        return { protocol: normalised, unrecognised: false };
    }

    return { protocol: DEFAULT_OTLP_PROTOCOL, unrecognised: true };
}
