import { component } from '@loom-js/core';
import { Header, type HeaderProps } from '@loom-js/tags';
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
 *
 * The `Header` tag component owns the props-to-attributes mapping, exactly
 * as it did for the functional form: `attrs` for arbitrary attributes, `on`
 * for listeners, plus top-level `className`/`id`/`style`.
 */
export type PinkGridHeaderProps = Omit<HeaderProps, 'children'>;

export const PinkGridHeader = component<PinkGridHeaderProps>(
    (html, { attrs, className, id, on, slots, style }) => html`
        <${Header}
            ...${{ attrs, id, on, style }}
            className=${classNames(className, 'grid-header')}
        >
            ${slots?.col1}
            <div class="u-flex u-gap-16 u-contents-mobile">
                ${slots?.col4}${slots?.col3}${slots?.col2}
            </div>
        </>
    `
);
