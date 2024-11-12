import { PROTOCOL, DOMAIN, PORT, API_VERSION } from '../config';

export const updateSwagger = (swaggerJson: Record<string, any>) => {
    const swagger = { ...swaggerJson };
    swagger.info = swagger.info || {};
    swagger.info.version = API_VERSION;
    swagger.servers = [
        {
            url: `${PROTOCOL}://${DOMAIN}:${PORT}/${API_VERSION}`,
        },
    ];
    return swagger;
};
