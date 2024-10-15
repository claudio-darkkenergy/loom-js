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

export const toCamelCase = (str: string) => {
    return str
        .split('-')
        .map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('');
};

export const toKebabCase = (str: string) => {
    return str
        .split('')
        .map((char: string, index: number) => {
            if (index === 0) {
                return char.toLowerCase();
            }
            if (char === char.toUpperCase()) {
                return `-${char.toLowerCase()}`;
            }
            return char;
        })
        .join('');
};
