# BookNest Project Documentation: Google Authentication to Cloud Sync, UX, Diagnostics, and Loading Flow

Document generated: 18 May 2026  
Project: BookNest web app  
Production domain: `https://booknest.website/`  
Repository: `MiloHasReturned/BookNest`  
Main branch evidence range: `35ff4b6` through `001d80b`

## 1. Purpose of This Document

This document records the major work completed after Google Authentication was added to BookNest. It covers what changed, why it changed, what errors appeared, how each issue was fixed, and what evidence supports those fixes.

It is designed to be used as:

- A project record for assessment, handover, or future development.
- A technical explanation of how Google sign-in, Supabase storage, invites, diagnostics, and loading states work.
- A screenshot guide showing exactly where screenshots can be inserted.
- A troubleshooting reference for future errors.

Sensitive values such as API keys, Supabase service-role keys, Google client secrets, and email verification keys are intentionally not included.

## 2. High-Level Summary

Since Google Authentication was added, BookNest has changed from a mostly local-browser app into a cloud-backed shared calendar app.

The major improvements were:

- Google sign-in was added using Google Identity Services.
- Signed-in users now have account profiles based on Google identity.
- Supabase backend storage was added for profiles, calendars, memberships, calendar state, and invites.
- Invite links were replaced with a better email-address-based invite flow.
- Cloud sync was hardened so shared calendars, reservations, notes, and chat data can load across devices.
- Local sign-out behavior was fixed so one user’s data does not stay visible after signing out.
- Sign-in behavior was fixed so existing cloud data loads before local saves happen.
- Background animations and customization UI were heavily redesigned.
- Cloud sync errors were made less noisy and more understandable.
- A detailed diagnostics system was added to identify the source of cloud failures.
- A boot loading screen was added to reduce half-loaded UI and improve perceived performance.

## 3. Evidence Sources

The documentation is based on the current project files and git history.

Important evidence:

- Commit `35ff4b6`, dated 6 May 2026 08:18:09 +1000: `Add Google sign-in account flow`
- Commit `f0ff819`, dated 6 May 2026 10:11:28 +1000: `Add Supabase cloud storage sync`
- Commit `0386c6d`, dated 6 May 2026 10:38:49 +1000: `Harden shared calendar cloud sync`
- Commit `6553899`, dated 6 May 2026 14:07:03 +1000: `Send calendar invites by email address`
- Commit `de3b2d7`, dated 8 May 2026 08:15:19 +1000: `Clear local BookNest data on sign out`
- Commit `cf1158e`, dated 8 May 2026 08:18:52 +1000: `Load cloud data before saving after sign in`
- Commit `dda7d94`, dated 8 May 2026 08:29:16 +1000: `Overhaul background animations`
- Commit `5ed7d03`, dated 18 May 2026 08:33:45 +1000: `Revamp dashboard and customization UX`
- Commit `d753673`, dated 18 May 2026 10:24:28 +1000: `Improve cloud sync diagnostics`
- Commit `001d80b`, dated 18 May 2026 12:52:20 +1000: `Add Book Nest boot loading screen`

Important files:

- `src/components/book-nest/GoogleSignInButton.tsx`
- `src/lib/googleIdentity.ts`
- `src/lib/googleSession.ts`
- `src/lib/booknestCloud.ts`
- `src/lib/cloudDiagnostics.ts`
- `src/lib/cloudDiagnostics.test.ts`
- `src/lib/inviteLinks.ts`
- `src/components/book-nest/BookNestProvider.tsx`
- `src/components/book-nest/Dashboard.tsx`
- `src/components/book-nest/CalendarDetail.tsx`
- `src/components/book-nest/BookNestLoadingScreen.tsx`
- `supabase/schema.sql`
- `README.md`
- `vite.config.ts`
- `package.json`
- `src/styles.css`

## 4. Timeline of Work

### 4.1 Before Google Authentication

Before this documented phase, BookNest had already been converted into a Bun-powered TanStack Start web app and deployed through Vercel/Nitro work.

Relevant earlier deployment fixes included:

- Node/Vercel configuration changes.
- Vercel output and SSR routing fixes.
- Email verification proxy setup.
- Fixes for `404: NOT_FOUND` deployment behavior.

This document focuses on the period after Google Authentication was added.

### 4.2 6 May 2026, 08:18:09 +1000: Google Sign-In Added

Commit: `35ff4b6`  
Subject: `Add Google sign-in account flow`

Files changed:

- `README.md`
- `src/components/book-nest/BookNestProvider.tsx`
- `src/components/book-nest/Dashboard.tsx`
- `src/components/book-nest/GoogleSignInButton.tsx`
- `src/lib/googleIdentity.ts`
- `src/styles.css`
- `src/vite-env.d.ts`

What was added:

- A Google sign-in button component.
- Google Identity Services script loading.
- A browser-side `VITE_GOOGLE_CLIENT_ID` environment variable.
- Account profile integration in BookNest.
- UI for signed-in account state.

Evidence:

