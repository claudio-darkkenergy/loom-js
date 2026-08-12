import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

import { PinkBox, type PinkBoxProps } from '../pink-box';

export type PinkBoxesProps = ComponentInputProps<{
    boxProps: PinkBoxProps[];
}>;

export const PinkBoxes = component<PinkBoxesProps>(
    (html, { attrs, boxProps, className, id, on, onClick, style }) => html`
        <div
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames(className, 'boxes-wrapper')}
            id=${id}
            style=${style}
        >
            ${boxProps.map((props) => PinkBox(props))}
        </div>
    `
);
