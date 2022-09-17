import { component } from '@loomjs/core';

interface LogoProps {
    className: string;
    logo: Node;
}

const Logo = component(
    (html, { logo, className }: LogoProps) =>
        html`<div class="${className}">${logo}</div>`
);

export default Logo;
