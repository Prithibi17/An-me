# An:me Desktop v1.0.2 — Release Notes (3rd Release)

**Release Tag**: `v1.0.2`  
**Date**: November 3, 2026  
**Type**: Major Feature & Stability Release  

Welcome to the **3rd Official Release** of **An:me Desktop**! This milestone delivers full cross-platform desktop installers and packages for **Windows**, **macOS**, and **Linux**, solves visual duplication in the splash screen, introduces smart English title heuristics, fixes character and related series lookups, and enhances watch-status tracking.

---

## 🚀 Key Highlights & What's New

### 1. 🖥️ Official Cross-Platform Desktop Installers & Packages
An:me is now packaged as a true native desktop application across all major operating systems:
- **Windows**:
  - **Setup Wizard (`An-me Setup.exe`)**: A complete graphical installer that installs An:me into the user's directory, creates desktop shortcuts, adds application menu entries, and registers an uninstaller without requiring terminal commands.
  - **Portable (`An-me.exe`)**: Self-contained standalone application folder — extract and run immediately.
- **Linux (`x64`)**:
  - Full standalone desktop bundle with native launcher, bundled Electron runtime, and zero external framework dependencies.
- **macOS (Apple Silicon & Intel)**:
  - Native `.app` bundles optimized for both **Apple Silicon (M1/M2/M3/M4 arm64)** and **Intel (x64)** architectures.

---

### 2. 🎬 Seamless Cinematic Splash Screen
- **Ghosting & Duplication Eliminated**: Fixed the issue where duplicate cards, brackets, and an extra row of dots appeared in the background at the end of the loading transition.
- **Unified Render Architecture**: Removed redundant pre-hydration overlay markup from `index.html`, ensuring only the dynamic React splash sequence renders. Gives a clean, pixel-perfect cyberpunk intro with smooth neon auras and animated status dots that fade seamlessly into the main dashboard.

---

### 3. 🌐 Multi-Source Sub & Dub Availability Engine
- **Multi-Source Aggregation**: Resolved missing and inaccurate SUB/DUB counts by aggregating data across multiple authoritative sources: **Anikoto Database**, **AniZip**, **MALSync**, and **AniList**.
- **9,300+ Anime Indexed**: Expanded the local catalog indexing engine across all 95 catalog pages (over 9,300 anime) with fast parallel retrieval and persistent client-side caching.
- **AniZip Air Date Precision**: Queries TVDB and AniDB UTC broadcast schedules (`airDateUtc`) to compute exact released episode counts in real-time.
- **Major Streamer Cross-Referencing**: Integrates MALSync to cross-check global streaming platforms (Crunchyroll, Hulu, Netflix, KickAssAnime) for English dub availability.
- **No More Default Ep 12 on Long Series**: Long-running anime like *One Piece* now correctly display true counts (`SUB 1180` / `DUB 1159`) across all cards and spotlights instead of defaulting to 12.

---

### 4. 🇬🇧 Authoritative English Title Heuristics
- **Smart English Ranking**: Added a linguistic scoring engine (`titleHelper.ts`) that selects authentic English anime titles over Japanese Romaji transliterations (e.g., *"Magical Girl Raising Project: Restart"* instead of Japanese/Thai localized abbreviations).
- **Non-Latin Script Filtering**: Automatically rejects non-Latin titles (Kanji, Kana, Thai script) whenever valid Romanized or English alternatives are available.
- **Unified Consistency**: English titles now consistently display across Spotlight, Trending Now, Top 10, Details View, Episode Grid, Schedule, Player, and Library.

---

### 4. 📺 Accurate Episode Release Capping & Character Fixes
- **No More Phantom Episodes**: For currently airing series (such as *Siren*), the episode list is now strictly capped to released episodes (e.g., 4 episodes subbed / 3 dubbed) instead of showing future unreleased episode slots.
- **Character & Relations Roster**: Fixed an AniList GraphQL schema issue (`role` field placement), ensuring that Character rosters and Related series load reliably on every title.
- **Spotlight Episode Accuracy**: Fixed *One Piece* and long-running series in the Spotlight banner, correctly showing full episode counts (e.g., `SUB 1180` / `DUB 1157`) instead of defaulting to 12.