- `GoogleSignInButton.tsx` reads `import.meta.env.VITE_GOOGLE_CLIENT_ID`.
- `googleIdentity.ts` loads `https://accounts.google.com/gsi/client`.
- `vite-env.d.ts` defines `VITE_GOOGLE_CLIENT_ID`.
- `README.md` documents the Google OAuth setup steps.

Screenshot placeholder:

`[Screenshot: Google Cloud OAuth client configuration showing Authorized JavaScript origins for https://booknest.website]`

`[Screenshot: BookNest sign-in screen or Google sign-in button]`

### 4.3 6 May 2026, 10:02:07 +1000: Invite Links Added

Commit: `dc23450`  
Subject: `Replace self invites with invite links`

Files changed:

- `src/components/book-nest/CalendarDetail.tsx`
- `src/components/book-nest/Dashboard.tsx`
- `src/lib/inviteLinks.ts`
- `src/styles.css`

Why it was needed:

The earlier invite behavior could result in the invite appearing for the sender instead of the intended recipient. That was a major problem because shared calendar invites are one of the core features.

What changed:

- A calendar invite URL format was created.
- Dashboard parsing was added for invite links.
- Calendar detail UI could generate invite links.
- Invite-related UI styling was added.

Evidence:

- `src/lib/inviteLinks.ts` serializes invite payloads into URL-safe data.
- `Dashboard.tsx` reads the `invite` search param and creates local invite state when present.
- `CalendarDetail.tsx` generates a backup invite link after invite creation.

Screenshot placeholder:

`[Screenshot: Invite modal showing generated invite link]`

`[Screenshot: Browser URL containing invite parameter]`

### 4.4 6 May 2026, 10:11:28 +1000: Supabase Cloud Storage Added

Commit: `f0ff819`  
Subject: `Add Supabase cloud storage sync`

Files changed:

- `README.md`
- `src/components/book-nest/BookNestProvider.tsx`
- `src/components/book-nest/GoogleSignInButton.tsx`
- `src/lib/booknest.ts`
- `src/lib/booknestCloud.ts`
- `src/lib/emailVerification.ts`
- `src/lib/googleSession.ts`
- `supabase/schema.sql`

What was added:

- Supabase storage through TanStack server functions.
- Server-side Google token verification.
- Server-side Supabase requests using the service role key.
- Persistent Google ID token/session storage in browser local storage.
- Database schema for profiles, calendars, memberships, calendar state, and invites.
- README instructions for Supabase setup.

Evidence:

- `src/lib/booknestCloud.ts` defines server functions:
  - `loadCloudSnapshot`
  - `saveCloudSnapshot`
  - `clearCloudErrorCalendars`
  - `createCloudCalendarInvite`
  - `acceptCloudCalendarInvite`
- `supabase/schema.sql` defines:
  - `booknest_profiles`
  - `booknest_calendars`
  - `booknest_memberships`
  - `booknest_calendar_state`
  - `booknest_invites`
