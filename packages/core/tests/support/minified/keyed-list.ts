import { activity, component, init } from '../../../src';

// A keyed list over a fresh core copy. Served minified by
// `minified-fixture-plugin.mjs`, so every function in here — core's context
// functions included — carries a mangled name.
const labels = activity<string[]>([]);
const created: string[] = [];

const Item = component<{ label: string }>((html, { label, onCreated }) => {
    onCreated(() => created.push(label));

    return html`
        <li data-item=${label}>${label}</li>
    `;
});

const List = component(
    (html) => html`
        <ul data-minified-list>
            ${labels.effect(({ value }) =>
                value.map((label) => Item({ key: label, label }))
            )}
        </ul>
    `
);

export const createdLabels = () => [...created];

export const update = (next: string[]) => labels.update(next);

export const mount = (root: HTMLElement, initial: string[]) => {
    labels.update(initial);

    return new Promise<HTMLElement>((resolve) =>
        init({
            app: List(),
            onAppMounted: (app) => resolve(app as HTMLElement),
            root
        })
    );
};
