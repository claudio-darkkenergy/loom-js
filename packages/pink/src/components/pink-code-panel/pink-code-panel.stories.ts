import { PinkCodePanelProps } from './pink-code-panel';
import { PinkCodePanelHeader } from './pink-code-panel-header';
import type { Meta, StoryObj } from '@loom-js/storybook';

const meta: Meta = {
    title: 'Components/PinkCodePanel/PinkCodePanelHeader',
    render: PinkCodePanelHeader
};

export default meta;

type Story = StoryObj<PinkCodePanelProps>;

export const Primary: Story = {
    args: {}
};
