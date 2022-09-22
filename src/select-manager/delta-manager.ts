import { DeltaData, DeltaFinalResult, HttpSelect } from '../modal';
import { HttpPagination, NodeIdentifierRelations } from '../pagination/http-pagination';
import { findNewValueFromDelta } from '../utils';
import { HttpSelectManager } from './http-select-manager';

export class DeltaManager {
    private static _instance: DeltaManager;

    private constructor() {}

    public static getInstance(): DeltaManager {
        if (!DeltaManager._instance) {
            DeltaManager._instance = new DeltaManager();
        }
        return DeltaManager._instance;
    }

    private computeLatestResult(delta: DeltaData[]) {
        const httpSelectManager = HttpSelectManager.getInstance();

        return delta
            .map((p) => {
                const cachedDao = httpSelectManager.getSelect(p.nodeIdentifier);

                if (cachedDao) {
                    const newResult = findNewValueFromDelta(cachedDao?.result, p.delta, p.id);
                    httpSelectManager.addSelect(p.nodeIdentifier, cachedDao?.httpClientUUID, cachedDao?.roomName, cachedDao?.nodeName, cachedDao?.paramObject, newResult);
                    const deltaHttpSelect: HttpSelect = {
                        roomName: cachedDao.roomName,
                        httpClientUUID: cachedDao.httpClientUUID,
                        nodeName: cachedDao.nodeName,
                        paramObject: cachedDao.paramObject,
                        result: newResult,
                    };

                    return { nodeIdentifier: p.nodeIdentifier, result: deltaHttpSelect };
                } else {
                    return null;
                }
            })
            .filter((p) => p !== null) as DeltaFinalResult[];
    }

    public settleDelta(incomingDelta: DeltaData[]) {
        const delta = this.computeLatestResult(incomingDelta);

        const nodeIdentifierRelations = NodeIdentifierRelations.getInstance();
        delta.forEach((delta) => {
            const nodeInstanceUUID: string[] = nodeIdentifierRelations.getRelation(delta.nodeIdentifier);
            HttpPagination.getInstance().sendDataFromDelta(delta.result, delta.nodeIdentifier, nodeInstanceUUID);
        });
    }
}