- `README.md` lists required backend environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GOOGLE_CLIENT_ID`

Screenshot placeholder:

`[Screenshot: Supabase SQL Editor success after running schema.sql]`

`[Screenshot: Supabase API settings showing Project URL, with sensitive keys hidden]`

`[Screenshot: Vercel environment variables page showing env var names only, values hidden]`

### 4.5 6 May 2026, 10:38:49 +1000: Shared Calendar Sync Hardened

Commit: `0386c6d`  
Subject: `Harden shared calendar cloud sync`

Files changed:

- `src/components/book-nest/BookNestProvider.tsx`
- `src/components/book-nest/CalendarDetail.tsx`
- `src/components/book-nest/Dashboard.tsx`
- `src/styles.css`

Why it was needed:

Testing showed that calendar changes were not appearing on another user’s screen after invite acceptance. Refreshing or editing from the other account did not show the shared data correctly.

What changed:

- The provider became responsible for stronger cloud load/save behavior.
- Calendar state sync was improved.
- Shared calendar handling was adjusted.
- Cloud error UI began appearing in dashboard/calendar views.

Evidence:

- `BookNestProvider.tsx` now controls cloud status, refreshes, saves, and snapshot updates.
- `CalendarDetail.tsx` and `Dashboard.tsx` display cloud status and errors.

Screenshot placeholder:

`[Screenshot: Two accounts viewing the same shared calendar after sync works]`

`[Screenshot: Cloud Sync Needs Attention panel before the fix, if available]`

### 4.6 6 May 2026, 13:48:09 +1000: Cloud Auth Required for Shared Invite Acceptance

Commit: `f026b29`  
Subject: `Require cloud auth for shared invite acceptance`

Files changed:

- `src/components/book-nest/BookNestProvider.tsx`
- `src/components/book-nest/CalendarDetail.tsx`

Why it was needed:

Shared invites depend on cloud identity. If a user accepts a shared invite without Google auth, BookNest cannot correctly connect that user to a Supabase membership.

What changed:

- Invite acceptance now requires Google sign-in when a cloud calendar ID is involved.
- The calendar invite UI was updated to guide users toward signed-in cloud behavior.

Evidence:

- `BookNestProvider.tsx` reports an issue if the user tries to accept a shared calendar invite without a Google token.
- `CalendarDetail.tsx` requires sign-in before sending cloud-backed calendar invites.

Screenshot placeholder:

`[Screenshot: Message shown when accepting invite without signing in]`

### 4.7 6 May 2026, 13:55:29 +1000: Stale Local Invited Calendars Ignored During Sync

Commit: `9d1c707`  
Subject: `Ignore stale local invited calendars during sync`

Files changed:

- `src/components/book-nest/BookNestProvider.tsx`
- `src/components/book-nest/CalendarDetail.tsx`
- `src/components/book-nest/Dashboard.tsx`
- `src/lib/booknestCloud.ts`

Problem observed:

A Supabase foreign key error appeared:

```text
insert or update on table "booknest_memberships" violates foreign key constraint
"booknest_memberships_calendar_id_fkey"
```

The error meant a membership row was being inserted for a `calendar_id` that did not exist in `booknest_calendars`.

Cause:

Some local invited calendars or old invite data existed in browser storage before the matching cloud calendar row existed. When sync tried to save that stale relationship into Supabase, the database correctly rejected it.

Fix:

- Existing invited calendar IDs are checked against actual Supabase calendars.
- Stale local invited calendars are ignored during sync.
- Cleanup handling was added for broken local cloud calendar/invite data.

Evidence:

- `booknestCloud.ts` checks existing calendars before saving accepted memberships.
- `BookNestProvider.tsx` includes cleanup flow using `clearCloudErrorCalendars`.
- `Dashboard.tsx` and `CalendarDetail.tsx` show cleanup actions for cleanable cloud errors.

Screenshot placeholder:

`[Screenshot: Original Supabase foreign key error in BookNest Cloud Sync Needs Attention panel]`

`[Screenshot: Clean Up Broken Local Invites button]`

### 4.8 6 May 2026, 14:07:03 +1000: Email-Address-Based Invites

Commit: `6553899`  
Subject: `Send calendar invites by email address`

Files changed:

- `src/components/book-nest/CalendarDetail.tsx`
- `src/lib/booknestCloud.ts`

Why it was needed:

The invite UX needed to be easier. The desired behavior was:

1. Owner enters a friend’s email.
2. The invite is stored in cloud storage.
3. The friend signs in with that Google email.
4. The invite appears under “New Invites.”

What changed:

- `createCloudCalendarInvite` was added/expanded server-side.
- Invites are saved to the `booknest_invites` table using `recipient_email`.
- Pending invites are loaded by matching the signed-in user’s email.
- The invite modal tells users the invite will appear when the recipient signs in with that Google email.
- A backup email link still exists for convenience.

Evidence:

- `booknestCloud.ts` stores invite rows in `booknest_invites`.
- `getPendingInvites(email)` queries `recipient_email` and `status=eq.pending`.
- `CalendarDetail.tsx` sends invite data using `recipientEmail`.

Screenshot placeholder:

`[Screenshot: Invite modal with recipient email field]`

`[Screenshot: Recipient account showing invite under New Invites]`

### 4.9 8 May 2026, 08:15:19 +1000: Sign-Out Data Leak Fixed

Commit: `de3b2d7`  
Subject: `Clear local BookNest data on sign out`

Files changed:

- `src/components/book-nest/BookNestProvider.tsx`
- `src/lib/booknest.ts`

Problem observed:

After signing out, calendars, reservations, and invites still remained visible in BookNest. This was a privacy and UX issue because the next user on the same device could see previous local data.

Fix:

- Google session is cleared.
- Local BookNest snapshot is reset to an empty snapshot while preserving the theme.
- Cloud state returns to local mode.

Evidence:

- `clearAccountProfile()` in `BookNestProvider.tsx` calls `clearGoogleSession()` and resets the snapshot.
- `booknest.ts` supports creating an empty snapshot.

Screenshot placeholder:

`[Screenshot: Before fix: signed-out state still showing calendars]`

`[Screenshot: After fix: signed-out state with empty dashboard]`

### 4.10 8 May 2026, 08:18:52 +1000: Sign-In Cloud Data Load Fixed

Commit: `cf1158e`  
Subject: `Load cloud data before saving after sign in`

Files changed:

- `src/components/book-nest/BookNestProvider.tsx`
- `src/lib/booknestCloud.ts`

Problem observed:

After signing back in, no calendars, reservations, or invites appeared. The risk was that a fresh local empty state could overwrite cloud data before the app loaded the existing cloud snapshot.

Fix:

- On sign-in, BookNest now loads cloud data first when local user data is empty.
- The app delays cloud-ready state while it checks for existing cloud data.
- Existing cloud calendars and profile data are restored before autosave resumes.

Evidence:

- `saveAccountProfile()` in `BookNestProvider.tsx` calls `loadCloudSnapshot` before finalizing cloud-ready state in the empty-local-data case.

Screenshot placeholder:

`[Screenshot: Signing back in and seeing restored calendars]`

### 4.11 8 May 2026, 08:29:16 +1000: Background Animation Overhaul

Commit: `dda7d94`  
Subject: `Overhaul background animations`

Files changed:

- `src/components/book-nest/AnimatedBackdrop.tsx`
- `src/components/book-nest/Dashboard.tsx`
- `src/lib/booknest.ts`
- `src/styles.css`

What changed:

- The background system became more visually expressive.
- `AnimatedBackdrop.tsx` gained additional decorative layers.
- Theme/background customization became more central to the dashboard experience.
- The CSS was heavily expanded with animation styles.

Evidence:

- `AnimatedBackdrop.tsx` renders multiple layers, orbs, ribbons, grid, sparkles, and texture.
- `booknest.ts` defines background animation styles and themes.
- `styles.css` contains the visual implementation for the background system.

Screenshot placeholder:

`[Screenshot: Background customization panel after overhaul]`

`[Screenshot: Example of animated background in dashboard]`

### 4.12 8 May 2026, 08:36:54 +1000: Expanded Background Styles

Commit: `4fdaf3b`  
Subject: `Add expanded background animation styles`

Files changed:

- `src/lib/booknest.ts`
- `src/styles.css`

What changed:

- More animation styles were added, including futuristic/professional/fractal-style options.
- Background customization became broader for different audiences.

Evidence:

- `BACKGROUND_ANIMATION_STYLES` in `booknest.ts` includes many named options.
- `styles.css` contains styling for the expanded set.

Screenshot placeholder:

`[Screenshot: Background animation list showing several style options]`

### 4.13 18 May 2026, 08:14:46 +1000: Noisy Cloud Errors Reduced

Commit: `ecdaae1`  
Subject: `Reduce noisy cloud sync errors`

Files changed:

- `src/components/book-nest/BookNestProvider.tsx`
- `src/components/book-nest/CalendarDetail.tsx`
- `src/components/book-nest/Dashboard.tsx`

Problem observed:

The “Cloud Sync Needs Attention” card appeared and disappeared repeatedly. This created confusion and made the app feel unstable.

Cause:

Some cloud failures were transient fetch/network failures. Showing an error immediately every time caused too much noise.

Fix:

- The provider tracks repeated cloud load failures.
- Silent refreshes suppress temporary fetch failures until they repeat.
- The UI shows friendlier cloud sync messaging.

Evidence:

- `BookNestProvider.tsx` includes `cloudLoadFailureCount`.
- `reportCloudLoadFailure()` treats transient fetch failures differently from persistent failures.

Screenshot placeholder:

`[Screenshot: Cloud Sync Needs Attention card before noisy-error reduction]`

### 4.14 18 May 2026, 08:18:54 +1000: Offline Cloud Sync Dismissal

Commit: `ef9e825`  
Subject: `Add offline cloud sync dismissal`

Files changed:

- `src/components/book-nest/BookNestProvider.tsx`
- `src/components/book-nest/CalendarDetail.tsx`
- `src/components/book-nest/Dashboard.tsx`

Problem observed:

Even after retrying, users could still get stuck with repeated cloud sync warnings.

Fix:

- Cloud errors can be dismissed temporarily.
- Dismissal lasts for a timed window instead of permanently hiding real issues.
- Retry and cleanup options remain available.

Evidence:

- `BookNestProvider.tsx` defines `CLOUD_ERROR_DISMISS_MS`.
- `dismissCloudError()` moves cloud state back to local mode temporarily.

Screenshot placeholder:

`[Screenshot: Cloud warning with Retry Sync and dismissal controls]`

### 4.15 18 May 2026, 08:33:45 +1000: Dashboard and Customization UX Revamp

Commit: `5ed7d03`  
Subject: `Revamp dashboard and customization UX`

Files changed:

- `src/components/book-nest/Dashboard.tsx`
- `src/styles.css`

What changed:

- Dashboard structure was redesigned.
- Customization UI became cleaner and easier to use.
- Visual hierarchy was improved.
- Layout and card styling were updated.

Evidence:

- `Dashboard.tsx` had 738 lines changed in this commit.
- `styles.css` had 347 lines changed in this commit.

Screenshot placeholder:

`[Screenshot: Dashboard after UX revamp]`

`[Screenshot: Customization panel after UX revamp]`

### 4.16 18 May 2026, 08:42:05 +1000: Background Previews and Textures Differentiated

Commit: `834b75d`  
Subject: `Differentiate background previews and textures`

Files changed:

- `src/styles.css`

Problem observed:

Background animations and previews looked too similar, like recolored versions of the same design.

Fix:

- The previews were made more visually distinct.
- Textures and style-specific details were expanded.
- Background options became easier to distinguish before selecting them.

Evidence:

- `styles.css` had 538 lines changed in this commit.

Screenshot placeholder:

`[Screenshot: Before fix, previews looking similar]`

`[Screenshot: After fix, previews with differentiated textures]`

### 4.17 18 May 2026, 10:24:28 +1000: Cloud Sync Diagnostics Added

Commit: `d753673`  
Subject: `Improve cloud sync diagnostics`

Files changed:

- `src/components/book-nest/BookNestProvider.tsx`
- `src/components/book-nest/CalendarDetail.tsx`
- `src/components/book-nest/Dashboard.tsx`
- `src/lib/booknestCloud.ts`
- `src/lib/cloudDiagnostics.test.ts`
- `src/lib/cloudDiagnostics.ts`
- `src/styles.css`

Problem observed:

Cloud errors were too vague. For example, “fetch failed” did not explain whether the issue came from Google auth, Supabase config, network failure, stale data, or permission problems.

Fix:

- Added `cloudDiagnostics.ts`.
- Added categories:
  - `network`
  - `google-auth`
  - `supabase-config`
  - `supabase-data`
  - `supabase-permission`
  - `cloud-sync`
  - `invite`
  - `unknown`
- Added diagnostics fields:
  - `Where`
  - `Source`
  - `Likely cause`
  - `Next step`
  - `Raw error`
  - `Time`
- Improved backend error messages to include the exact Supabase operation/table, for example:

```text
Supabase request failed for POST booknest_memberships: 409 ...
```

Evidence:

- `src/lib/cloudDiagnostics.ts` contains classification and advice logic.
- `src/lib/cloudDiagnostics.test.ts` tests fetch errors, foreign key errors, and missing Supabase env vars.
- `booknestCloud.ts` now throws more specific errors for missing env vars, Google token verification, and Supabase request failures.
- `Dashboard.tsx` and `CalendarDetail.tsx` render `CloudIssueDetails`.

Screenshot placeholder:

`[Screenshot: Cloud Sync Needs Attention panel with Debug details expanded]`

`[Screenshot: Raw error showing exact Supabase table operation]`

### 4.18 18 May 2026, 12:52:20 +1000: Boot Loading Screen Added

Commit: `001d80b`  
Subject: `Add Book Nest boot loading screen`

Files changed:

- `src/components/book-nest/BookNestLoadingScreen.tsx`
- `src/components/book-nest/BookNestProvider.tsx`
- `src/components/book-nest/CalendarDetail.tsx`
- `src/components/book-nest/Dashboard.tsx`
- `src/styles.css`

Problem observed:

Sometimes the website looked half-loaded or laggy. This affected navigation and made the UI feel lower quality, especially while local data, Google session state, and cloud sync were being prepared.

Fix:

- Added a dedicated boot loading screen.
- Exposed `isBooting` from `BookNestProvider`.
- Dashboard and calendar pages now wait for the initial boot state to complete before rendering heavy UI.
- The loading screen includes:
  - Book artwork.
  - Progress bar.
  - Local data step.
  - Account step.
  - Cloud sync step.
  - Theme sample.
  - Reduced-motion support.

Evidence:

- `BookNestLoadingScreen.tsx` contains the loading scene.
- `BookNestProvider.tsx` exposes `isBooting: !cloudReady`.
- `Dashboard.tsx` and `CalendarDetail.tsx` return `BookNestLoadingScreen` while `isBooting` is true.
- `styles.css` contains loading screen artwork and animation CSS.

Screenshot placeholder:

`[Screenshot: BookNest loading screen on first page load]`

`[Screenshot: Calendar-specific loading screen]`

## 5. Current Architecture

### 5.1 Frontend Framework

BookNest is currently a Bun-powered TanStack Start app using:

- React 19
- TanStack Start
- TanStack Router
- Vite
- Nitro Vercel preset
- Tailwind CSS
- Lucide React icons
- Vitest

Evidence:

- `package.json` lists the dependencies.
- `vite.config.ts` includes:
  - `tanstackStart()`
  - `nitro({ preset: 'vercel' })`
  - `tailwindcss()`
  - `viteReact()`

### 5.2 Hosting

BookNest is deployed through Vercel.

Important deployment details:

- Nitro generates Vercel output in `.vercel/output`.
- Node runtime is pinned to Node.js 22.
- The app previously hit a Vercel Node version issue when `24.x` was used.

Evidence:

- `package.json` includes:

```json
"engines": {
  "node": "22.x"
}
```

- `vite.config.ts` configures Nitro Vercel functions with `runtime: 'nodejs22.x'`.

Screenshot placeholder:

`[Screenshot: Vercel deployment settings showing Node.js 22]`

`[Screenshot: Successful Vercel deployment for latest commit]`

### 5.3 Authentication

Authentication uses Google Identity Services.

Client-side flow:

1. `GoogleSignInButton.tsx` reads `VITE_GOOGLE_CLIENT_ID`.
2. `googleIdentity.ts` loads Google Identity Services.
3. Google returns an ID token.
4. The ID token and profile are saved using `googleSession.ts`.
5. The provider stores account profile data in the BookNest snapshot.

Server-side flow:

1. `booknestCloud.ts` receives the ID token in server functions.
2. It verifies the token with Google tokeninfo:

```text
https://oauth2.googleapis.com/tokeninfo
```

3. It checks the expected audience against:

```text
GOOGLE_CLIENT_ID
```

or:

```text
VITE_GOOGLE_CLIENT_ID
```

4. It rejects invalid, expired, unverified, or wrong-audience tokens.

Environment variables:

- `VITE_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_ID`

Screenshot placeholder:

`[Screenshot: Google OAuth Client ID page, secret hidden]`

`[Screenshot: Vercel env vars showing VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID names]`

### 5.4 Backend Storage

Supabase stores persistent cloud data.

Tables:

- `booknest_profiles`
- `booknest_calendars`
- `booknest_memberships`
- `booknest_calendar_state`
- `booknest_invites`

Important relationships:

- A calendar belongs to an owner profile.
- A membership links a user email to a calendar.
- Calendar state stores reservations, day notes, and chat as JSON.
- Invites link a recipient email to a calendar.

Environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Security note:

The service role key must remain server-side only. It should never be exposed in client-side code. The current architecture uses it inside TanStack server functions in `booknestCloud.ts`.

Screenshot placeholder:

`[Screenshot: Supabase Table Editor showing tables, with user data blurred]`

`[Screenshot: Supabase API settings, keys hidden]`

### 5.5 State Management

The main app state is controlled by `BookNestProvider.tsx`.

Responsibilities:

- Read local browser snapshot.
- Apply theme.
- Save to local storage.
- Track cloud sync state.
- Load cloud snapshot.
- Save cloud snapshot.
- Handle sign-in/sign-out.
- Handle calendars, invites, reservations, day notes, and chat.
- Manage error diagnostics.
- Expose `isBooting` to avoid rendering heavy views too early.

Cloud state values:

- `local`
- `syncing`
- `synced`
- `error`

### 5.6 Invite Flow

The current invite flow is:

1. Calendar owner signs in.
2. Owner opens a calendar.
3. Owner enters recipient email.
4. BookNest syncs the owner calendar first.
5. Server function creates an invite row in Supabase.
6. Recipient signs in with the same Google email.
7. `loadCloudSnapshot` loads pending invites for that email.
8. Recipient accepts the invite.
9. Server function creates a membership.
10. Shared calendar appears under invited calendars.

Fallback:

- A backup invite link can still be copied or emailed.

Screenshot placeholder:

`[Screenshot: Owner sending invite by email]`

`[Screenshot: Recipient seeing invite under New Invites]`

`[Screenshot: Recipient accepted calendar under Invited Calendars]`

## 6. Major Errors and Fixes

### 6.1 Vercel Node Version Error

Error observed:

```text
Found invalid Node.js Version: "24.x". Please set Node.js Version to 22.x
```

Cause:

Vercel did not support the configured Node version for the project settings/build path.

Fix:

- Node runtime was pinned to Node.js 22.
- Invalid `nodeVersion` config was removed.
- Nitro Vercel output became the deployment strategy.

Evidence:

- Commits on 4 May 2026:
  - `8dc203f` Pin Vercel Node runtime
  - `3b850ee` Remove invalid Vercel nodeVersion setting
  - `bbc153c` Use Nitro Vercel output
- Current `package.json` has `"node": "22.x"`.
- Current `vite.config.ts` uses `runtime: 'nodejs22.x'`.

Screenshot placeholder:

`[Screenshot: Original Vercel Node version error]`

### 6.2 Vercel `404: NOT_FOUND`

Error observed:

```text
404: NOT_FOUND
Code: NOT_FOUND
```

Cause:

Vercel routing/output configuration did not correctly serve the TanStack Start app.

Fix:

- Deployment strategy eventually moved to Nitro Vercel output.
- Vercel output is generated correctly from `bun run build`.

Evidence:

- Current build output generates `.vercel/output`.
- `vite.config.ts` uses Nitro `preset: 'vercel'`.
- `bun run build` succeeds.

Screenshot placeholder:

`[Screenshot: Original Vercel 404 page]`

`[Screenshot: Successful BookNest homepage on booknest.website]`

### 6.3 Google OAuth `invalid_client`

Error observed:

```text
Error 401: invalid_client
The OAuth client was not found.
```

Likely cause:

The wrong client ID was entered, the OAuth client had not propagated yet, or the env var value did not match the actual Google OAuth web client ID.

Fix:

- Correct Google Web OAuth Client ID was added to Vercel.
- The app uses `VITE_GOOGLE_CLIENT_ID` on the frontend.
- Server verification checks `GOOGLE_CLIENT_ID` or `VITE_GOOGLE_CLIENT_ID`.

Evidence:

- `GoogleSignInButton.tsx` requires `VITE_GOOGLE_CLIENT_ID`.
- `booknestCloud.ts` checks Google token audience against the configured client ID.

Screenshot placeholder:

`[Screenshot: Google invalid_client error]`

### 6.4 Google OAuth `origin_mismatch`

Error observed:

```text
Error 400: origin_mismatch
```

Cause:

The app domain was not listed in Google Cloud as an Authorized JavaScript origin.

Fix:

Add the exact origin:

```text
https://booknest.website
```

Also add any Vercel preview URL if sign-in should work on preview deployments.

Evidence:

- README Google sign-in setup says to add `https://booknest.website` as an authorized JavaScript origin.

