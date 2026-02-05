import { isValidUUID, buildBaseUrl } from './utils';

describe('isValidUUID', () => {
    it('should return true for valid UUIDs', () => {
        expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
        expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should return false for invalid UUIDs', () => {
        expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false); // missing a character
        expect(isValidUUID('123e4567-e89b-12d3-a456-4266141740000')).toBe(false); // extra character
        expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400z')).toBe(false); // invalid character
        expect(isValidUUID('g23e4567-e89b-12d3-a456-426614174000')).toBe(false); // invalid character
        expect(isValidUUID('')).toBe(false);
    });
});

describe('buildBaseUrl', () => {
    it('should include non-standard port', () => {
        expect(buildBaseUrl('http', 'localhost', 3333)).toBe('http://localhost:3333');
    });

    it('should omit port 443 for HTTPS', () => {
        expect(buildBaseUrl('https', 'api.example.com', 443)).toBe('https://api.example.com');
    });

    it('should omit port 80 for HTTP', () => {
        expect(buildBaseUrl('http', 'example.com', 80)).toBe('http://example.com');
    });

    it('should handle string port values', () => {
        expect(buildBaseUrl('https', 'api.example.com', '443')).toBe('https://api.example.com');
        expect(buildBaseUrl('http', 'localhost', '8080')).toBe('http://localhost:8080');
    });

    it('should not omit port 443 for HTTP', () => {
        expect(buildBaseUrl('http', 'example.com', 443)).toBe('http://example.com:443');
    });

    it('should not omit port 80 for HTTPS', () => {
        expect(buildBaseUrl('https', 'example.com', 80)).toBe('https://example.com:80');
    });

    it('should append path when provided', () => {
        expect(buildBaseUrl('https', 'api.example.com', 443, 'api/1.0.0')).toBe('https://api.example.com/api/1.0.0');
    });

    it('should append path with non-standard port', () => {
        expect(buildBaseUrl('http', 'localhost', 3333, 'api/1.0.0')).toBe('http://localhost:3333/api/1.0.0');
    });
});
