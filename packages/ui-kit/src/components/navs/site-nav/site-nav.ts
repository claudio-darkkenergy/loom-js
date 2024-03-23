import styles from './styles.scss';
import { Styled } from '@app/utils';
import { Nav, NavProps } from '@loom-js/tags';

export type StyledSiteNavProps = NavProps;
export const StyledSiteNav = Styled(Nav, styles.siteNav);
