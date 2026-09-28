---
'@loom-js/core': minor
---

Templates now collapse formatting whitespace. A static whitespace run that contains a newline becomes one space between content on separate lines, and is removed at the start or end of an element's children and of the template. Whitespace without a newline, interpolated values, whitespace inside tags, and the contents of `pre`, `textarea`, `script`, and `style` are unchanged.

The DOM shape changes: templates produce fewer text nodes, so `childNodes` counts and `innerHTML` snapshots differ (re-record snapshot tests), and a fragment-rooted component's node list no longer starts or ends with a whitespace text node. Rendering under normal CSS looks the same. Elements styled `white-space: pre-wrap` no longer show template indentation; use `pre` or an interpolated string for content whose line breaks matter.
