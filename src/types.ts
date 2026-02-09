export interface IStoreBaseParams {
    bucket: string;
    id?: string;
}

export interface IStoreParams extends IStoreBaseParams {
    data: Record<string, unknown>;
}

export interface IStoreFileParams extends IStoreBaseParams {
    file: Buffer;
    mimeType: string;
}
