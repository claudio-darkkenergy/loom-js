import { activity, component } from '@loom-js/core';
import { PinkButton, PinkCard } from '@loom-js/pink';

const count = activity(0);

export default component(
    (html) => html`
        <section>
            <h1>Welcome to loom</h1>
            <${PinkCard} id="welcome-card">
                <p>Edit <code>src/pages/home.ts</code> and save to reload.</p>
                <${PinkButton}
                    icon="icon-check"
                    onClick=${() => count.update(count.value() + 1)}
                >
                    ${count.effect(({ value }) => `Clicked ${value} times`)}
                </>
            </>
        </section>
    `
);
