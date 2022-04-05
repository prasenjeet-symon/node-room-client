import { BehaviorSubject } from 'rxjs';
import { BootstrapConfiguration } from '../bootstrap';
import { DataEmitterData, HttpSelect, NodeRoomConfig } from '../modal';
import { OfflineManager } from './offline-manager';

export class HttpDataEmitter {
    static _instance: HttpDataEmitter;
    private httpDataEmitter: Map<string, BehaviorSubject<DataEmitterData>> = new Map();

    private constructor() {}

    static getInstance() {
        if (!HttpDataEmitter._instance) {
            HttpDataEmitter._instance = new HttpDataEmitter();
        }
        return HttpDataEmitter._instance;
    }

    public getNewSource(nodeInstanceUUID: string): BehaviorSubject<DataEmitterData> {
        if (!this.httpDataEmitter.has(nodeInstanceUUID)) {
            this.httpDataEmitter.set(nodeInstanceUUID, new BehaviorSubject<DataEmitterData>({ paginationUUID: nodeInstanceUUID, data: null, error: null, isLocal: false, status: 'loading' }));
        }

        return this.httpDataEmitter.get(nodeInstanceUUID) as BehaviorSubject<DataEmitterData>;
    }

    public patchData(nodeInstanceUUID: string, data: any) {
        if (this.httpDataEmitter.has(nodeInstanceUUID)) {
            const currentData = this.httpDataEmitter.get(nodeInstanceUUID)?.getValue();
            const newData = { ...currentData, ...data };
            // TOOD: we need to freeze the object to prevent the user from changing it
            this.httpDataEmitter.get(nodeInstanceUUID)?.next(JSON.parse(JSON.stringify(newData)));
        }
    }

    public emitData(nodeInstanceUUID: string, data: any, isLocal: boolean) {
        this.patchData(nodeInstanceUUID, { data: data, error: null, status: 'loaded', isLocal: isLocal });
    }

    public emitError(nodeInstanceUUID: string, error: any) {
        this.patchData(nodeInstanceUUID, { error: error, status: 'error' });
    }

    /**
     * Emit the data and complete the source
     */
    public emitDataComplete(nodeInstanceUUID: string, data: any) {
        if (this.httpDataEmitter.has(nodeInstanceUUID)) {
            this.patchData(nodeInstanceUUID, { data: data, error: null, status: 'loaded' });
            this.httpDataEmitter.get(nodeInstanceUUID)?.complete();
            // delete
            this.httpDataEmitter.delete(nodeInstanceUUID);
        }
    }

    /**
     * Emit the error and complete the source
     */
    public emitErrorComplete(nodeInstanceUUID: string, error: any) {
        if (this.httpDataEmitter.has(nodeInstanceUUID)) {
            this.patchData(nodeInstanceUUID, { error: error, status: 'error' });
            this.httpDataEmitter.get(nodeInstanceUUID)?.complete();
            // delete
            this.httpDataEmitter.delete(nodeInstanceUUID);
        }
    }
}

export class HttpSelectManager {
    static _instance: HttpSelectManager;
    private cachedNodes: Map<string, HttpSelect> = new Map();

    private constructor() {}

    public static getInstance(): HttpSelectManager {
        if (!HttpSelectManager._instance) {
            HttpSelectManager._instance = new HttpSelectManager();
        }
        return HttpSelectManager._instance;
    }

    public addSelect(nodeIdentifier: string, httpClientUUID: string, roomName: string, nodeName: string, paramObject: any, result: any) {
        const httpSelect: HttpSelect = {
            httpClientUUID,
            roomName,
            nodeName,
            paramObject,
            result,
        };
        this.cachedNodes.set(nodeIdentifier, httpSelect);

        const nodeConfig: NodeRoomConfig = BootstrapConfiguration.getInstance().getNodeConfig();
        if (nodeConfig.bootstrapConfig.supportOffline) {
            const offlineManager = OfflineManager.getInstance();
            offlineManager.setLocal(httpSelect.httpClientUUID, httpSelect);
        }
    }

    public getSelect(nodeIdentifier: string): HttpSelect | undefined {
        return this.cachedNodes.get(nodeIdentifier);
    }
}
