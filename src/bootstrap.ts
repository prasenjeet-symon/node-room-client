import { nanoid } from 'nanoid';
import { BootStrapConfig, NodeRoomConfig } from './modal';

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
        let httpInstanceUUID = localStorage.getItem('httpInstanceUUID');
        if (!httpInstanceUUID) {
            httpInstanceUUID = nanoid();
            localStorage.setItem('httpInstanceUUID', httpInstanceUUID);
        }

        this.nodeConfig = {
            bootstrapConfig: config,
            httpInstanceUUID: httpInstanceUUID,
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
