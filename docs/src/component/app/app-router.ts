import { component, router } from '@loomjs/core';

import { HeaderNav } from '@app/component/app/header-nav';

export const AppRouter = component((html) => {
    const pages = {
        Home: component((html) => html`<h3>Homepage</h3>`),
        Docs: component((html) => html`<h3>Documentation</h3>`)
    };

    return html`
        <div>
            ${HeaderNav()}
            <main>
                ${router(({ value: { pathname } }) => {
                    switch (pathname) {
                        case '/':
                            return pages.Home();
                        case '/docs':
                            return pages.Docs();
                        default:
                            return pages.Home();
                        //     return NotFound();
                    }
                })}
            </main>
        </div>
    `;
});
