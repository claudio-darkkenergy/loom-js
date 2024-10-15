import { PinkCodePanel, PinkCodePanelProps } from './pink-code-panel';
import { ArgType, type Meta, type StoryObj } from '@loom-js/storybook';

const { parameters } = (globalThis as any).storybook;

const meta: Meta = {
    title: 'Components/PinkCodePanel',
    component: PinkCodePanel,
    parameters: {
        decorator: parameters.decorator.block.left()
    },
    argTypes: {
        children: ArgType.disable
    }
};

export default meta;

type Story = StoryObj<PinkCodePanelProps>;

const codePanelContent = PinkCodePanel.Content({
    children: [
        'PinkCodePanel({',
        '   children: [',
        '       PinkCodePanel.Header({}),',
        '       PinkCodePanel.Content({',
        '           children: preformattedCode',
        '       })',
        '   ]',
        '})'
    ].join('\n')
});

export const WithHeader: Story = {
    args: {
        children: [
            PinkCodePanel.Header({ children: 'Code Panel' }),
            codePanelContent
        ]
    }
};

export const WithoutHeader: Story = {
    args: {
        children: [codePanelContent]
    }
};
