import { nanoid } from 'nanoid';
import { BootStrapConfig, DeltaData } from './modal';
import { DeltaManager } from './select-manager/delta-manager';
import { isLocalStorageAvailable } from './utils';

/**
 *  BootStrap node room with the configuration
 * @param config : configuration for the node room
 * @returns void
 */
export async function nodeRoomBootstrap(config: BootStrapConfig) {
    if (!config) throw new Error('NodeRoom config is required');
    if (!config.host) throw new Error('NodeRoom host is required');
    if (!config.defaultRoom) throw new Error('NodeRoom defaultRoom is required');
    if (!config.supportOffline) throw new Error('NodeRoom supportOffline is required');
    if (!config.canCache) throw new Error('NodeRoom canCache is required');

    NodeRoomBootstrap.getInstance().setNodeRoomConfig(config);
    return;
}

/**
 * Set the universal unique user identifier, this is used to identify the user across the different devices and help us in intelligent caching of the node
 *
 * If not set, we will generate a random id for the user
 */
export function setUniversalUniqueUserIdentifier(universalUniqueUserIdentifier: string) {
    if (!universalUniqueUserIdentifier) throw new Error('universalUniqueUserIdentifier is required');
    if (universalUniqueUserIdentifier.length < 10) throw new Error('universalUniqueUserIdentifier is too short');
    return NodeRoomBootstrap.getInstance().setUniversalUniqueUserIdentifier(universalUniqueUserIdentifier);
}

export class NodeRoomBootstrap {
    private static _instance: NodeRoomBootstrap;
    private clientInstanceUUID: string = nanoid(); // each time we initialize the node room we need to create a new client instance
    private universalUniqueUserIdentifier!: string;
    private nodeRoomConfig!: BootStrapConfig;

    private constructor() {
        if (typeof window === 'undefined') throw new Error('NodeRoom is only supported in browser');
        if (!isLocalStorageAvailable()) throw new Error('Local storage is not supported');

        // set the clientInstanceUUID
        let clientInstanceUUID = localStorage.getItem('clientInstanceUUID');
        if (!clientInstanceUUID) {
            clientInstanceUUID = nanoid();
            localStorage.setItem('clientInstanceUUID', clientInstanceUUID);
        }

        // set the universalUniqueUserIdentifier
        let universalUniqueUserIdentifier = localStorage.getItem('universalUniqueUserIdentifier');
        if (!universalUniqueUserIdentifier) {
            universalUniqueUserIdentifier = nanoid();
            localStorage.setItem('universalUniqueUserIdentifier', universalUniqueUserIdentifier);
        }

        this.clientInstanceUUID = clientInstanceUUID;
        this.universalUniqueUserIdentifier = universalUniqueUserIdentifier;
    }

    public static getInstance(): NodeRoomBootstrap {
        if (!NodeRoomBootstrap._instance) {
            NodeRoomBootstrap._instance = new NodeRoomBootstrap();
        }
        return NodeRoomBootstrap._instance;
    }

    // set the node room config
    public setNodeRoomConfig(nodeRoomConfig: BootStrapConfig) {
        this.nodeRoomConfig = nodeRoomConfig;
        this.registerClientInstance().then(() => {
            this.registerSSE();
        });
    }

    // get the node room config
    public getNodeRoomConfig(): BootStrapConfig {
        return this.nodeRoomConfig;
    }

    // get the client instance uuid
    public getClientInstanceUUID(): string {
        return this.clientInstanceUUID;
    }

    // set the universal unique user identifier
    public async setUniversalUniqueUserIdentifier(universalUniqueUserIdentifier: string) {
        this.universalUniqueUserIdentifier = universalUniqueUserIdentifier;
    }

    // get universal unique user identifier
    public getUniversalUniqueUserIdentifier(): string {
        return this.universalUniqueUserIdentifier;
    }

    // register this node room client instance to the server
    private async registerClientInstance() {
        const header = new Headers();
        header.append('Content-Type', 'application/json');
        const body = {
            clientInstanceUUID: this.clientInstanceUUID,
            universalUniqueUserIdentifier: this.universalUniqueUserIdentifier,
        };

        await fetch(this.nodeRoomConfig.host + '/node-room-client-registration', {
            method: 'POST',
            headers: header,
            body: JSON.stringify(body),
        });
    }

    // register the server sent event listener
    private registerSSE() {
        const sse = new EventSource(this.nodeRoomConfig.host + `/node-room-sse/${this.clientInstanceUUID}`);

        sse.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.hasOwnProperty('delta')) {
                const delta: DeltaData[] = data.delta;
                DeltaManager.getInstance().settleDelta(delta);
            }
        };

        sse.onerror = (event) => {
            console.error(event);
        };
    }
}
