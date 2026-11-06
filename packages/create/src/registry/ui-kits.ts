import type { UiKit } from './types';

export const pink: UiKit = {
    bodyClass: 'theme-light',
    id: 'pink',
    label: 'Pink (@loom-js/pink)',
    packages: ['@loom-js/pink'],
    stylesheets: ['@loom-js/pink/pink.css', '@loom-js/pink/icons.css'],
    tailwind: {
        // Pink block classes Tailwind would also generate as utilities.
        sourceExclusions: ['container', 'list-item', 'table', 'table-row'],
        stylesheet: '@loom-js/pink/pink.css'
    }
};

export const UI_KITS: readonly UiKit[] = [pink];
