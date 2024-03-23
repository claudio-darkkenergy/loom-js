import { Nav, NavProps } from '@loom-js/components/simple';
import { Styled } from '@app/utils';

import styles from './styles.scss';

export type StyledDrawerSiteNavProps = NavProps;
export const StyledDrawerSiteNav = Styled(Nav, styles.drawerSiteNav);
