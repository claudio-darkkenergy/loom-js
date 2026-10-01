# Loomjs

## Install all workspace dependencies

`pnpm install`

## Run apps for development

`pnpm dev`

## Filter commands to workspace

`pnpm -F {ws-name} {command}`

## Releases

Packages are versioned and published with [changesets](https://github.com/changesets/changesets). The publish workflow is [`.github/workflows/publish-packages.yml`](.github/workflows/publish-packages.yml).

### Releasing a package change

1. Add a changeset with every package change: `pnpm changeset`. Commit the generated file with the change.
2. Preview the pending releases: `pnpm status-packages`.
3. Land the change on `edge`, then merge `edge` into `main`.
4. The push to `main` runs the publish workflow, which opens or updates the **Version Packages** pull request. That pull request holds the version bumps and changelog entries.
5. Merge the Version Packages pull request. The workflow runs again and publishes the packages to npm.

Never edit a `version` field by hand. Changesets writes them.

Apps deploy to production through Vercel on the same merge to `main`. App deploys do not depend on the npm publish.

### Versioning rules

- Packages below 1.0 take a **minor** bump for a breaking change and a **patch** bump for a fix. A major bump would move the package to 1.0.0 before it is ready.
- `@loom-js/pink` cannot take 1.0.0, because that version was already published to npm and cannot be reused. Its next major is 2.0.0.
- Private packages, such as `@loom-js/eslint-plugin`, stay unpublished until they reach 1.0.

### Branches

- Work lands on `edge`. The format check and the core tests run on every push to `edge`.
- A release is `edge` merged directly into `main`, without a pull request.
- After the Version Packages pull request merges, fast-forward `edge` onto `main`.
- Outside contributions: open your pull request against `edge`, not `main`. The format check and the core tests run on it. `main` is for releases only, because every push to it runs the publish workflow.
