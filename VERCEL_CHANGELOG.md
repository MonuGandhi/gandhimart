Gandhimart — Vercel / OneSignal Migration & Fixes

Summary (since 2026-05-15)

- 147c5cc — 2026-05-22 17:02:22 — fix: store target phone correctly in firestore so specific pushes do not show down in all users notification history
- 40c152a — 2026-05-22 16:44:13 — fix: use 'Total Subscriptions' segment logic instead of 'All' for OneSignal v16 compatibility
- b57c7fe — 2026-05-22 16:23:48 — fix: make push toggle robust by reading status directly from onesignal context
- c899c9f — 2026-05-22 16:10:40 — update: change referral link domain from firebase to vercel
- a496e27 — 2026-05-22 15:49:55 — feat: add explicit toast and state update for already granted pushes
- 9c4d811 — 2026-05-22 15:07:23 — fix: directly optIn if permission is already granted instead of calling promptPush
- 2ee7661 — 2026-05-22 14:57:21 — fix: use Slidedown.promptPush() as direct request fails silently in Chrome PWA
- c877659 — 2026-05-22 04:31:48 — fix: call onesignal directly without deferred push to prevent browser popup block
- 64145c4 — 2026-05-22 04:23:43 — chore: add alert for exact onesignal error to debug silent failures
- 94b9a0f — 2026-05-22 04:17:38 — fix: direct browser native permission with hard deny check
- 04808ab — 2026-05-22 04:14:43 — fix: simple push notification toggle with promptPush()
- e22229b — 2026-05-22 04:05:32 — fix: non-blocking push interaction avoiding infinite spinner on permission request
- cf21080 — 2026-05-22 03:58:32 — fix: use slidedown prompt for more reliable notification permission
- 8c44288 — 2026-05-22 03:56:26 — fix: exhaustive push subscription logic and safety timeout
- 21078ae — 2026-05-22 03:45:53 — fix: push toggle loading hang and prompt improved
- 8d2f5f9 — 2026-05-22 03:41:52 — feat: link onesignal subscription status to firestore profile
- 4b0c48f — 2026-05-22 01:25:42 — feat: setup vercel backend for push notifications

What changed (high level)

- Added a Vercel serverless endpoint at `api/send-notification.js` to securely relay push requests to OneSignal using the REST API key.
- Frontend changes in `src/pages/Profile.jsx` to handle subscription flows robustly across browsers and PWA contexts: slidedown prompt fallback, direct opt-in when permission already granted, explicit toasts and state sync.
- `src/utils/oneSignal.js` updated to send correct targeting payloads to the Vercel API and use `Total Subscriptions` for global broadcasts.
- Admin push UI (`src/pages/admin/Notifications.jsx`) fixed to save target phone in Firestore when sending specific pushes, and to reset form state after sending.
- Notifications store left intact; filtering relies on `phone` being present on specific notifications.

Files included below (current workspace versions)

---

# api/send-notification.js

```js
