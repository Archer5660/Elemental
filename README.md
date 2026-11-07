[README.md](https://github.com/user-attachments/files/34507061/README.md)
# Elemental

Elemental is a cross-platform browser with science-themed interactions and a consistent set of browser basics across desktop and mobile. The desktop app is built with Electron; the Apple and Android apps are native projects using WebKit and Android WebView.

> **Project status:** Elemental is actively evolving. Features and platform support are not identical across apps. Read the platform notes below before building or distributing a particular version.

## Features

- Tabbed browsing, address/search, selectable search engines, bookmarks, downloads, and browsing history.
- Science-themed browser effects, including Atom controls, Science Lab, Black Hole, and Zero Gravity on supported clients.
- Optional Elemental account sign-in and Standard/Pro plan display through Supabase.
- Built-in Elemental Messages on desktop, with shareable account codes and Firebase-backed conversations. Messages require additional backend setup; see [Firebase setup](./firebase/README.md).

## Platforms

| Platform | Project/source | Current notes |
|---|---|---|
| macOS (Apple silicon and Intel) | [`elemental-browser/`](./elemental-browser/) | Electron desktop app; DMG and ZIP builds are provided. |
| Windows (x64) | [`elemental-browser/`](./elemental-browser/) | Electron desktop app; installer and portable builds are provided. |
| Linux (x86-64 and ARM64) | [`elemental-browser/`](./elemental-browser/) | Electron AppImage builds are provided for 64-bit Intel/AMD and ARM64 systems. |
| iPhone and iPad | [`apps/apple/`](./apps/apple/) | Native SwiftUI/WebKit Xcode project. The repository includes project source, not a signed install package. |
| Android phone and tablet | [`platform-android/`](./platform-android/) | Separate native projects; APKs in `apps/android/` are debug-signed for testing. |
| Apple Vision Pro | [`apps/visionos/`](./apps/visionos/) | Native visionOS browser project; see its [build notes](./apps/visionos/README.md). |
| Apple TV | [`apps/appletv/`](./apps/appletv/) | Experimental sideload-only project. It relies on private tvOS WebKit APIs and is not suitable for App Store distribution; see its [limitations and setup](./apps/appletv/README.md). |

Platform feature sets differ. For example, Elemental Messages is currently desktop-only.

## Download builds

Prebuilt outputs are in [`apps/`](./apps/):

- macOS Apple silicon: [`apps/mac/`](./apps/mac/)
- macOS Intel: [`apps/mac-intel/`](./apps/mac-intel/)
- Windows x64: [`apps/windows/`](./apps/windows/)
- Linux x86-64 (64-bit Intel/AMD): [`apps/linux-x64/`](./apps/linux-x64/)
- Linux ARM64: [`apps/linux/`](./apps/linux/)
- Android phone and tablet: [`apps/android/`](./apps/android/)

The macOS builds are unsigned. The Android APKs are debug-signed and intended for testing, not Play Store distribution. The iOS, visionOS, and Apple TV folders contain Xcode projects rather than signed release packages.

## Build and test desktop

Requirements: Node.js/npm and a platform appropriate for the target build. Electron Builder may require additional platform tooling; consult its documentation for cross-platform build limitations.

```sh
cd elemental-browser
npm install
npm start
```

Run desktop checks and tests:

```sh
npm run check
npm test
```

Build commands write distributables to the corresponding directory under `apps/`:

```sh
npm run build:mac       # macOS (current host architecture)
npm run build:mac:x64   # Intel macOS
npm run build:win       # Windows x64
npm run build:linux     # Linux ARM64
npm run build:linux:x64 # Linux x86-64 (64-bit Intel/AMD)
npm run build:all       # macOS, Windows, Linux ARM64, and Linux x86-64
```

The Linux x86-64 AppImage is intended for 64-bit Intel/AMD distributions, including Linux Mint XFCE on a 64-bit PC. It does not support 32-bit x86 systems. AppImages may need to be marked executable before launch (for example, `chmod +x Elemental-*.AppImage`). The macOS build command targets the host architecture by default. Windows and Linux builds may require their native build environments; verify the resulting packages on the target operating system before release.

## Build native projects

### iOS and iPadOS

Open [`apps/apple/Elemental.xcodeproj`](./apps/apple/Elemental.xcodeproj) in Xcode and choose the `Elemental` scheme and an iOS Simulator or a configured device.

### Android

Open each project separately in Android Studio:

- Phone: [`platform-android/phone/`](./platform-android/phone/)
- Tablet: [`platform-android/tablet/`](./platform-android/tablet/)

Or build debug APKs from the repository root:

```sh
cd platform-android/phone && ./gradlew assembleDebug
cd ../tablet && ./gradlew assembleDebug
```

### Apple Vision Pro

Open [`apps/visionos/ElementalVision.xcodeproj`](./apps/visionos/ElementalVision.xcodeproj) in Xcode. Simulator build instructions and current feature limitations are in [`apps/visionos/README.md`](./apps/visionos/README.md).

### Apple TV

Open [`apps/appletv/ElementalTV.xcodeproj`](./apps/appletv/ElementalTV.xcodeproj) in Xcode. The project is experimental, sideload-only, and uses private tvOS APIs; see [`apps/appletv/README.md`](./apps/appletv/README.md) before building.

## Supabase accounts

Account sign-in and plan display depend on the configured Supabase project. Before using accounts with a fresh project, apply [`supabase/migrations/20261106120000_elemental_accounts.sql`](./supabase/migrations/20261106120000_elemental_accounts.sql) in its SQL Editor. New accounts are assigned the Standard plan.

Pro checkout and Pro benefits are not implemented. Plan changes must be performed by trusted server-side code. **Never put a Supabase service-role key in a client app or commit it to the repository.**

## Elemental Messages setup

Messages is not enabled just by building the desktop app. It requires a Firebase project, Firestore, a Supabase migration, a Supabase Edge Function, and deployed Firestore rules. Follow the [Elemental Messages setup guide](./firebase/README.md). Keep Firebase service-account private keys in Supabase Secrets; never commit them or include them in a desktop build.

## Repository layout

- [`elemental-browser/`](./elemental-browser/) — Electron desktop source and tests.
- [`platform-apple/`](./platform-apple/) — Native Apple browser source/project.
- [`platform-android/`](./platform-android/) — Android phone and tablet projects.
- [`apps/`](./apps/) — built desktop and Android outputs plus Apple platform projects.
- [`supabase/`](./supabase/) — database migrations and Edge Function.
- [`firebase/`](./firebase/) — Firestore rules and Messages setup instructions.
