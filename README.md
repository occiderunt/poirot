# Poirot

A rustic pantry ledger for Android. Every jar accounted for.

Poirot keeps track of what is on your shelves: how much is left, when it needs using,
and which shelf it lives on. Everything stays on the device. No accounts, no network,
no sync.

## What it does

- **Shelves you name yourself** — Left Pantry, Right Pantry, Fridge, Freezer, Spice Rack,
  or anything else. Rename, recolour, reorder and remove them.
- **Items with quantities** — grams, kilos, litres, packs, jars, tins, loaves and so on,
  with sensible plurals.
- **Use it up** — the home screen surfaces anything expiring soon or already past its date.
- **Running low** — set a threshold per item and Poirot nudges you before it runs out.
- **Every item** — one searchable list with filters for due soon, running low and out.
- **A note for later** — a line of context on any item ("the good one, two portions left").
- **Backups** — copy the whole pantry as plain JSON and restore it anywhere.

## Design

Paper cream (`#F4EBD9`), ink brown (`#2B2118`) and a terracotta accent (`#B4552D`).
Fraunces for the display serif, Karla for body text, a subtle grain and a wax-seal
moustache mark. Shelf tiles carry a coloured plank along the bottom.

## Building

Requires Node 20+, Rust, and the Tauri prerequisites. For Android, set:

```sh
export JAVA_HOME="/Volumes/ExternalSSD/AndroidStudio/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME=/Volumes/ExternalSSD/AndroidSDK
export NDK_HOME=$ANDROID_HOME/ndk/28.2.13676358
export GRADLE_USER_HOME=/Volumes/ExternalSSD/GradleHome
```

Desktop:

```sh
npm install
npm run dev        # Vite dev server
npm run build      # type-check + production frontend
npx tauri dev
npx tauri build
```

Android (arm64 release APK):

```sh
npx tauri android build --apk --target aarch64
# src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

The Android project lives in `src-tauri/gen/android`. Release signing reads
`src-tauri/gen/android/app/keystore.properties`, or the environment variables
`POIROT_KEYSTORE`, `POIROT_KEYSTORE_PASSWORD`, `POIROT_KEY_ALIAS` and
`POIROT_KEY_PASSWORD`. Signing is optional: without a keystore the release APK still
builds, unsigned.

## Release

- Version: 1.0.0
- Package: `org.vellum.poirot`
- Min SDK 24, target SDK 37
- Artifact: `Poirot_1.0.0_android-arm64.apk` (5,886,914 bytes)
- SHA-256: `834258ac17fe8d727dab454c6f92820f0bc8df86ed5f764ee658525f6732cfe7`

## Storage

The pantry lives in `localStorage` under `poirot.pantry.v1`. A first launch seeds five
shelves and a small demo pantry so the app is never empty. The JSON backup is the
portable format; `{ "version": 1, "shelves": [...], "items": [...] }`.

## Screenshots

QA captures live in `../scratch/poirot/` during development. Browser shots come from
`node scripts/shot.mjs` (phone 390x844 and desktop 1280x900).
