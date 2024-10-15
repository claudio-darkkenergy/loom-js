import { component } from '@loom-js/core';

const HelloWorld = component<{
    color?: string;
    getAge?: () => number;
    name?: string;
}>(function helloWorld(html, { children, ...props }) {
    console.log({ props });
    return html`
        <h2
            $click=${() => console.log('hello clicked!')}
            class="u-cross-right heading-level-6"
            style=${{ color: props.color }}
        >
            ${`Hello ${props.name}, I'm ${props.getAge && props.getAge()} years old!`}
            ${children}
        </h2>
    `;
});

export default HelloWorld;
