import { el } from '@loom-js/core';
import { type Meta, type StoryObj } from '@loom-js/storybook';

import { PinkInlineCode } from './pink-inline-code';

const meta: Meta = {
    title: 'Elements/PinkInlineCode',
    component: PinkInlineCode
};

export default meta;

type Story = StoryObj;

export const InlineCode: Story = {
    args: {
        children: 'npm i @loom-js/core'
    }
};

export const UsageInSentence: Story = {
    render: () =>
        el('p')({
            children: [
                'Install the package with ',
                PinkInlineCode({ children: 'npm i @loom-js/core' }),
                ' and import it via ',
                PinkInlineCode({
                    children: "import * as Loom from '@loom-js/core'"
                }),
                '.'
            ]
        })
};
