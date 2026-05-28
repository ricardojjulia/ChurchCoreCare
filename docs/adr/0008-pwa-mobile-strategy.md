# ADR 0008: Progressive Web App for Mobile Delivery

## Status

Accepted

## Context

The competitive analysis (2026-05-27) identified the absence of a mobile app as a
meaningful loss point in sales evaluations against SimplePractice. Counselors document
session notes between sessions on phones and expect an installable experience.

ADR 0002 (web-first architecture) was written when the primary risk was secure workflows
and role enforcement, not mobile delivery. The product has since passed that threshold and
mobile is now the priority concern.

Three options were evaluated:

**Option A — React Native (Expo)**  
Produces native iOS and Android apps with access to device APIs (camera, biometrics,
native push). Requires maintaining a separate codebase in addition to the React web app.
Team would need to duplicate or extract shared components and API client logic into a
cross-platform package. Significantly higher build cost and ongoing maintenance overhead.

**Option B — PWA in a separate `apps/mobile` Vite project**  
A Progressive Web App built with the same React + Mantine v9 stack. Ships as a
mobile-first companion app with a bottom-tab shell. Installed via "Add to Home Screen"
on iOS Safari and Android Chrome. Can be wrapped in a thin Capacitor shell for App Store
distribution without rewriting any code. Shares domain packages with the main web app.

**Option C — Make `apps/web` mobile-responsive**  
Add responsive breakpoints to the existing practice management SPA. Lower build cost
but results in a desktop app adapted for mobile rather than a mobile-first experience.
Navigation structure (sidebar nav) is unsuitable for one-handed phone use. Also risks
introducing regressions in the desktop experience.

## Decision

Use **Option B**: a dedicated `apps/mobile` Vite PWA project.

Rationale:
- Same stack (React 19, Mantine v9, Vite, JSX) — no new language or framework
- Mobile shell designed for mobile from the start (bottom navigation, touch targets, no sidebars)
- `vite-plugin-pwa` handles service worker, web manifest, and install prompt
- Capacitor can wrap the PWA build for App Store distribution in Phase C7 with no code changes
- No risk of desktop regressions
- `packages/domain` shared business logic reused across all apps

The PWA does not replace the desktop app. It is the counselor companion for between-session
use: schedule view, client lookup, quick note entry, and push notifications.

## Consequences

### Positive

- Ships faster than React Native (no new framework to learn)
- One codebase for web and mobile; PRs reviewable by anyone on the team
- Capacitor path to App Store distribution is available when needed (C7)
- `@mantine/core` responsive utilities and mobile-first defaults transfer directly
- Service worker enables offline app shell and draft note persistence

### Negative

- PWA install on iOS Safari is less discoverable than App Store (no install badge)
- Web Push on iOS requires iOS 16.4+ (released March 2023 — acceptable floor)
- No access to native biometric auth (Face ID) in Phase C; available via Capacitor plugin in C7
- Separate Vite project means a second build step and Firebase Hosting target

### Neutral

- Capacitor adds the App Store option without changing the PWA (Option B + C7 = both)
- This ADR supersedes the mobile portion of ADR 0002 without changing its web-first stance for the practice management surface

## References

- `PLANS/PHASE-C-F-COMPETITIVE-PARITY.md` Phase C
- ADR 0002: web-first architecture
- Capacitor: https://capacitorjs.com/
- vite-plugin-pwa: https://vite-pwa-org.netlify.app/
