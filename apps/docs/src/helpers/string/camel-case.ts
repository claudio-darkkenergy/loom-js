export function camelCase(str: string): string {
    let flag = 0;

    return str.replace(/(\w+|\s|-|_)/g, ($1 = '') => {
        const trimmedMatch = $1;

        // Return empty if the word is falsy.
        if ([' ', '-', '_'].includes(trimmedMatch)) {
            // Abort
            return '';
        }

        /* Handle camelCasing */

        let camelCased = '';
        const chars = trimmedMatch.split('');

        if (flag === 0) {
            // Handle first word (Lowercase 1st character).
            flag = 1;
            camelCased = chars.shift()?.toLowerCase() ?? '';
        } else {
            // Handle any word after the first (Uppercase 1st character).
            camelCased = chars.shift()?.toUpperCase() ?? '';
        }

        return camelCased + chars.join('');
    });
}
