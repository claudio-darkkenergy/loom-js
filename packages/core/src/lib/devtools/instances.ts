import type {
    ComponentContextPartial,
    ContextFunction,
    TemplateTagValue
} from '../../types';
import { isContextFunction, isLiveContext } from '../context/helpers';
import { kindOf } from './tree';

// Where a slot's value rendered: a component value's context is the child
// context under the slot's key; an array's items sit under the array's own
// context, keyed by item key or index, as the list reconciler keys them.
const findRendered = (
    target: ContextFunction,
    value: TemplateTagValue,
    holder: ComponentContextPartial | undefined,
    key: number | string
): ComponentContextPartial | undefined => {
    if (value === target) {
        return holder?.children?.get(key);
    }

    if (!Array.isArray(value)) {
        return undefined;
    }

    const items = holder?.arrayChildren?.get(key);

    for (const [index, item] of value.entries()) {
        const found = findRendered(
            target,
            item,
            items,
            (isContextFunction(item) ? item.key : undefined) ?? index
        );

        if (found) {
            return found;
        }
    }

    return undefined;
};

/**
 * The live instance a component value rendered into, found by walking the
 * slots under `owner`, the instance whose props hold the value — so a
 * `children` or slot prop resolves wherever below it the value rendered.
 * @param value A prop value, typically a component value.
 * @param owner The instance whose props hold `value`.
 * @returns The instance context, or `undefined` when it never rendered or
 * its instance is gone.
 */
export const instanceOf = (
    value: unknown,
    owner: ComponentContextPartial
): ComponentContextPartial | undefined => {
    if (!isContextFunction(value as TemplateTagValue)) {
        return undefined;
    }

    const seen = new Set<ComponentContextPartial>();
    const pending = [owner];

    for (let ctx = pending.pop(); ctx; ctx = pending.pop()) {
        if (seen.has(ctx)) {
            continue;
        }

        seen.add(ctx);

        for (const [index, slot] of (ctx.slots ?? []).entries()) {
            const found = findRendered(
                value as ContextFunction,
                slot.value as TemplateTagValue,
                ctx,
                index
            );

            if (found) {
                return kindOf(found) === 'component' && isLiveContext(found)
                    ? found
                    : undefined;
            }
        }

        [ctx.children, ctx.arrayChildren, ctx.ctxScopes].forEach((map) =>
            map?.forEach((child) => pending.push(child))
        );
    }

    return undefined;
};
