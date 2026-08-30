import {
    activity,
    component,
    type ComponentInputProps,
    el,
    type TemplateTagValue
} from '@loom-js/core';
import classNames from 'classnames';

import { PinkTooltipPopup } from '../../elements/pink-tooltip/pink-tooltip-popup';
import type { PinkDynamicProps } from '../../types';

// The copied state as children see it: the activity's read surface. `bind`
// updates an attribute on the node already in the DOM; `effect` re-renders
// its slot (a returned string updates a text node in place).
export type CopyState = Pick<
    ReturnType<typeof activity<boolean>>,
    'bind' | 'effect' | 'value' | 'watch'
>;

export type CopyStateRender = (copied: CopyState) => TemplateTagValue;

export interface PinkCopyToClipboardProps extends PinkDynamicProps {
    // How long the copied state lasts, in ms.
    copiedDurationMs?: number;
    // The tooltip label while in the copied state.
    copiedLabel?: string;
    // The idle tooltip label.
    label?: string;
    // Tooltip placement classes (pink's `is-bottom` / `is-center` / `is-end`).
    popupClassName?: string;
    // Renders the content with the copied state in hand, so the content
    // decides how to reflect it — `copied.bind(...)` on an attribute keeps
    // the same node, `copied.effect(...)` re-renders its slot. Wins over
    // `children` (the static form). A render-function `children` would need
    // core's `ReservedProps` to admit it; a sibling prop keeps the type
    // surface intact.
    render?: CopyStateRender;
    // The text to copy — or a getter, for text only known at click time
    // (e.g. anything derived from `location`, which stays off the render
    // path so the component prerenders safely).
    text: string | (() => string);
}

// Writing to the clipboard is a browser concern of its own — kept out of the
// render path. Resolves `false` where the Clipboard API is unavailable (e.g.
// insecure contexts) or the write is refused.
const copyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
        return false;
    }

    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

/**
 * The copy-to-clipboard behavior: a host (`is`, default `<span>`) around any
 * content — text, an icon, a button, an anchor; static `children` or a
 * state-aware `render` — that copies `text` when
 * activated, then holds the copied state (and its tooltip label) for
 * `copiedDurationMs`. The host's click is the behavior; children keep their
 * own handlers, and the activation is never intercepted — an anchor child
 * still navigates and a button child still submits.
 */
export const PinkCopyToClipboard = component<
    ComponentInputProps<PinkCopyToClipboardProps>
>(
    (
        html,
        {
            attrs,
            children,
            className,
            copiedDurationMs = 2000,
            copiedLabel = 'Copied!',
            id,
            is = el('span'),
            label = 'Copy',
            on,
            onUnmounted,
            popupClassName = 'is-bottom is-end',
            render,
            style,
            text
        }
    ) => {
        // Per-instance state: this closure is the component instance, so the
        // activity lives exactly as long as the rendered host does.
        const isCopied = activity(false);
        let resetTimer: ReturnType<typeof setTimeout> | undefined;
        const onClick = async () => {
            const resolvedText = typeof text === 'function' ? text() : text;

            if (!(await copyToClipboard(resolvedText))) {
                return;
            }

            isCopied.update(true);
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => isCopied.reset(), copiedDurationMs);
        };

        onUnmounted(() => clearTimeout(resetTimer));

        return html`
            <${is}
                attrs=${attrs}
                className=${classNames(className, 'tooltip')}
                id=${id}
                on=${on}
                onClick=${onClick}
                style=${style}
            >
                ${render ? render(isCopied) : children}
                <${PinkTooltipPopup} className=${popupClassName}>
                    ${isCopied.effect(({ value }) =>
                        value ? copiedLabel : label
                    )}
                </>
            </>
        `;
    }
);
