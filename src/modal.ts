export interface HttpSelect {
    httpClientUUID: string;
    databaseName: string;
    nodeName: string;
    paramObject: string;
    result: any;
}

export interface NodeCallConfig {
    dataBaseName?: string;
    canCache?: boolean;
    isSingleCall?: boolean;
    paginationID?: string;
}

export interface HttpNetworkFetch {
    httpClientUUID: string;
    databaseName: string;
    nodeName: string;
    paramObject: string;
    canCache: boolean;
    nodeInstanceUUID: string;
}

export interface BootStrapConfig {
    host: string; // this is main url of the server
    supportOffline: boolean; // should we support offline mode
    database: string; // database name ( change the name to Room Name )
    canCache: boolean; // should we cache the calling node
}

export interface NodeRoomConfig {
    // this is the http client uuid , which is same until the browser is cached is deleted
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
