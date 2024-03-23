import styles from './styles.scss';
import { ComponentOptionalProps } from '@loom-js/core';
import { Button, ButtonProps } from '@loom-js/tags';
import classNames from 'classnames';

export type StyledSiteNavButtonProps = ButtonProps & ComponentOptionalProps;

export const StyledSiteNavButton = ({
    className,
    ...buttonProps
}: StyledSiteNavButtonProps) =>
    Button({
        ...buttonProps,
        className: classNames(className, styles.siteNavButton)
    });
