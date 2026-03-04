# Version 20 Rollback Smoke Test

This document provides a manual smoke-test checklist to verify the three primary entry flows after rolling back to Version 20 behavior.

## Test Environment Setup
1. Clear browser cache and local storage
2. Open browser developer console to monitor for errors
3. Have multiple browser profiles/incognito windows ready for testing different user states

## Test Cases

### 1. Unauthenticated User Flow
**Expected:** User sees the login page

**Steps:**
1. Open the application in a fresh browser session (incognito/private mode)
2. Verify the login page renders with:
   - Montreal Food System branding
   - Login button
   - Feature highlights
   - No blank screen or loading spinner stuck indefinitely

**Console Check:**
- No runtime errors should appear
- No "Unauthorized" errors
- No infinite loading loops

**Pass Criteria:**
✅ Login page renders completely
✅ No console errors
✅ Login button is clickable

---

### 2. Authenticated User with Existing Profile
**Expected:** User reaches the home page

**Steps:**
1. Login with Internet Identity (user who has already created a profile)
2. Wait for authentication to complete
3. Verify the home page renders with:
   - Header with navigation
   - Profile information displayed
   - Map view or main content area
   - Footer

**Console Check:**
- No "profile not found" errors
- No infinite loading states
- Profile data loads successfully

**Pass Criteria:**
✅ Home page renders with full navigation
✅ User profile data is displayed
✅ All navigation links are functional
✅ No console errors

---

### 3. Authenticated User without Profile (Onboarding)
**Expected:** User reaches onboarding/join flow without getting stuck

**Steps:**
1. Login with Internet Identity (new user with no profile)
2. Wait for authentication to complete
3. Verify onboarding page renders with:
   - Choice between "Organization" and "Member" options
   - Clear call-to-action buttons
   - No blank screen
   - No infinite loading spinner

**Console Check:**
- No errors related to missing profile
- No infinite query loops
- Join request status queries complete successfully

**Pass Criteria:**
✅ Onboarding page renders with both options
✅ Can navigate to registration form (Organization path)
✅ Can navigate to member join form (Member path)
✅ No console errors
✅ Page does not get stuck in loading state

---

## Common Issues to Watch For

### Blank Screen Indicators
- White/empty page with no content
- Loading spinner that never completes
- React error boundaries not catching errors

### Console Error Patterns
- "actor.adminGetAllNeeds is not a function"
- "actor.adminSearchNeeds is not a function"
- Uncaught promise rejections
- Infinite query retry loops

### Loading State Issues
- `isLoading` stuck at `true`
- `isFetched` never becomes `true`
- Profile queries that never resolve

---

## Recovery Actions

If any test fails:
1. Check browser console for specific error messages
2. Verify network tab shows successful API calls
3. Clear all cached data and retry
4. Document the exact error message and reproduction steps

---

## Development Helper

When running in development mode, the App component logs key flow decisions to help validate the three entry paths. Look for console messages indicating:
- Authentication state
- Profile loading state
- Join request status
- Routing decisions
