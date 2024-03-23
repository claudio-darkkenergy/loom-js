import { UiSprite, UiSpriteId } from '@app/components/simple';
import { component, MouseEventListener } from '@loom-js/core';

export interface CloseButtonProps {
    className?: string;
    onClick: MouseEventListener;
}

export const CloseButton = component<CloseButtonProps>(
    (html, { className, onClick = () => {} }) =>
        html`
            <button $click="${onClick}" class="${className}">
                ${UiSprite({
                    svgId: UiSpriteId.X
                })}
            </button>
        `
);
