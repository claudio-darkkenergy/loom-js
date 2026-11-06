import { activity, component } from '@loom-js/core';

const count = activity(0);

export default component(
    (html) => html`
        <section>
            <h1>Welcome to loom</h1>
            <p>
                Edit
                <code>src/pages/home.ts</code>
                and save to reload.
            </p>
            <button
                $click=${() => count.update(count.value() + 1)}
                type="button"
            >
                ${count.effect(({ value }) => `Clicked ${value} times`)}
            </button>
        </section>
    `
);
