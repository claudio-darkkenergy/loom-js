import type { TemplateTransformGetter } from '../../../types';
import type { Frame, Region } from './types';

// Region assembly: every scanner writes template output through these
// primitives, so the statics/getters bookkeeping lives in exactly one place.

export const createRegion = (): Region => ({ getters: [], statics: [''] });

// Synthesized children/slot regions always render fragment-rooted, whatever
// their node count. The flag is keyed by the region's statics — the chunks
// identity the parser receives.
const fragmentRegions = new WeakSet<ArrayLike<string>>();

export const markFragmentRegion = (region: Region) => {
    fragmentRegions.add(region.statics);
};

export const isFragmentRegion = (chunks: ArrayLike<string>) =>
    fragmentRegions.has(chunks);

export const pushText = (region: Region, text: string) => {
    region.statics[region.statics.length - 1] += text;
};

export const pushSlot = (region: Region, getter: TemplateTransformGetter) => {
    region.getters.push(getter);
    region.statics.push('');
};

export const mergeRegion = (target: Region, source: Region) => {
    pushText(target, source.statics[0] as string);
    source.getters.forEach((getter, getterIndex) => {
        pushSlot(target, getter);
        pushText(target, source.statics[getterIndex + 1] as string);
    });
};

export const slotRegionFor = (frame: Frame, label: string): Region => {
    const regions = (frame.slotRegions ||= new Map());
    let slotRegion = regions.get(label);

    if (!slotRegion) {
        regions.set(label, (slotRegion = createRegion()));
    }

    return slotRegion;
};
