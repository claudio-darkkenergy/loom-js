# Tasks — server-dom-compat

## 1. Red

- [ ] 1.1 Add `jsdom` + `happy-dom` to core devDeps; parameterize the server render tests by window factory (D2); confirm Happy DOM red on the matrix reproducer, jsdom green

## 2. Fix

- [ ] 2.1 Diagnose the empty-name `setAttribute` source (D1) and fix upstream; matrix green; full browser suite unchanged
- [ ] 2.2 **Patch** changeset

## 3. Docs

- [ ] 3.1 Update the "Choosing a DOM implementation" boundary paragraph (README + topic 10, draft re-push): Happy DOM verified, one-per-process rule retained
