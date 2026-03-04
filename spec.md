# Specification

## Summary
**Goal:** Fix the Profile view so it reliably loads and renders for users with one or multiple organization memberships, without blank screens caused by backend authorization traps or uncaught query errors.

**Planned changes:**
- Backend: Add a stable query-only membership resolution method (e.g., `getGroupsByCaller()` and/or `getGroupsByUser(user : Principal)`) derived from the existing membership source of truth (`profileMembers` / `getProfileMemberships`) that returns safe results (including empty lists) instead of trapping on authorization issues.
- Backend: Ensure returned membership data includes enough fields for frontend selection (at minimum `profileId`, `organizationName`, and `role` when available).
- Frontend: Update the Profile loading flow (in `frontend/src/pages/HomePage.tsx` and related query logic in `frontend/src/hooks/useQueries.ts`) to use the new backend membership-resolution method and to handle rejections/Unauthorized without breaking rendering.
- Frontend: Add defensive error handling in `useProfile()` and `useGetCallerUserProfile()` (and any other Profile view fetches) so backend rejections become safe return values (`null`/`[]`) and do not propagate as uncaught errors.
- Frontend: Ensure the Profile view auto-selects when there is exactly one membership; shows an organization chooser when there are multiple memberships and none/invalid is selected; and shows a readable fallback error state with a retry action when loading fails.

**User-visible outcome:** Navigating to the Profile view no longer results in a blank or broken screen; users with one membership are taken directly to that organization’s profile, users with multiple memberships are prompted to choose an organization, and any loading/authorization failures show an English fallback message with a working retry.
