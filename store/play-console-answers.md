# Google Play Console — field-by-field answers for LEL Store

Package: `com.lelstore.app` · Version: 1.0.0 · Track plan: internal → production
Sources checked September 2026: Play Console help (App content, Store
listing, Publishing overview, Play Console requirements), 2026 policy
checklists. Re-verify target-API and testing rules on the day you submit —
Google moves these yearly.

## 0. Developer account (do first — can block everything)

- LEL Store handles **financial products/services (escrow + financing)**.
  Per Play Console requirements, financial-services providers **must
  register as an Organization**, not a personal account: legal name +
  address, **D-U-N-S number**, contact email/phone, developer email/phone
  shown on Play, payment method, linked Google payments profile. Details
  must match the Dun & Bradstreet profile.
- Organization accounts skip the 14-day / 12-tester closed-testing gate
  that applies to newer personal accounts. If you only have a personal
  account created after Nov 2023, expect to run closed testing for 14
  continuous days with ≥12 testers before production unlocks.
- Accept the Developer Distribution Agreement, content policies and US
  export declarations, or sections of Console stay locked.

## 1. Create app (All apps → Create app)

| Field | Answer |
|---|---|
| App name | `LEL Store` (30-char limit; per-language) |
| Default language | English (Nigeria market; localise later) |
| App or game | App |
| Free or paid | Free (hard to reverse — keep Free) |
| Contact email | `support@lelstore.com` |
| Declarations | Accept Developer Program Policies + US export laws + Play App Signing ToS |

## 2. Build & signing

- Upload format: **AAB only** (APKs rejected for new apps), ≤200 MB base.
- **Play App Signing mandatory.** EAS production build + `eas submit`
  handles the upload key.
- `versionCode` must increase every upload (`eas.json` production has
  `autoIncrement: true` — leave it on). `versionName` free-form (`1.0.0`).
- **Target API: new apps must target Android 16 (API 36)** under the
  31 Aug 2026 deadline. Before `eas build --profile production`, confirm
  `targetSdkVersion` satisfies it (Expo SDK 57 + `expo-doctor`); do not
  ship on an older target — uploads are rejected.

## 3. Main store listing (Grow → Store presence)

Copy lives in `store/play-listing.md`. Limits: name 30, short 80, full 4000.

- App name: `LEL Store`
- Short: `Shop products, cars & property in Nigeria — inspected, escrow-secured.`
- Full: as drafted in `play-listing.md` (no keyword stuffing, no
  unverified awards, only shipped features).
- Category: Shopping. Contact email/website as prompted.
- Graphics: `store/icon-512.png` (done), `store/feature-graphic.png`
  (done), 2–8 phone screenshots of real production UI (TODO — see
  `manual-qa.md` shot list).

## 4. App content (Policy → App content — all must be Completed)

- **Privacy policy:** `https://lelstore.com/privacy` — live HTTPS, no
  login wall, names the app, matches Data Safety. Same URL as listing.
- **Ads:** No — declare "Contains no ads".
- **App access:** REQUIRED (purchases behind login). Provide a working
  demo account + steps in English: where to log in, how to reach
  checkout, an inspection booking, an agreement. Credentials must be
  reusable, non-expiring, and kept valid while distributed. TODO: create
  the demo customer account and paste creds here before review.
- **Content rating:** complete the IARC questionnaire (~10–15 questions;
  category: All other app types). Unrated = cannot publish. Answer
  honestly (financial transactions, no UGC chat, no location sharing).
- **Target audience:** 18+ only (vehicles, property, financing). Do NOT
  include under-13 bands (that triggers Designed for Families).
- **News / COVID / Government / Health:** all No (not applicable).
- **Financial features:** YES — escrow + financing/installments. Complete
  the declaration; have business registration/supporting docs ready
  (country-specific). This pairs with the Organization account in §0.
- **Permissions declaration:** none of the sensitive set (no SMS/Call
  Log/background location/accessibility). Camera, photos and
  notifications are normal permissions — no form needed. Confirm the
  merged manifest has no `ACCESS_*_LOCATION` before upload.
- **Data deletion:** in-app path = Settings → Danger Zone → Delete
  Account; web resource = `https://lelstore.com/account-deletion`
  (works without the app; references LEL Store; email request path).
  Enter the web URL in the Data safety → deletion field.

## 5. Data safety form (per data type — cross-check with policy)

Encryption in transit: **Yes** (TLS; Argon2-hashed passwords).
Account deletion available: **Yes** (see §4).

| Data type | Collected (required?) | Shared | Purpose / notes |
|---|---|---|---|
| Name | Yes, required (account) | No | App functionality, account management |
| Email | Yes, required (account) | Yes — Paystack (payment/mandate auth), Google (sign-in verification) | Account, payments |
| Phone | Yes, required (account, delivery) | No | Account, delivery coordination |
| Address (delivery/billing) | Yes, required for delivery orders | No | Fulfilment |
| Purchase history | Yes, required | Yes — Paystack (amounts/refs) | Order processing, escrow |
| Financial info (income, employer, financing docs) | Yes, optional (only if user applies) | No (processed first-party; docs via Cloudinary infra — see Photos) | Eligibility checks |
| Photos / videos (avatar, ID, payslips) | Yes, optional (user-initiated uploads) | Yes — Cloudinary (image hosting) | Account + financing verification |
| Files / docs | Yes, optional (same uploads) | Yes — Cloudinary | Verification |
| Device / push IDs (Expo tokens) | Yes, required if notifications on | Yes — Expo Push | Notifications |
| Location, contacts, microphone, SMS, call logs | No | No | Not accessed (maps display-only) |

Confirm the table against real device traffic (Android Studio Network
Inspector) on the release build before submitting — you are responsible
for SDK behaviour too. Update the form on every release that changes SDKs.

## 6. Release & review

- Upload the production AAB to internal track → promote to production
  (staged rollout recommended for 1.0.0).
- Review takes hours up to ~7 days; keep ≥1 week buffer before any
  announced launch. Use Publishing overview → Send for review; consider
  Managed publishing (available after first publication) to control timing.
- Keep demo credentials, privacy URL, deletion URL and Data Safety
  answers valid for the app's lifetime — re-check on every update.