Screenshot placeholder:

`[Screenshot: Google origin_mismatch error]`

`[Screenshot: Authorized JavaScript origins containing https://booknest.website]`

### 6.5 Supabase Foreign Key Error

Error observed:

```text
insert or update on table "booknest_memberships" violates foreign key constraint
"booknest_memberships_calendar_id_fkey"
```

Cause:

A membership was being saved for a calendar ID that did not exist in the `booknest_calendars` table.

Likely user-facing situation:

- Old local invited calendar data existed.
- An invite or membership referenced a calendar that had not synced.
- A calendar was deleted from cloud storage while local state still referenced it.

Fix:

- Existing calendar IDs are checked before membership/state writes.
- Broken local invited calendars can be cleaned up.
- Diagnostics now classify this as a `supabase-data` issue.

Evidence:

- `booknestCloud.ts` checks visible/invited calendar IDs against Supabase before writing memberships/state.
- `cloudDiagnostics.ts` treats `foreign key`, `not present in table`, and `violates` as data relationship errors.
- `Dashboard.tsx` and `CalendarDetail.tsx` show cleanup options when `isCleanableCloudIssue` returns true.

Screenshot placeholder:

`[Screenshot: Foreign key error before cleanup]`

`[Screenshot: Debug details showing Source = supabase-data]`

