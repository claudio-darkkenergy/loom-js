import { ComponentOptionalProps } from '@loomjs/core';
import classNames from 'classnames';

import { Button, ButtonProps } from '@app/component/simple';

import styles from './styles.scss';

export type StyledSiteNavButtonProps = ButtonProps & ComponentOptionalProps;

export const StyledSiteNavButton = ({
    className,
    ...buttonProps
}: StyledSiteNavButtonProps) =>
    Button({
        ...buttonProps,
        className: classNames(className, styles.siteNavButton)
    });
