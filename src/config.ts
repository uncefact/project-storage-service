// dotenv must be loaded before any other imports so that process.env values
// are available when the remaining modules evaluate their top-level constants.
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const VERSION_FILE = 'version.json';

// The API_VERSION is set manually, it should be updated when having change impact on the API.
const getApiVersion = () => {
    const version = fs.readFileSync(VERSION_FILE, 'utf8');
    const { apiVersion } = JSON.parse(version);

    if (!apiVersion) throw Error('API version not found');
    return apiVersion;
};

export const API_VERSION = getApiVersion();
export const PROTOCOL = process.env.PROTOCOL || 'http';
export const DOMAIN = process.env.DOMAIN || 'localhost';
export const PORT = process.env.PORT || 3333;
export const EXTERNAL_PORT = process.env.EXTERNAL_PORT || PORT;

export const DEFAULT_BUCKET = process.env.DEFAULT_BUCKET || 'verifiable-credentials';
export const AVAILABLE_BUCKETS = process.env.AVAILABLE_BUCKETS
    ? process.env.AVAILABLE_BUCKETS.split(',')
    : [DEFAULT_BUCKET];

export const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'; // local | gcp | aws
export const LOCAL_DIRECTORY = process.env.LOCAL_DIRECTORY || 'uploads';

// S3-compatible storage configuration (used when STORAGE_TYPE=aws)
export const S3_REGION = process.env.S3_REGION;
export const S3_ENDPOINT = process.env.S3_ENDPOINT;
export const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === 'true';

// Runtime getter for API_KEY to ensure it's evaluated at runtime, not build time
export const getApiKey = () => process.env.API_KEY;
export const AUTH_HEADER_NAME = 'x-api-key';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);