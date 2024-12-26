import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
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

export const DEFAULT_BUCKET = process.env.DEFAULT_BUCKET || 'verifiable-credentials';
export const AVAILABLE_BUCKETS = process.env.AVAILABLE_BUCKETS
    ? process.env.AVAILABLE_BUCKETS.split(',')
    : [DEFAULT_BUCKET];

export const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'; // local | gcp | aws
export const REGION = process.env.REGION || 'ap-southeast-2';
export const LOCAL_DIRECTORY = process.env.LOCAL_DIRECTORY || 'uploads';
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
