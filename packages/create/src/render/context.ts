import type { Choices } from '../choices';
import type { PackageManager } from '../package-manager';
import type { Formatter, TaskRunner, UiKit } from '../registry';

/** What every renderer reads: the choices with their registry entries resolved. */
export interface RenderContext {
    choices: Choices;
    /** The root package name. */
    name: string;
    packageManager: PackageManager;
    formatter?: Formatter;
    taskRunner?: TaskRunner;
    uiKit?: UiKit;
}

export const TAILWIND_INPUT = './src/styles.css';
export const TAILWIND_OUTPUT = './.generated/styles.css';
export const BASE_STYLESHEET = './public/styles/base.css';

/** The app's own scripts, in the order the README lists them. */
export const appScripts = ({ choices }: RenderContext) => [
    'dev',
    'build',
    ...(choices.js ? [] : ['type-check'])
];

/** Whether the formatter's files and scripts live in the app's own package. */
export const formatterInApp = ({ choices, formatter }: RenderContext) =>
    Boolean(formatter) && choices.layout === 'single';
