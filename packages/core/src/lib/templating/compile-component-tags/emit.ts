import { component } from '../../../component';
import type {
    Component,
    ComponentContext,
    PlainObject,
    TemplateTagValue,
    TemplateTransformGetter
} from '../../../types';
import { fail } from './grammar';
import type { Frame, Region } from './types';

// Plan emission: turns fully-scanned frames into the render-time artifacts —
// synthesized children/region components and the per-render component getter.

// A children region has no single-root guarantee (text, multiple elements),
// so its synthesized component always renders as a rootless fragment.
const makeChildrenComponent = (region: Region) => {
    region.statics[0] = `<>${region.statics[0]}`;

    const childChunks = region.statics;
    const synth = component<{ values?: TemplateTagValue[] }>(
        (html, { values = [] }) =>
            (
                html as unknown as (
                    chunks: string[],
                    ...values: TemplateTagValue[]
                ) => ComponentContext
            )(childChunks, ...values)
    );

    return { getters: region.getters, synth };
};

export const makeComponentGetter = (frame: Frame): TemplateTransformGetter => {
    const { props, region, slotRegions, tagIndex } = frame;
    const child =
        region &&
        (region.getters.length || region.statics.some((text) => text.trim()))
            ? makeChildrenComponent(region)
            : null;
    // One synthesized component per named region (design Decision 1 of
    // `add-named-slots`) — a slot region is never empty by construction.
    const slotChildren = slotRegions
        ? Array.from(
              slotRegions,
              ([name, slotRegion]): [
                  string,
                  ReturnType<typeof makeChildrenComponent>
              ] => [name, makeChildrenComponent(slotRegion)]
          )
        : null;

    return (interpolations) => {
        const tag = interpolations[tagIndex];

        if (typeof tag !== 'function') {
            fail(
                `the component tag value at interpolation #${tagIndex} is not callable`
            );
        }

        const renderChild = (regionChild: NonNullable<typeof child>) =>
            regionChild.synth({
                values: regionChild.getters.map((get) => get(interpolations))
            });
        const tagProps: PlainObject = {};

        props.forEach(([name, get]) => {
            if (name === null) {
                // A spread entry — JS object-spread semantics, so nullish
                // and primitive values are a no-op.
                Object.assign(tagProps, get(interpolations));
            } else {
                tagProps[name] = get(interpolations);
            }
        });

        if (child) {
            tagProps.children = renderChild(child);
        }

        // Assigned after the props loop, so markup-derived regions win over
        // an explicit `slots=` prop — as markup children win over `children=`.
        if (slotChildren) {
            const slotProps: PlainObject = {};

            slotChildren.forEach(([name, regionChild]) => {
                slotProps[name] = renderChild(regionChild);
            });
            tagProps.slots = slotProps;
        }

        return (tag as Component)(tagProps);
    };
};
