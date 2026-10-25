// Stands in for `@loom-js/devtools` in the devtools build tests.
export const activate = () => ({
    deactivate() {},
    marker: 'FAKE_DEVTOOLS_MARKER',
    open() {},
    select() {}
});
