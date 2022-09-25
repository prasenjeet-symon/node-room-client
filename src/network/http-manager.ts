import { NodeRoomBootstrap } from 'src/bootstrap';
import { DeltaData, HttpNetworkFetch, HttpSelect } from '../modal';
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
        const nodeConfig = NodeRoomBootstrap.getInstance().getNodeRoomConfig();

        const header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Accept', 'application/json');
        header.append('can-cache', httpCall.canCache ? '1' : '0');
        header.append('client-instance-uuid', httpCall.clientInstanceUUID);
        header.append('universal-unique-user-identifier', httpCall.universalUniqueUserIdentifier);

        const data = await fetch(nodeConfig.host + '/node-room', {
            method: 'POST',
            headers: header,
            body: JSON.stringify({ roomName: httpCall.roomName, nodeName: httpCall.nodeName, paramObject: httpCall.paramObject }),
        }).then((response) => response.json());

        if (data.hasOwnProperty('nodeIdentifier')) {
            // whenever there is node identifier, it means that the node is select node
            const nodeIdentifier = data.nodeIdentifier;
            const result = data.result;

            const httpSelect: HttpSelect = {
                nodeName: httpCall.nodeName,
                roomName: httpCall.roomName,
                universalUniqueUserIdentifier: httpCall.universalUniqueUserIdentifier,
                paramObject: httpCall.paramObject,
                result: result,
            };

            HttpSelectManager.getInstance().addSelect(nodeIdentifier, httpSelect);
            HttpPagination.getInstance().sendData(httpSelect, nodeIdentifier, httpCall.paginationID);
            NodeIdentifierRelations.getInstance().pushRelation(nodeIdentifier, httpCall.paginationID);
        } else {
            // this is modification node with by default select disabled
            // emit the data to listener immediately
            // complete the stream , because modification is called only one time no further communication is required
            HttpDataEmitter.getInstance().emitDataComplete(httpCall.paginationID, data.result, false);

            if (data.hasOwnProperty('delta')) {
                const delta: DeltaData[] = data.delta;
                DeltaManager.getInstance().settleDelta(delta);
            }
        }
    }
}
