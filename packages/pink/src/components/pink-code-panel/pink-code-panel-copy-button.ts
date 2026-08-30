import { type ComponentInputProps, simple } from '@loom-js/core';
import classNames from 'classnames';

import {
    PinkCopyButton,
    type PinkCopyButtonProps
} from '../../elements/pink-copy-button';

export type PinkCodePanelCopyButtonProps = Omit<PinkCopyButtonProps, 'text'> & {
    // The code to copy.
    text: string;
};

/**
 * The panel header's copy button: a `PinkCopyButton` sized to the header's
 * label line and hugging the header's end edge.
 */
export const PinkCodePanelCopyButton = simple<
    ComponentInputProps<PinkCodePanelCopyButtonProps>
>(({ className, ...props }) =>
    PinkCopyButton({
        buttonSize: '1.5rem',
        label: 'Copy code',
        ...props,
        className: classNames(className, 'u-margin-inline-start-auto')
    })
);