### 6.6 Repeated `fetch failed` Cloud Sync Warning

Error observed:

```text
fetch failed
```

Cause:

This is a general network/request failure. It can be caused by:

- Temporary network failure.
- Vercel function cold start or outage.
- Supabase outage.
- Browser/network blocking.
- A transient cloud endpoint failure.

Fix:

- Transient fetch failures are suppressed during silent refreshes until they repeat.
- A dismissal flow was added.
- Diagnostics classify it as `network`.

Evidence:

- `cloudDiagnostics.ts` classifies `fetch failed`, `failed to fetch`, `networkerror`, and `network request failed` as `network`.
- `BookNestProvider.tsx` uses `cloudLoadFailureCount`.
- `CLOUD_ERROR_DISMISS_MS` prevents a dismissed warning from immediately reappearing.

Screenshot placeholder:

`[Screenshot: fetch failed warning]`

`[Screenshot: Debug details showing Source = network]`

### 6.7 Sign-Out Still Showing Data

Problem observed:

Signing out did not remove calendars, reservations, or invites from the UI.

Cause:

The local snapshot still contained the previous account’s data.

Fix:

- Sign-out now clears Google session and resets the BookNest snapshot.

Evidence:

- Commit `de3b2d7`.
- `clearAccountProfile()` in `BookNestProvider.tsx`.

