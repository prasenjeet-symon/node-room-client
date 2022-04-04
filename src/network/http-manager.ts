import { BootstrapConfiguration } from '../bootstrap';
import { DeltaData, HttpNetworkFetch, HttpSelect, NodeRoomConfig } from '../modal';
import { HttpPagination, NodeIdentifierRelations } from '../pagination/http-pagination';
import { DeltaManager } from '../select-manager/delta-manager';
import { HttpDataEmitter, HttpSelectManager } from '../select-manager/http-select-manager';

export class HttpNetworkManager {
    static _instance: HttpNetworkManager;

    private constructor() {}

    public static getInstance(): HttpNetworkManager {
        if (!HttpNetworkManager._instance) {
            HttpNetworkManager._instance = new HttpNetworkManager();
        }
        return HttpNetworkManager._instance;
    }

    public async fetch(httpCall: HttpNetworkFetch) {
        const nodeConfig: NodeRoomConfig = BootstrapConfiguration.getInstance().getNodeConfig();

        const header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Accept', 'application/json');
        header.append('can-cache', httpCall.canCache ? '1' : '0');
        header.append('client-instance-uuid', httpCall.httpClientUUID);

        const data = await fetch(nodeConfig.bootstrapConfig.host, {
            method: 'POST',
            headers: header,
            body: JSON.stringify({ roomName: httpCall.databaseName, nodeName: httpCall.nodeName, paramObject: httpCall.paramObject }),
        }).then((response) => response.json());

        if (data.hasOwnProperty('nodeIdentifier')) {
            // this is select node with cache enabled
            // we need to cache this locally to httpSelectManager
            const nodeIdentifier = data.nodeIdentifier;
            const result = data.result;

            HttpSelectManager.getInstance().addSelect(nodeIdentifier, httpCall.httpClientUUID, httpCall.databaseName, httpCall.nodeName, httpCall.paramObject, result);

            // call the paginator to emit the data
            const httpSelect: HttpSelect = {
                databaseName: httpCall.databaseName,
                httpClientUUID: httpCall.httpClientUUID,
                nodeName: httpCall.nodeName,
                paramObject: httpCall.paramObject,
                result: result,
            };

            HttpPagination.getInstance().sendData(httpSelect, nodeIdentifier, httpCall.nodeInstanceUUID);

            // add it to relation tree
            NodeIdentifierRelations.getInstance().pushRelation(nodeIdentifier, httpCall.nodeInstanceUUID);
        } else {
            // this is modification node with by default select disabled
            // emit the data to listener immediately
            // complete the stream , because modification is called only one time no further communication is required
            HttpDataEmitter.getInstance().emitDataComplete(httpCall.nodeInstanceUUID, data.result);

            if (data.hasOwnProperty('delta')) {
                const delta: DeltaData[] = data.delta;
                DeltaManager.getInstance().settleDelta(delta);
            }
        }
    }
}
