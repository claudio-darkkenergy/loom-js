import { type Meta, type StoryObj } from '@loom-js/storybook';

import { PinkInlineCode } from '../../elements/pink-inline-code';
import {
    type CopyState,
    PinkCopyToClipboard,
    PinkCopyToClipboardProps
} from './pink-copy-to-clipboard';

const { parameters } = (globalThis as any).storybook;

const meta: Meta = {
    title: 'Behaviors/PinkCopyToClipboard',
    component: PinkCopyToClipboard,
    parameters: {
        decorator: parameters.decorator.block.left()
    }
};

export default meta;

type Story = StoryObj<PinkCopyToClipboardProps>;

export const Text: Story = {
    args: {
        children: 'Click me to copy this sentence.',
        text: 'Click me to copy this sentence.'
    }
};

// `render` receives the copied state: here `effect` swaps the
// inline code's text in place while the `<code>` node stays put.
export const InlineCode: Story = {
    args: {
        render: (copied: CopyState) =>
            PinkInlineCode({
                children: copied.effect(({ value }) =>
                    value ? 'copied ✓' : 'npm i @loom-js/core'
                )
            }),
        label: 'Copy command',
        text: 'npm i @loom-js/core'
    }
};
