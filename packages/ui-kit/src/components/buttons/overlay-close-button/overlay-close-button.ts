import styles from './styles.scss';
import { Styled } from '@app/utils';
import { CloseButton } from '@loom-js/tags/simple/buttons/close-button';

export const StyledOverlayCloseButton = Styled(
    CloseButton,
    styles.overlayCloseBtn
);
