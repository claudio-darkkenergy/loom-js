import { component, type ComponentInputProps } from '@loom-js/core';

import { cn } from '../../utils/cn';
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
            class=${cn(className, 'boxes-wrapper')}
            id=${id}
            style=${style}
        >
            ${boxProps.map((props) => PinkBox(props))}
        </div>
    `
);
