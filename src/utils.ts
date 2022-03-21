/**
 * This function simply returns the value of the input parameter attached together.
 */
export function simpleNodeUUID(httpClientUUID: string, databaseName: string, nodeName: string, paramObject: any): string {
    // this string uniquely identifies the node call
    return `${httpClientUUID}_${databaseName}_${nodeName}_${JSON.stringify(paramObject)}`;
}

export function isObject(value: any) {
    try {
        if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') {
            return false;
        } else {
            if (value.length) {
                // array
                return false;
            } else {
                // possibly object
                return true;
            }
        }
    } catch (error) {
        return false;
    }
}

export function isArray(value: any) {
    try {
        if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') {
            return false;
        } else {
            if (value.length) {
                // array
                return true;
            } else {
                // possibly object
                return false;
            }
        }
    } catch (error) {
        return false;
    }
}

export function isPrimitive(value: any) {
    if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') {
        return true;
    } else {
        return false;
    }
}

export function valueType(value: any) {
    if (isPrimitive(value)) {
        return 'primitive';
    } else if (isArray(value)) {
        return 'array';
    } else if (isObject(value)) {
        return 'object';
    }
}

export function mergeMissingValues(old_data: any, new_data: any) {
    Object.keys(new_data).forEach((key) => {
        if (!old_data.hasOwnProperty(key)) {
            old_data[key] = new_data[key];
        }
    });

    Object.keys(old_data).forEach((key) => {
        if (!new_data.hasOwnProperty(key)) {
            new_data[key] = old_data[key];
        }
    });

    return {
        old_data,
        new_data,
    };
}

export function findNewValueFromDelta(oldValue: any, delta: any, id: string) {
    if (valueType(delta) !== valueType(oldValue)) {
        return delta;
    }

    // if the value is primitive then return the delta
    if (valueType(delta) === 'primitive') {
        return delta;
    }

    // if the value is array
    if (valueType(delta) === 'array') {
        const isAllElementObjects = oldValue.every((element: any) => {
            return isObject(element);
        });

        const isAllElementObjectDelta = delta.every((element: any) => {
            return isObject(element);
        });

        if (isAllElementObjects && isAllElementObjectDelta) {
            const isOldEleIds = oldValue.every((element: any) => {
                return element.hasOwnProperty(id);
            });

            const isNewEleIds = delta.every((element: any) => {
                return element.hasOwnProperty(id);
            });

            if (isOldEleIds && isNewEleIds) {
                const allNewElements: any[] = delta.filter((element: any) => {
                    return element.hasOwnProperty('nr') && element.nr === true;
                });

                const allDeleteElements: any[] = delta.filter((element: any) => {
                    return element.hasOwnProperty('dr') && element.dr === true;
                });

                const allUpdatedElements: any[] = delta.filter((element: any) => {
                    return element.hasOwnProperty('nr') && element.nr === false;
                });

                const newElements: any[] = [];

                // merge the new item at the proper position
                allNewElements.forEach((element: any) => {
                    const ref = element.pRef;
                    if (ref === null) {
                        // push to the top of the array
                        // delete the ref and nr key
                        delete element.pRef;
                        delete element.nr;
                        oldValue.unshift(element);
                    } else {
                        // there is relation
                        const indexOfRef = oldValue.findIndex((ele: any) => ele[id] === ref);
                        if (indexOfRef !== -1) {
                            delete element.pRef;
                            delete element.nr;
                            // if the index is found then insert the element at that index
                            oldValue = [...oldValue.slice(0, indexOfRef + 1), element, ...oldValue.slice(indexOfRef + 1)];
                        }
                    }
                });

                oldValue.forEach((element: any) => {
                    const foundDeleted = allDeleteElements.find((ele: any) => ele[id] === element[id]);
                    if (!foundDeleted) {
                        // this element is not deleted
                        // check for the updated elements
                        const foundUpdated = allUpdatedElements.find((ele: any) => ele[id] === element[id]);
                        if (foundUpdated) {
                            // this element is updated
                            // so we need to add this element to newElements
                            delete foundUpdated.nr;
                            // merge the old and updated element
                            Object.keys(foundUpdated).forEach((uKey) => {
                                const oldEleKeyVal = element[uKey];
                                const newEleKeyVal = foundUpdated[uKey];
                                const newValue = findNewValueFromDelta(oldEleKeyVal, newEleKeyVal, id);
                                element[uKey] = newValue;
                            });
                            newElements.push(element);
                        } else {
                            // this element is not updated
                            // so we need to add this element to newElements
                            newElements.push(element);
                        }
                    }
                });

                return newElements;
            } else {
                return delta;
            }
        } else {
            // delta elements is either primitive or array ( no change )
            return delta;
        }
    }

    if (valueType(delta) === 'object') {
        // merge the keys of both object to each other
        const { old_data, new_data } = mergeMissingValues(oldValue, delta);
        const deltaFinalObj: any = {};

        Object.keys(new_data).forEach((key) => {
            // we need to recursively call this function to find the delta
            deltaFinalObj[key] = findNewValueFromDelta(old_data[key], new_data[key], id);
        });

        return deltaFinalObj;
    }

    return delta;
}