Screenshot placeholder:

`[Screenshot: Signed-out account still showing data before fix]`

### 6.8 Sign-In Showing No Cloud Data

Problem observed:

Signing back in showed no calendars, reservations, or invites.

Cause:

The app risked saving empty local data before loading the user’s cloud snapshot.

Fix:

- Sign-in now loads cloud data before saving when local data is empty.

Evidence:

- Commit `cf1158e`.
- `saveAccountProfile()` in `BookNestProvider.tsx`.

Screenshot placeholder:

`[Screenshot: Restored cloud data after signing back in]`

### 6.9 Background Customization Lag and Similar Previews

Problem observed:

The background animation options looked too similar and customization felt laggy/plain.

Fix:

- Dashboard and customization UX were redesigned.
- More background styles were added.
- Preview styling and textures were differentiated.
- Reduced-motion handling exists for motion-heavy elements.

Evidence:

- Commits `dda7d94`, `4fdaf3b`, `5ed7d03`, and `834b75d`.
- `AnimatedBackdrop.tsx` and `styles.css`.

Screenshot placeholder:

`[Screenshot: Old background previews looking similar]`

`[Screenshot: New background previews with differentiated detail]`

### 6.10 Half-Loaded UI and Lag During Startup

Problem observed:

Users saw partially loaded UI and lag while the app prepared data.

