import { HttpSelect } from '../modal';
import { HttpDataEmitter, HttpSelectManager } from '../select-manager/http-select-manager';

export class HttpPagination {
    private static _instance: HttpPagination;
    private paginationHistory: Map<string, string[]> = new Map(); // nodeInstanceUUID: string, daoIdentifier: string[];
    private constructor() {}

    public static getInstance(): HttpPagination {
        if (!HttpPagination._instance) {
            HttpPagination._instance = new HttpPagination();
        }
        return HttpPagination._instance;
    }

    public getHistory(nodeInstanceUUID: string) {
        if (!this.paginationHistory.has(nodeInstanceUUID)) {
            this.paginationHistory.set(nodeInstanceUUID, []);
        }
        return this.paginationHistory.get(nodeInstanceUUID);
    }

    public sendDataFromDelta(data: HttpSelect | undefined, daoIdentifier: string, nodeInstanceUUID: string[]) {
        nodeInstanceUUID.forEach((nodeInstanceUUID) => {
            this.sendData(data, daoIdentifier, nodeInstanceUUID);
        });
    }

    public sendData(data: HttpSelect | undefined, daoIdentifier: string, nodeInstanceUUID: string, isLocal: boolean = false) {
        // data is the data of daoIdentifier
        const history = this.getHistory(nodeInstanceUUID);
        if (history) {
            let indexOfDaoIdentifier = history.indexOf(daoIdentifier);
            if (indexOfDaoIdentifier === -1) {
                // if not found, add it
                indexOfDaoIdentifier = history.length;
                history.push(daoIdentifier);
                this.paginationHistory.set(nodeInstanceUUID, history);
            }

            if (history.length > 1) {
                const leftPosition = history.slice(0, indexOfDaoIdentifier);
                const rightPosition = indexOfDaoIdentifier === history.length - 1 ? [] : history.slice(indexOfDaoIdentifier + 1);
                const httpSelectManager = HttpSelectManager.getInstance();

                const paginationData: { daoIdentifier: string; data: HttpSelect | undefined }[] = [];
                leftPosition.forEach((daoIdentifier: string) => {
                    paginationData.push({ daoIdentifier, data: httpSelectManager.getSelect(daoIdentifier) });
                });
                paginationData.push({ daoIdentifier, data });
                rightPosition.forEach((daoIdentifier: string) => {
                    paginationData.push({ daoIdentifier, data: httpSelectManager.getSelect(daoIdentifier) });
                });

                // pagination means data is array;
                const finalData: any[] = [];
                paginationData.forEach((paginationData: { daoIdentifier: string; data: HttpSelect | undefined }) => {
                    const data = paginationData.data;
                    if (data) {
                        console.log(data, 'PAGINATION DATA')
                        // result is assumed to be array
                        finalData.push(...data.result);
                    }
                });

                const httpDataEmitter = HttpDataEmitter.getInstance();
                httpDataEmitter.emitData(nodeInstanceUUID, finalData, isLocal);
            } else {
                // if only one, just send it
                const httpDataEmitter = HttpDataEmitter.getInstance();
                if (data) {
                    httpDataEmitter.emitData(nodeInstanceUUID, data.result, isLocal);
                }
            }
        }
    }
}
/**
 *
 *
 *
 */
// this is for the delta manager
// single daoIdentifier can be related to multiple nodeInstanceUUID
// when the data is fetched, it will be sent to all the nodeInstanceUUID
export class NodeIdentifierRelations {
    private static _instance: NodeIdentifierRelations;
    private relation: Map<string, Set<string>> = new Map(); // daoIdentifier: string, nodeInstanceUUID: string[]

    private constructor() {}

    public static getInstance(): NodeIdentifierRelations {
        if (!NodeIdentifierRelations._instance) {
            NodeIdentifierRelations._instance = new NodeIdentifierRelations();
        }
        return NodeIdentifierRelations._instance;
    }

    pushRelation(daoIdentifier: string, nodeInstanceUUID: string) {
        const set = this.relation.get(daoIdentifier);
        if (set) {
            set.add(nodeInstanceUUID);
        } else {
            const newSet = new Set<string>();
            newSet.add(nodeInstanceUUID);
            this.relation.set(daoIdentifier, newSet);
        }
    }

    public getRelation(daoIdentifier: string): string[] {
        const set = this.relation.get(daoIdentifier);
        if (set) {
            return Array.from(set);
        } else {
            return [];
        }
    }
}
