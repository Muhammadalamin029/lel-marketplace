# Manual Android QA matrix — LEL Store 1.0.0

Run against the `preview` build first, then repeat the starred items on
the `production` AAB installed via `bundletool` or the Play internal
track. Needs a backend with the October 2026 legal content saved
(`/legal`, `/privacy`) and a reviewer demo account (see play-listing.md).

## Install & launch

- [ ] Fresh install on a wiped emulator/device, Android 7+ (*)
- [ ] Cold launch: onboarding → login, no crash, no debug banners (*)
- [ ] No placeholder text or test credentials anywhere (*)

## Auth (email + Google)

- [ ] Register: all fields, phone in +234… format, Terms/Privacy links
      open, unchecked box blocks submit (*)
- [ ] Verify-email OTP path works; login footer shows Terms/Privacy (*)
- [ ] Google sign-in returns an account and lands in tabs (*)
- [ ] Wrong password shows inline error, no crash

## Legal screens

- [ ] Settings → Privacy Policy renders the 12-section policy with an
      October 2026 effective label (live API) (*)
- [ ] Settings → Terms of Service renders the 12-section terms (*)
- [ ] Airplane mode: both screens fall back to the bundled offline copy
      with the "Offline copy" label, no blank screen

## Browse → checkout (escrow)

- [ ] Browse products, cars, properties; details load with images (*)
- [ ] Checkout totals, delivery/pickup options, Paystack screen opens (*)
- [ ] Order appears in Orders with receipt; my-payments shows reference
- [ ] test-mode payments clearly labelled; no real charge on preview

## Inspections, agreements, financing

- [ ] Book inspection (24h+ notice enforced); details + cancel path
- [ ] Agreement details show deposit/balance/instalments correctly
- [ ] Financing application: form validates, ID/payslip upload works
      (camera + library permission prompts appear once) (*)

## Notifications & permissions

- [ ] Launch permission prompt for notifications appears once (*)
- [ ] Order update triggers a push when granted; toggles in Settings
      stop their category
- [ ] Camera/photos permission asked only on upload, never at launch
- [ ] No location permission prompt anywhere (*)

## Account deletion (Play requirement)

- [ ] Settings → Danger Zone shows Delete Account + "How deletion
      works" row; the row opens https://lelstore.com/account-deletion (*)
- [ ] Delete confirm: account logs out to login; login with same
      credentials is rejected (*)
- [ ] Privacy screen deletion section and web page agree on 30-day /
      7-year wording

## System behaviour

- [ ] Back button through tabs and stack exits cleanly, no crash (*)
- [ ] Background → foreground keeps session and cart
- [ ] Rotation locked to portrait
- [ ] Largest system font: key screens readable, no clipped buttons

## Release build

- [ ] `eas build --platform android --profile production` succeeds
- [ ] AAB has applicationId `com.lelstore.app`, versionCode per EAS
- [ ] Merged manifest has no `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` (*)
- [ ] Installed release build passes the starred checks above (*)

## Screenshots

Capture device-native PNGs of the real production UI — home/browse,
product details, checkout, inspection booking, settings deletion row —
and upload them to Play Console. Do not mock or edit them.
