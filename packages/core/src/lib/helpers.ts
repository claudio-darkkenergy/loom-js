import { PlainObject } from '../types';

export const deepDiffObject = (
    oldValue: PlainObject,
    newValue: PlainObject
): boolean =>
    Object.entries(oldValue).some(([key, value]) => {
        if (isObject(value) && isObject(newValue[key])) {
            return deepDiffObject(
                value as PlainObject,
                newValue[key] as PlainObject
            );
        }

        return value !== newValue[key];
    });

export const isObject = (value: any) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

export const shallowDiffObject = (
    oldValue: PlainObject,
    newValue: PlainObject
) =>
    Object.entries(oldValue).some(([key, value]) => {
        return value !== newValue[key];
    });
