import { isValidUUID } from './utils';

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
