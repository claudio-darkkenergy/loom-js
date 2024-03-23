import styles from './styles.scss';
import { Styled } from '@app/utils';
import { Nav, NavProps } from '@loom-js/tags';

export type StyledDrawerSiteNavProps = NavProps;
export const StyledDrawerSiteNav = Styled(Nav, styles.drawerSiteNav);
