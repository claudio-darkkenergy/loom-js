import { PinkCodePanel, PinkCodePanelProps } from './pink-code-panel';
import { PinkCodePanelContent } from './pink-code-panel-content';
import { PinkCodePanelHeader } from './pink-code-panel-header';
import type { Meta, StoryObj } from '@loom-js/storybook';

const meta: Meta = {
    title: 'Components/PinkCodePanel',
    render: PinkCodePanel as () => HTMLDivElement,
    argTypes: {
        children: {
            table: { disable: true }
        }
    }
};

export default meta;

type Story = StoryObj<PinkCodePanelProps>;

const codePanelContent = PinkCodePanelContent({
    children: [
        'PinkCodePanel({',
        '   children: [',
        '       PinkCodePanelHeader({}),',
        '       PinkCodePanelContent({',
        '           children: preformattedCode',
        '       })',
        '   ]',
        '})'
    ].join('\n')
});

export const WithHeader: Story = {
    args: {
        children: [
            PinkCodePanelHeader({ children: 'Code Panel' }),
            codePanelContent
        ]
    }
};

export const WithoutHeader: Story = {
    args: {
        children: [codePanelContent]
    }
};
