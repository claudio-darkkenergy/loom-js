---
slug: configuration
title: Configuration
---
## AppGlobalConfig

Boot-time configuration rides in on `init`'s (& `hydrate`'s) `globalConfig` — see [Bootstrapping](/docs/bootstrapping) and [Client Hydration](/docs/hydration):

- interface `AppGlobalConfig` = `{ debug?: boolean; debugScope?: ConfigDebugAllowable; events?: string[]; token?: string; }`
    - `debug` & `debugScope` - Opt-in debug narration switches — see [Diagnostics](/docs/diagnostics).
    - `events` - Extra event names appended to the defaults the template renderer recognizes for `$event` bindings (equivalent to calling `appendEvents`, below).
    - `token` - [Default: `'⚡'`] The placeholder token the template renderer uses during dynamic value resolution. Change it only if the default could collide with your content.

## appendEvents

**`appendEvents(eventsToAppend)`** - The template renderer recognizes `$event` bindings for the standard [`GlobalEventHandlers`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers) set (`click`, `input`, `change`, …). If an event you bind isn't in that list — a custom event, or a newer DOM event — append it before the binding template renders:

```ts
import { appendEvents } from '@loom-js/core';

appendEvents(['my-custom-event']);
```

**Inclusion** `import { appendEvents } from '@loom-js/core';`
