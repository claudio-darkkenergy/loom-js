import styles from './styles.scss';
import { Styled } from '@app/utils';
import { StandardDrawer, StandardDrawerProps } from '@loom-js/tags';

export const StyledSiteDrawer = Styled<StandardDrawerProps>(
    StandardDrawer,
    styles.siteDrawer
);
