export interface HttpSelect {
    httpClientUUID: string;
    roomName: string;
    nodeName: string;
    paramObject: string;
    result: any;
}

export interface NodeCallConfig {
    roomName?: string;
    canCache?: boolean;
    isSingleCall?: boolean;
    paginationID?: string;
}

export interface HttpNetworkFetch {
    httpClientUUID: string;
    roomName: string;
    nodeName: string;
    paramObject: string;
    canCache: boolean;
    nodeInstanceUUID: string;
}

export interface BootStrapConfig {
    host: string;
    supportOffline: boolean;
    roomName: string;
    canCache: boolean;
}

export interface NodeRoomConfig {
    // this is the http client uuid, which is same until the browser cached is deleted
    // we need to use the local storage to store the data
    httpInstanceUUID: string;
    bootstrapConfig: BootStrapConfig;
}

export type LOADING_STATUS = 'loading' | 'loaded' | 'error';

export interface DataEmitterData {
    status: LOADING_STATUS;
    error: any | null;
    data: any | null;
    isLocal: boolean;
    paginationUUID: string | null;
}

export interface DeltaData {
    nodeIdentifier: string;
    delta: any;
    id: string;
}

export interface DeltaFinalResult {
    nodeIdentifier: string;
    result: any;
}
