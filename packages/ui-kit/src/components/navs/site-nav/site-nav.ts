import { Nav, NavProps } from '@loom-js/components/simple';
import { Styled } from '@app/utils';

import styles from './styles.scss';

export type StyledSiteNavProps = NavProps;
export const StyledSiteNav = Styled(Nav, styles.siteNav);
