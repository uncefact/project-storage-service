/**
 * Checks if a given string is a valid UUID.
 *
 * @param {string} str - The string to be validated as a UUID.
 * @returns {boolean} True if the string is a valid UUID, false otherwise.
 */
export const isValidUUID = (str: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
