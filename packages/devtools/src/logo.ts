// The loom mark: nested circles, outermost first, on a 114.92 square. The
// HUD draws it in its template; the backend builds it for the page-side
// minimized button.
export const LOGO_VIEW_BOX = '0 0 114.92 114.92';

export const LOGO_CIRCLES: [cx: number, cy: number, r: number, fill: string][] =
    [
        [57.46, 57.46, 57.46, '#363230'],
        [57.46, 57.46, 44.5, '#F05A28'],
        [47.6, 67.33, 41.5, '#363230'],
        [47.6, 67.33, 30.5, '#FF0095'],
        [40.6, 74.33, 27.5, '#363230'],
        [39.5, 75.5, 18.5, '#C653C4'],
        [35.5, 79.5, 14.5, '#363230']
    ];
