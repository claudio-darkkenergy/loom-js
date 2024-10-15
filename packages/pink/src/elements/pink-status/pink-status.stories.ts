import {
    PinkStatus,
    PinkStatusState,
    type PinkStatusProps
} from './pink-status';
import type { Meta, StoryObj } from '@loom-js/storybook';

const meta: Meta<PinkStatusProps> = {
    title: 'Elements/PinkStatus',
    component: PinkStatus
};

export default meta;

export const Complete: StoryObj<PinkStatusProps> = {
    args: {
        status: PinkStatusState.Complete
    }
};

export const Failed: StoryObj<PinkStatusProps> = {
    args: {
        status: PinkStatusState.Failed
    }
};

export const Pending: StoryObj<PinkStatusProps> = {
    args: {
        status: PinkStatusState.Pending
    }
};

export const Processing: StoryObj<PinkStatusProps> = {
    args: {
        status: PinkStatusState.Processing
    }
};

export const Warning: StoryObj<PinkStatusProps> = {
    args: {
        status: PinkStatusState.Warning
    }
};