Cause:

The dashboard/calendar UI could render before local storage, account state, and first cloud checks were complete.

Fix:

- Added `BookNestLoadingScreen`.
- Added provider `isBooting`.
- Dashboard and calendar routes show loading UI before full render.

Evidence:

- Commit `001d80b`.
- `BookNestLoadingScreen.tsx`.
- `BookNestProvider.tsx` exposes `isBooting`.
- `Dashboard.tsx` and `CalendarDetail.tsx` return the loading screen while booting.

Screenshot placeholder:

`[Screenshot: BookNest boot loading screen]`

## 7. Environment Variables

Current expected production env vars:

```text
VITE_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_ID
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
EMAIL_VERIFY_API_KEY
EMAIL_VERIFY_API_URL
```

Notes:

- `VITE_GOOGLE_CLIENT_ID` is public because the browser needs it.
- `GOOGLE_CLIENT_ID` is used server-side for token audience verification.
- `SUPABASE_SERVICE_ROLE_KEY` is private and must only exist server-side.
- `EMAIL_VERIFY_API_KEY` is private and must only exist server-side.
- `EMAIL_VERIFY_API_URL` can point to the email verification provider endpoint.

Screenshot placeholder:

`[Screenshot: Vercel Environment Variables list showing keys but not values]`

## 8. Database Schema Summary

The Supabase schema is stored in `supabase/schema.sql`.

### `booknest_profiles`

Stores user profile information.

Important columns:

- `email`
- `google_sub`
- `username`
- `image_data`
- `theme`

### `booknest_calendars`

