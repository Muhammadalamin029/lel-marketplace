# LEL Store — Google Play listing

## App title (30 chars max)

LEL Store

## Short description (80 chars max)

Shop products, cars & property in Nigeria — inspected, escrow-secured.

## Full description (4000 chars max)

LEL Store by LEL Store Ltd is Nigeria's curated marketplace for everyday
products, vehicles and real estate — all in one secure app.

Buy with confidence:

- Curated products, cars and properties across Nigeria
- Mandatory physical inspections before high-ticket purchases
- Payments held in escrow until completion triggers are met
- Flexible financing and installment plans with clear agreements
- Dispute protection — open a ticket within 48 hours of a defect

How it works:

1. Create your account (email or Google) and verify it.
2. Browse products, cars and properties.
3. Book a physical inspection for vehicles and real estate.
4. Pay securely through Paystack — card, bank transfer or direct debit.
   LEL Store never sees or stores your card numbers or bank passwords.
5. Track orders, inspections, agreements and payments in one place.

Your data, your control:

- Notification preferences (email, push, in-app) in Settings.
- Delete your account any time in Settings, Danger Zone, Delete Account —
  sign-in is blocked immediately and personal data is purged after 30 days.
- Full Privacy Policy in the app (Settings, Privacy Policy) and at
  https://lelstore.com/privacy.

Questions? Contact support@lelstore.com.

## Category

Shopping

## Content rating

Complete the IARC questionnaire in Play Console (expected outcome: Everyone).
No user-generated public content, no ads, no in-app purchases via Play
billing, no location access. Unrated apps are not allowed on Google Play,
so this must be completed before release.

## Play Console declarations (App content)

- Financial features: YES — marketplace escrow plus financing/installment
  plans (complete the financial features declaration form).
- Ads: the app contains no ads — declare "No ads".
- App access: account required for purchases; provide a demo login
  (email + password + verified OTP path) in the sign-in instructions so
  reviewers can reach checkout, inspections and agreements.
- Target audience: adults 18+ (vehicles, property, financing).
- Support email: support@lelstore.com (displayed on the listing).
- Privacy policy URL: https://lelstore.com/privacy.
- Data Safety: complete the form (see below — must match the manifest
  permissions and this policy). Data deletion URL:
  https://lelstore.com/account-deletion.

## Permissions (declare; verify in merged manifest)

- `INTERNET`, `ACCESS_NETWORK_STATE` — API, Paystack, push.
- `POST_NOTIFICATIONS` — order, payment and inspection updates
  (expo-notifications; registered on launch, toggles in Settings).
- Photo/media read + camera — only when the user uploads a profile photo
  or financing document (expo-image-picker, expo-document-picker).
- No location permission — maps are display-only with manual pins.
- No microphone, SMS, call log, or background location.

## Graphics checklist (verify before upload)

- [x] Store icon `store/icon-512.png`: 512×512, 32-bit PNG (generated
  from `assets/images/app-icon.png`).
- [x] Feature graphic `store/feature-graphic.png`: exactly 1024×500, no
  alpha (brand gradient + app mark + tagline).
- [ ] Phone screenshots: minimum 2, maximum 8; JPEG or 24-bit PNG (no alpha);
  9:16 or 16:9 aspect; each side 320–3840px. Cover: home/browse, product
  details, checkout, inspection booking, settings deletion row.
- All graphics must show the real production UI — no mocks or edits.

## Data Safety (declare in Play Console)

- Data collected: name, email, phone, addresses, purchase and order
  history, financing application data (employment, income, ID/payslip
  documents), device IDs and push tokens.
- Data shared: Paystack (payments), Cloudinary (images), Google Identity
  (sign-in), Expo Push (notifications). No sale of personal data.
- Data is encrypted in transit (TLS); passwords hashed with Argon2.
- Account deletion offered in-app (Settings, Danger Zone) and via the web
  resource above; ledgers retained anonymised up to 7 years for AML/tax/
  deed-tracing law, as disclosed in the policy.

## Release notes — 1.0.0

Initial release of LEL Store.

- Curated products, cars and property listings
- Physical inspection booking with sign-off
- Escrow checkout via Paystack (card, transfer, direct debit)
- Financing applications with document upload
- Orders, agreements, payments and dispute tracking
- Push, email and in-app notification preferences
- In-app account deletion with 30-day grace period
