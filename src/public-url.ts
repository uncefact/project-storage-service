/**
 * Creates a public URI generator bound to a specific PUBLIC_URL.
 * Validates the URL at creation time to fail fast on misconfiguration.
 *
 * @param publicUrl - The PUBLIC_URL value from the environment, or undefined if not set.
 * @returns A function that generates public URIs using the configured PUBLIC_URL origin.
 * @throws {Error} If publicUrl is set but is not a valid URL.
 */
export function createPublicUriGenerator(publicUrl: string | undefined): (key: string) => string | null {
    if (publicUrl) {
        try {
            new URL(publicUrl);
        } catch {
            throw new Error(`Invalid PUBLIC_URL format: "${publicUrl}" is not a valid URL`);
        }
    }

    return (key: string): string | null => {
        if (!publicUrl) return null;
        const url = new URL(publicUrl);
        return `${url.origin}/${key}`;
    };
}