Stores calendars owned by users.

Important columns:

- `id`
- `name`
- `tint_index`
- `owner_email`

### `booknest_memberships`

Connects users to calendars.

Important columns:

- `calendar_id`
- `user_email`
- `role`

### `booknest_calendar_state`

Stores calendar content.

Important columns:

- `calendar_id`
- `reservations`
- `day_notes`
- `chat`

### `booknest_invites`

Stores pending/accepted/rejected invites.

Important columns:

- `id`
- `calendar_id`
- `recipient_email`
- `sender_email`
- `sender_name`
- `status`

Screenshot placeholder:

`[Screenshot: Supabase table list]`

`[Screenshot: booknest_invites table with personal data blurred]`

## 9. Current Testing and Verification

The current verification commands are:

```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
bun x tsc --noEmit
bun test
bun run build
```

Recent verification results:

- TypeScript check passed after diagnostics and loading screen changes.
- Vitest passed with `3` diagnostics tests.
- Production build passed and generated Vercel/Nitro output.

Current automated tests:

- `src/lib/cloudDiagnostics.test.ts`

Test coverage includes:

- Fetch failures are classified as network issues.
- Supabase foreign key errors are classified as cleanable data issues.
- Missing Supabase env vars are classified as configuration issues.

Screenshot placeholder:

`[Screenshot: Terminal showing bun test passing]`

`[Screenshot: Terminal showing bun run build passing]`

## 10. Current User-Facing Features

BookNest now supports:

- Google account sign-in.
- Account profile display.
- Create calendars.
- Delete calendars.
- Invite users by email.
- Accept/reject invites.
- Shared invited calendars.
- Reservations.
- Day notes.
- Calendar chat/messages.
- Chat replies and reactions.
- Theme customization.
- Background animation customization.
- Cloud sync to Supabase.
- Offline/local fallback behavior.
- Cloud sync retry and dismissal.
- Debug details for cloud errors.
- Boot loading screen.

## 11. Known Limitations and Remaining Risks

### 11.1 Realtime Sync Is Not Fully Implemented

BookNest currently uses refresh/poll/save behavior rather than true Supabase realtime subscriptions.

Impact:

- A friend may need to wait briefly or refresh depending on timing.
- Future improvement could add Supabase Realtime channels for calendar state updates.

### 11.2 Conflict Resolution Is Basic

Calendar state is saved as JSON arrays/objects.

Impact:

- If two users edit the same calendar at the same time, the latest save may overwrite parts of previous state.
- Future improvement could split reservations, day notes, and chat into separate relational tables.

### 11.3 Service Role Key Requires Care

The service role key has high privileges.

Impact:

- It must stay server-side.
- It must never be committed, screenshotted, or exposed to the browser.

### 11.4 Invite Acceptance Depends on Matching Email

The recipient must sign in with the same Google email used in the invite.

Impact:

- If the friend signs in with another email, the invite will not appear.
- Future improvement could support invite forwarding or account linking.

### 11.5 Loading Screen Improves Perception, Not All Performance

The loading screen prevents half-rendered UI, but it does not remove every possible performance issue.

Potential future performance work:

- Lazy-load customization UI.
- Reduce heavy background effects on low-power devices.
- Add a “Performance Mode” toggle.
- Use virtualization if calendar/invite lists become large.

## 12. Recommended Future Work

Priority recommendations:

- Add Supabase Realtime for shared calendar updates.
- Add stronger conflict handling for simultaneous edits.
- Add more automated tests around invite creation and cloud snapshot merging.
- Add end-to-end tests for sign-in, invite, accept invite, reservation sync, and sign-out.
- Add a user-visible sync status indicator with last synced time.
- Add a “Performance Mode” setting for low-power devices.
- Create a privacy/security page explaining what data is stored.
- Add backup/export/import for user data.

## 13. Screenshot Checklist

Add screenshots in these places:

- Google OAuth client configuration.
- Vercel environment variables with values hidden.
- Supabase schema/table list.
- Supabase SQL success after schema run.
- BookNest Google sign-in button.
- Successful signed-in account display.
- Invite modal with email recipient.
- Recipient invite appearing under New Invites.
- Shared calendar visible on two devices/accounts.
- Original Google `invalid_client` error.
- Original Google `origin_mismatch` error.
- Original Supabase foreign key error.
- Cloud diagnostics panel expanded.
- Old background preview grid.
- New background preview grid.
- Boot loading screen.
- Terminal test/build passing.
- Vercel successful deployment.

## 14. Short Final Summary

From 6 May 2026 to 18 May 2026, BookNest moved from local account/profile behavior into a significantly more complete web app with Google Authentication, Supabase cloud storage, shared calendar invites, improved sync reliability, safer sign-out/sign-in behavior, richer UI customization, stronger diagnostics, and a polished loading screen.

The most important technical shift was adding a cloud-backed identity and storage model:

- Google identifies the user.
- Supabase stores calendars and shared state.
- BookNestProvider controls local/cloud merge behavior.
- Diagnostics explain failures clearly when cloud sync cannot complete.

The app is now much closer to a real shared scheduling product rather than a local-only prototype.
