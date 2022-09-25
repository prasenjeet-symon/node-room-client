import { nanoid } from 'nanoid';
import { BootstrapConfiguration } from './bootstrap';
import { HttpNetworkFetch, NodeCallConfig, NodeRoomConfig } from './modal';
import { HttpNetworkManager } from './network/http-manager';
import { HttpDataEmitter } from './select-manager/http-select-manager';
import { OfflineManager } from './select-manager/offline-manager';

export class NodeRoom {
    private static _instance: NodeRoom;

    private constructor() {}

    public static getInstance(): NodeRoom {
        if (!NodeRoom._instance) {
            NodeRoom._instance = new NodeRoom();
        }
        return NodeRoom._instance;
    }

    public call(nodeName: string, paramObject: any, config: NodeCallConfig) {
        const nodeConfig: NodeRoomConfig = BootstrapConfiguration.getInstance().getNodeConfig();

        const httpCall: HttpNetworkFetch = {
            httpClientUUID: nodeConfig.httpInstanceUUID,
            canCache: config.canCache === undefined ? nodeConfig.bootstrapConfig.canCache : config.canCache,
            roomName: config.roomName === undefined ? nodeConfig.bootstrapConfig.roomName : config.roomName,
            nodeInstanceUUID: config.paginationID === undefined ? nanoid() : config.paginationID,
            nodeName: nodeName,
            paramObject: paramObject,
        };

        // if there is offline data, then send it
        OfflineManager.getInstance().fetch(httpCall);
        // continue with the http call
        HttpNetworkManager.getInstance().fetch(httpCall);

        const dataEmitter = HttpDataEmitter.getInstance();
        const dataEmitterSource = dataEmitter.getNewSource(httpCall.nodeInstanceUUID);
        // patch to loading state
        dataEmitter.patchData(httpCall.nodeInstanceUUID, { status: 'loading' });
        return dataEmitterSource.asObservable();
    }
}
