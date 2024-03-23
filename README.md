# Loomjs

## Install all workspace dependencies

`pnpm install`

## Run apps for development

`pnpm dev`

## Filter commands to workspace

`pnpm -F {ws-name} {command}`

## CI Process

Once changes are merged into the `main` branch:

-   all apps with changes will deploy to production.
-   all packages with changes will have their versions bumped & published to npm.
