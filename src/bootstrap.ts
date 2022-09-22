import { nanoid } from 'nanoid';
import { BootStrapConfig, DeltaData, NodeRoomConfig } from './modal';
import { DeltaManager } from './select-manager/delta-manager';

export class BootstrapConfiguration {
    static _instance: BootstrapConfiguration;
    private nodeConfig!: NodeRoomConfig;

    private constructor() {}

    public static getInstance(): BootstrapConfiguration {
        if (!BootstrapConfiguration._instance) {
            BootstrapConfiguration._instance = new BootstrapConfiguration();
        }
        return BootstrapConfiguration._instance;
    }

    public setConfig(config: BootStrapConfig) {
        // check if the httpInstanceUUID is already set
        // if set then use that otherwise generate a new one
        let httpInstanceUUID = localStorage.getItem('httpInstanceUUID');

        if (config.supportMultiTab) {
            httpInstanceUUID = null;
        }

        if (!httpInstanceUUID) {
            httpInstanceUUID = nanoid();
            localStorage.setItem('httpInstanceUUID', httpInstanceUUID);
        }

        this.nodeConfig = {
            bootstrapConfig: config,
            httpInstanceUUID: httpInstanceUUID,
        };

        this.registerClient();
    }

    // register the client
    public registerClient() {
        const header = new Headers();
        header.append('Content-Type', 'application/json');
        const body = {
            clientInstanceUUID: this.nodeConfig.httpInstanceUUID,
        };

        fetch(this.nodeConfig.bootstrapConfig.host + '/node-room-client-registration', {
            method: 'POST',
            headers: header,
            body: JSON.stringify(body),
        })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                this.registerSSE();
            });
    }

    // register the sse
    public registerSSE() {
        const sse = new EventSource(this.nodeConfig.bootstrapConfig.host + `/node-room-sse/${this.nodeConfig.httpInstanceUUID}`);
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

    public getNodeConfig(): NodeRoomConfig {
        return this.nodeConfig;
    }
}

export class BootstrapNodeRoom {
    static _instance: BootstrapNodeRoom;

    private constructor() {}

    public static init(config: BootStrapConfig): BootstrapNodeRoom {
        if (!BootstrapNodeRoom._instance) {
            BootstrapNodeRoom._instance = new BootstrapNodeRoom();
            BootstrapConfiguration.getInstance().setConfig(config);
        }
        return BootstrapNodeRoom._instance;
    }
}
