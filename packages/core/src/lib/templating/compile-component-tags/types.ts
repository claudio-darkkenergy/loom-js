import type { TemplateTransformGetter } from '../../../types';

// Transform-internal shapes. `Region` is the unit of accumulation: the static
// text and per-render getters that make up one stretch of template output.
export interface Region {
    getters: TemplateTransformGetter[];
    statics: string[];
}

// A component element mid-parse: its attribute region until `/>` or `>`, then
// (non-self-closing only) its children region until the matching `</>`.
// `tagStack`/`activeSlot`/`slotRegions` track the children region's plain-HTML
// depth and its named regions; `slotLabel` is the label this element itself
// carries when it sits at the top level of an enclosing children region.
// The slot fields are optional so the hot-path frame literal stays small.
export interface Frame {
    activeSlot?: string | null;
    props: [string, TemplateTransformGetter][];
    region: Region | null;
    slotLabel?: string;
    slotRegions?: Map<string, Region>;
    tagIndex: number;
    tagStack: string[];
}

// A plain HTML open tag mid-parse inside a children region. `buffer` exists
// only at the region's top level, where the tag text must be held back until
// its (possible) slot label decides which region receives the subtree.
export interface PlainTag {
    buffer: Region | null;
    inValue?: boolean;
    label?: string;
    name: string;
    quote?: string | null;
}
