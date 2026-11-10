---
'@loom-js/core': minor
---

`@loom-js/core/devtools` adds `nameActivity(activity, name)`, which labels an activity that has no label yet (an explicit `label` always wins), and `describeActivity` reports whether the activity's name is a label (`labeled`). The loom build tool uses `nameActivity` to label activities from their bindings. Core now labels the activities it creates itself, so devtools and diagnostics name them: `⟨router.location⟩`, `⟨router.route⟩`, `⟨router.page⟩` and `⟨lazyImport(key)⟩`.
