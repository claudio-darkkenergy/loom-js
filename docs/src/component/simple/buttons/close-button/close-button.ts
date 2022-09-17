import { component, MouseEventListener } from '@loomjs/core';

import { UiSprite, UiSpriteId } from '@app/component/simple';

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
