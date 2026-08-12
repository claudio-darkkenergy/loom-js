import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

/**
 * A header laid out on the pink grid. Content arrives through named slots
 * rather than object props:
 *
 * ```ts
 * html`
 *     <${PinkGridHeader}>
 *         <h2 slot="col1" class="grid-header-col-1">Databases</h2>
 *         <${PinkButton} slot="col2" className="grid-header-col-2">…</>
 *     </>
 * `;
 * ```
 *
 * `col1` renders as the leading column; `col2`–`col4` render inside the
 * trailing flex cluster. Slotted content is rendered as authored — callers
 * place the pink grid classes (`grid-header-col-1`…`-4`) on their own
 * elements.
 */
export type PinkGridHeaderProps = Omit<ComponentInputProps, 'children'>;

export const PinkGridHeader = component<PinkGridHeaderProps>(
    (html, { attrs, className, id, on, onClick, slots, style }) => html`
        <header
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames(className, 'grid-header')}
            id=${id}
            style=${style}
        >
            ${slots?.col1}
            <div class="u-flex u-gap-16 u-contents-mobile">
                ${slots?.col4}${slots?.col3}${slots?.col2}
            </div>
        </header>
    `
);
