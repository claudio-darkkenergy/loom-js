import { APP_ROOT_ID, component, init } from '@loom-js/core';
import { PinkButton, PinkCard, PinkTag } from '@loom-js/pink';
import '@loom-js/pink/icons.css';

const App = component(
    (html) => html`
        <main class="mx-auto flex max-w-xl flex-col gap-6 px-4 py-12">
            <h1
                class="text-3xl font-bold text-[hsl(var(--color-primary-100))]"
            >
                Pink + Tailwind
            </h1>
            <${PinkCard} className="flex flex-col gap-4 rounded-2xl shadow-lg">
                <p class="text-sm text-gray-500">
                    Pink styles every component; Tailwind utilities on top
                    override it.
                </p>
                <${PinkTag} className="mt-4 self-start uppercase" id="utility-tag" isSuccess>
                    Synced
                </>
                <div class="flex gap-3">
                    <${PinkButton} id="pink-button" icon="icon-check">Save</>
                    <${PinkButton}
                        className="bg-red-500 text-white hover:bg-red-600"
                        id="utility-button"
                        isSecondary
                    >
                        Delete
                    </>
                </div>
            </>
        </main>
    `
);

init({
    app: App(),
    root: document.getElementById(APP_ROOT_ID) as HTMLElement
});
