import { init } from '@loom-js/core';

import { App } from '@app/component/app';

// import { Main } from '@app/component/container/regions/main';
// import { Test } from '@app/component/test';
// import { AppRouter } from '@app/component/app/app-router';

init({
    app: App(),
    onAppMounted: () => {
        // Used for `PrerenderSsgWebpackPlugin` static-site-generation.
        // setTimeout(() => {
        //     if ((window as any).snapshot) {
        //         (window as any).snapshot();
        //     }
        // }, 500);
    },
    root: document.getElementById('app-root')
});
