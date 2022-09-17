import { StandardDrawer, StandardDrawerProps } from '@app/component/simple';
import { Styled } from '@app/utils';

import styles from './styles.scss';

export const StyledSiteDrawer = Styled<StandardDrawerProps>(
    StandardDrawer,
    styles.siteDrawer
);
