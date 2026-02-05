/**
 * Checks if a given string is a valid UUID.
 *
 * @param {string} str - The string to be validated as a UUID.
 * @returns {boolean} True if the string is a valid UUID, false otherwise.
 */
export const isValidUUID = (str: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

/**
 * Builds a base URL from protocol, domain, and port, omitting the port
 * when it matches the protocol default (443 for HTTPS, 80 for HTTP).
 */
export const buildBaseUrl = (protocol: string, domain: string, port: string | number, path?: string): string => {
    const isDefaultPort =
        (protocol === 'https' && Number(port) === 443) || (protocol === 'http' && Number(port) === 80);
    const portSuffix = isDefaultPort ? '' : `:${port}`;
    return `${protocol}://${domain}${portSuffix}${path ? `/${path}` : ''}`;
};
