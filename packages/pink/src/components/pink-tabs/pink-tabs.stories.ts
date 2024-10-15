import { type LinkItemProps, PinkTabs, type PinkTabsProps } from './pink-tabs';
import type { Meta, StoryObj } from '@loom-js/storybook';

const meta: Meta<typeof PinkTabs> = {
    title: 'Components/PinkTabs',
    component: PinkTabs
};

export default meta;

const tabsListProps = {
    itemProps: [
        {
            href: '#',
            children: 'Item 1',
            isSelected: true
        },
        {
            href: '#',
            children: 'Item 2'
        },
        {
            href: '#',
            children: 'Item 3'
        }
    ] as LinkItemProps[]
};

export const WithControls: StoryObj<PinkTabsProps> = {
    args: {
        tabsListProps
    }
};

export const WithoutControls: StoryObj<PinkTabsProps> = {
    args: {
        hideControls: true,
        tabsListProps
    }
};
