# Poirot



# DUE TO COPYRIGHT INFRINGEMENT CHANCES, WE HAVE MOVED TO [GUSTAVE](https://github.com/occiderunt/gustave).

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

iOS (simulator, then device):

```sh
git submodule update --init --recursive
npx tauri ios build --target aarch64-sim --debug
npx tauri ios build            # needs a development team for signing
```

The iOS project lives in `src-tauri/gen/apple`, which is the
[poirot-ios](https://github.com/occiderunt/poirot-ios) repository checked out as a
submodule, because the generated Xcode project references the Rust crate two levels
up. It needs Xcode, XcodeGen, CocoaPods, and the Rust targets `aarch64-apple-ios`,
`aarch64-apple-ios-sim` and `x86_64-apple-ios`. Build products (`build/`,
`Externals/`, `Pods/`) stay out of git on both sides.

## Release

- Version: 1.0.2
- Package: `org.vellum.poirot`
- Min SDK 24, target SDK 37
- Artifact: `Poirot_1.0.2_android-arm64.apk` (5,943,918 bytes)
- SHA-256: `75bee5781bec4d5b242ad6adb8b78adb31ac2c47ded28862b97dd80212c49add`

## Storage

The pantry lives in `localStorage` under `poirot.pantry.v1`. A first launch seeds five
shelves and a small demo pantry so the app is never empty. The JSON backup is the
portable format; `{ "version": 1, "shelves": [...], "items": [...] }`.

## Screenshots

QA captures live in `../scratch/poirot/` during development. Browser shots come from
`node scripts/shot.mjs` (phone 390x844 and desktop 1280x900).