---

### 5. 👁️ Offline Viewing Status & Local Watch Progress
- **3-Tier Visual Indicators**:
  - 🟦 **Watched**: Watched episodes are dimmed with a soft, transparent cyan-blue tint. Cluttering time counters have been removed.
  - 🎨 **Currently Watching**: The active episode is highlighted with a striking **blue-to-pink** gradient border and glow.
  - ⬛ **Yet to Watch**: Clean, standard appearance for unwatched content.
- **Resume Anywhere**: Remembers exact playback timestamps locally on the device without requiring cloud logins.
- **100% Offline-First**: Stored locally in device storage with automatic synchronization across the Home Screen, Details, and Desktop Player.

---

### 6. ⚡ Streamlined Streaming & Server Defaults
- **Default Server 4**: All anime streams default to **Server 4** upon playback start.
- **Stable Streaming**: Disabled automatic background server swapping so playback remains uninterrupted.

---

## 📦 Downloads & Release Assets

| Platform | Package File | Format | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- | :--- |
| **Windows (Recommended)** | `An-me-Setup.exe` | **Single Standalone Installer (.exe)** | **125 MB** | `EB0AEB671B10C9370B16781A0966FE8DF212477AFC51DBC50CEF87E198ED0AE9` |
| **Windows** | `An-me-Windows-Setup-x64.zip` | Setup Wizard (.zip) | 177 MB | `8B6D9E2C010FE7F08F0CA2F0A15409DBB34ADDAD900B0A39D27D46B65A63C657` |
| **Windows** | `An-me-Windows-Portable-x64.zip` | Standalone (.zip) | 177 MB | `70ACCF2BB61D197E3A8D7FA8E1084E954963BC832FAA32D675EBF34B1877395A` |
| **Linux** | `An-me-Linux-x64.zip` | Standalone Archive | 143 MB | `91652D7ADA7CF939884B7154B702CC0B475896A63BD15547A6EDC489FB54452E` |
| **macOS (Apple Silicon)** | `An-me-macOS-arm64.zip` | .app Bundle (M1-M4) | 140 MB | `CAFB5DB082142EAA8AB3BF964EFE3C49230C954C7205311208EC9799FB04A2E0` |
| **macOS (Intel)** | `An-me-macOS-x64.zip` | .app Bundle (x64) | 144 MB | `FFA29A7B4EFAA95575D2FA72661A76AADF0B279FEE474CE6FD1EB4438E3E2911` |

*(Alternative `.tar.gz` archives for macOS are also available in `dist-packages/releases`)*

---

## 🛠️ Installation Instructions

### Windows
- **Direct Installer (Recommended)**: Download **`An-me-Setup.exe`** and double-click to run the setup wizard directly. No extraction required!
- **Setup Archive**: Alternatively, download `An-me-Windows-Setup-x64.zip`, extract it, and run `An-me Setup.exe`.
- **Portable**: Download `An-me-Windows-Portable-x64.zip` for a zero-install portable version.

### macOS
1. Download `An-me-macOS-arm64.zip` (for Apple Silicon) or `An-me-macOS-x64.zip` (for Intel Macs).
2. Extract the archive to get `An-me.app`.
3. Drag `An-me.app` into your `/Applications` folder and double-click to launch.

### Linux
1. Download and extract `An-me-Linux-x64.zip`.
2. Open terminal in the extracted folder and ensure executable permissions:
   ```bash
   chmod +x An-me
   ./An-me
   ```

---

## 🧪 Quality & Test Verification
- **62/62 Unit & Integration Tests Passing**:
  - `tests/intelligentSearch.test.mjs` (21 tests)
  - `tests/latestEpisodes.test.mjs` (11 tests)
  - `tests/watchProgress.test.mjs` (11 tests)
  - `tests/titleHelper.test.mjs` (12 tests)
  - `tests/multiSourceAvailability.test.mjs` (7 tests)
- **Production Build Status**: Verified clean Vite v8 & Electron production compilation with zero bundling errors.
