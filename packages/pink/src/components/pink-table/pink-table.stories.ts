import { ArgType, type Meta, type StoryObj } from '@loom-js/storybook';

import { PinkTable, type PinkTableProps } from './pink-table';

const meta: Meta = {
    title: 'Components/PinkTable',
    component: PinkTable,
    argTypes: {
        children: ArgType.disable
    }
};

export default meta;

type Story = StoryObj<PinkTableProps>;

const hookRows: [string, string][] = [
    ['onCreated', 'Once — on the first render.'],
    ['onRendered', 'On every render, after dynamic values apply.'],
    ['onMounted', 'When the node attaches to the live document.']
];

const tableChildren = [
    PinkTable.Head({
        children: PinkTable.Row({
            children: [
                PinkTable.HeadCol({ children: 'Hook' }),
                PinkTable.HeadCol({ children: 'Fires' })
            ]
        })
    }),
    PinkTable.Body({
        children: hookRows.map(([hookName, hookTiming]) =>
            PinkTable.Row({
                children: [
                    PinkTable.Col({ children: hookName }),
                    PinkTable.Col({ children: hookTiming })
                ]
            })
        )
    })
];

export const Table: Story = {
    args: {
        children: tableChildren
    }
};

export const RemoveOuterStyles: Story = {
    args: {
        children: tableChildren,
        isRemoveOuterStyles: true
    }
};

export const ScrollWrapped: Story = {
    render: (props) =>
        PinkTable.Wrapper({
            withScroll: true,
            children: PinkTable({ ...props, children: tableChildren })
        })
};
