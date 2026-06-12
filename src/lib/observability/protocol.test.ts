import { DEFAULT_OTLP_PROTOCOL, resolveOtlpProtocol } from './protocol';

describe('resolveOtlpProtocol', () => {
    it('defaults to gRPC when unset', () => {
        expect(resolveOtlpProtocol(undefined)).toEqual({ protocol: 'grpc', unrecognised: false });
    });

    it('defaults to gRPC for an empty value', () => {
        expect(resolveOtlpProtocol('')).toEqual({ protocol: 'grpc', unrecognised: false });
    });

    it('defaults to gRPC for a whitespace-only value', () => {
        expect(resolveOtlpProtocol('   ')).toEqual({ protocol: 'grpc', unrecognised: false });
    });

    it('resolves an explicit grpc value', () => {
        expect(resolveOtlpProtocol('grpc')).toEqual({ protocol: 'grpc', unrecognised: false });
    });

    it('resolves grpc regardless of case and surrounding whitespace', () => {
        expect(resolveOtlpProtocol('  GRPC  ')).toEqual({ protocol: 'grpc', unrecognised: false });
    });

    it('resolves http/protobuf', () => {
        expect(resolveOtlpProtocol('http/protobuf')).toEqual({
            protocol: 'http/protobuf',
            unrecognised: false,
        });
    });

    it('ignores surrounding whitespace', () => {
        expect(resolveOtlpProtocol('  http/protobuf  ')).toEqual({
            protocol: 'http/protobuf',
            unrecognised: false,
        });
    });

    it('matches case-insensitively', () => {
        expect(resolveOtlpProtocol('HTTP/PROTOBUF')).toEqual({
            protocol: 'http/protobuf',
            unrecognised: false,
        });
    });

    it('flags an unrecognised value and falls back to the default', () => {
        // http/json is a valid OTLP protocol but this service does not ship its
        // exporter, so it must be reported rather than silently downgraded.
        expect(resolveOtlpProtocol('http/json')).toEqual({
            protocol: DEFAULT_OTLP_PROTOCOL,
            unrecognised: true,
        });
    });

    it('flags a typo and falls back to the default', () => {
        expect(resolveOtlpProtocol('htp/protobuf')).toEqual({
            protocol: DEFAULT_OTLP_PROTOCOL,
            unrecognised: true,
        });
    });
});
