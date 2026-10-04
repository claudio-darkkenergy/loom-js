## REMOVED Requirements

### Requirement: CSS-only third-party packages have ambient declarations

**Reason**: The only CSS-only third-party packages the app imported were `@appwrite.io/pink` and `@appwrite.io/pink-icons`. The stylesheet and icon font now come from `@loom-js/pink` as `.css` subpath imports, which the app's existing `declare module '*.css'` covers.

**Migration**: Delete the two `declare module '@appwrite.io/…'` entries from `apps/loom/src/app/types/declarations.d.ts` and import `@loom-js/pink/pink.css` and `@loom-js/pink/icons.css` in `bootstrap.ts`.
