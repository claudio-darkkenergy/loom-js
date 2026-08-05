export * from './get-paths';
// `register-custom-element` is intentionally NOT re-exported — this barrel is
// imported by every consumer, and re-exporting registration here would keep it
// in bundles that never call `defineElement`. Import it by path instead.
export * from './set-updates-for-paths';
