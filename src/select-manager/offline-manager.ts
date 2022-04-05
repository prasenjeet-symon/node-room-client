import { HttpNetworkFetch, HttpSelect } from '../modal';
import { HttpPagination } from '../pagination/http-pagination';
import { simpleNodeUUID } from '../utils';

export class OfflineManager {
    static _instance: OfflineManager;

    private constructor() {}

    public static getInstance(): OfflineManager {
        if (!OfflineManager._instance) {
            OfflineManager._instance = new OfflineManager();
        }
        return OfflineManager._instance;
    }

    public async getLocal(httpClientUUID: string, roomName: string, nodeName: string, paramObject: any): Promise<{ daoIdentifier: string; data: HttpSelect } | null> {
        const localId: string = simpleNodeUUID(httpClientUUID, roomName, nodeName, paramObject);
        const data = localStorage.getItem(localId);
        if (data) {
            return JSON.parse(data);
        }
        return null;
    }

    public setLocal(daoIdentifier: string, data: HttpSelect) {
        const localId: string = simpleNodeUUID(data.httpClientUUID, data.roomName, data.nodeName, data.paramObject);

        // set to the local storage
        localStorage.setItem(localId, JSON.stringify({ daoIdentifier: daoIdentifier, data: data }));
    }

    public async fetch(httpCall: HttpNetworkFetch) {
        const localData = await this.getLocal(httpCall.httpClientUUID, httpCall.roomName, httpCall.nodeName, httpCall.paramObject);
        if (localData) {
            const localDataForPagination: HttpSelect | undefined = {
                ...localData.data,
                httpClientUUID: httpCall.httpClientUUID,
            };

            HttpPagination.getInstance().sendData(localDataForPagination, localData.daoIdentifier, httpCall.nodeInstanceUUID, true);
        } else {
            console.error('No local data found for this node');
            console.log('no local data');
        }
    }
}
