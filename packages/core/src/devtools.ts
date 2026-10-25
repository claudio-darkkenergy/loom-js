// `@loom-js/core/devtools` — the introspection surface a devtools
// implementation drives, plus the registration and naming entry points the
// loom build tool injects. Shares module instances with the main entry.
export {
    describeActivity,
    isInspectableActivity
} from './lib/devtools/activity-ref';
export type { InspectableActivity } from './lib/devtools/activity-ref';
export {
    inspectActivities,
    inspectContext,
    inspectNode,
    inspectTree,
    isInspectRecord,
    nodeNameOf
} from './lib/devtools/console-api';
export type { ActivityRecord, InspectRecord } from './lib/devtools/console-api';
export { setDevtoolsHook, takeBufferedEvents } from './lib/devtools/hook';
export type { DevtoolsHook } from './lib/devtools/hook';
export { displayNameOf, nameComponent } from './lib/devtools/names';
export { registerDevtools } from './lib/devtools/switch';
export type {
    DevtoolsBackend,
    DevtoolsEnableOptions,
    DevtoolsLoader,
    DevtoolsModule,
    DevtoolsPlacement
} from './lib/devtools/switch';
export {
    activitiesOf,
    childContextsOf,
    findOwnerContext,
    getAppRoots,
    kindOf
} from './lib/devtools/tree';
export type { InspectableKind } from './lib/devtools/tree';
export type { ComponentContextPartial } from './types';
