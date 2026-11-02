# <p align="center"><img src="public/anme-icon.png" width="72" height="72" alt="An:me Logo" style="border-radius: 16px;" /><br>An:me Desktop</p>

<p align="center">
  <strong>A fast, lightweight, and modern desktop anime discovery & streaming client.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-rose?style=for-the-badge" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/Platform-Windows%20x64-blue?style=for-the-badge&logo=windows" alt="Platform Windows" />
  <img src="https://img.shields.io/badge/Electron-45.2.1-47848F?style=for-the-badge&logo=electron" alt="Electron" />
  <img src="https://img.shields.io/badge/React-19.3.1-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4.19-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

---

## 📖 Overview

**An:me Desktop** is an ultra-fast, aesthetically tuned anime exploration and streaming application engineered for the desktop. Built with **Electron**, **React 19**, and **Tailwind CSS**, it pairs a seamless frameless dark UI with instant episode loading, robust metadata discovery via the AniList GraphQL API, automated server failover handling, and complete local privacy.

---

## ✨ Features

### 🖥️ Native Desktop Experience
- **Frameless Dark Window**: Custom sleek titlebar with smooth window dragging, minimize, maximize, and exit controls.
- **Instant Launch**: Packaged using ASAR compression for sub-second launch times without file-scan delays.
- **System Integration**: Native Windows notifications for episodes and watchlist updates, taskbar grouping, and high-resolution rounded taskbar/tray icons.
- **Setup & Uninstaller Wizard**: Built-in 6-step modern setup wizard (`An-me Setup.exe`) and complete uninstaller registered directly with **Windows Settings → Installed Apps**.

### 🎬 Anime Discovery (Powered by AniList GraphQL)
- **Spotlight Hero Carousel**: Wide-screen backdrop carousel showcasing top trending and spotlight anime with quick-play triggers.
- **Leaderboards & Top 10**: Filterable rankings across **Today**, **This Week**, and **This Month**.
- **Trending Now & Season Highlights**: Curated sections with real-time score badges, episode counters, and format tags (TV, Movie, OVA).
- **Interactive Weekly Airing Schedule**: Day-by-day broadcast calendar (Sunday to Saturday) with air times and episode counters.
- **Deep Search & Filters**: Instant search with autocomplete dropdown and multi-criteria filters (Genre, Season, Year, Sort).

### ⚡ Streaming & Video Player
- **Multi-Server Streaming**: Seamless switching across multiple high-speed stream servers.
- **Audio Track Selection**: One-click toggle between **SUB** (Original with subtitles) and **DUB** (English dubbed).
- **Automatic Server Failover**: Automatically detects video provider dropouts (HTTP 410 / 404 / 502) and silently failovers to the next healthy server with zero manual intervention.
- **Episode Quick Jumper & Number Input**: Jump to any episode or type your desired episode number directly to jump forward instantly.

### 📚 Local Library & History
- **Watchlist Categorization**: Track your anime across *Watching*, *Plan to Watch*, *Completed*, *On Hold*, and *Dropped*.
- **Resume Watching Timeline**: Automatically tracks exact watch progress per episode and lets you resume playback in one click.
- **Local Persistence Microservice**: Fast, offline JSON storage microservice for user preferences, avatar customizations, and notification caching.

---

## 📥 Download & Releases

Download the latest pre-built Windows installation executable:

| Release | Platform | Setup File | Type |
| :--- | :--- | :--- | :--- |
| **v1.0.0** | Windows 10 / 11 (x64) | [**An-me-Setup.exe**](https://github.com/Prithibi17/An-me/releases/latest) | Standalone Installer |

> [!NOTE]
> The setup file creates desktop and Start Menu shortcuts, registers the application with Windows Installed Apps for clean uninstallation, and occupies only ~253 MB of disk space.

---

## 🚀 Building from Source

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [Git](https://git-scm.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/Prithibi17/An-me.git
cd An-me
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Streaming Providers
For copyright and security protection, raw video streaming provider endpoints are omitted from public commits. Before running, copy the example template:
```bash
cp src/services/providers.example.ts src/services/providers.ts
cp src/services/availability.example.ts src/services/availability.ts
```
*(On Windows PowerShell, use `Copy-Item src/services/providers.example.ts src/services/providers.ts`)*

### 5. Run the Application
```bash
# Run desktop development build (Vite build + Electron)
npm run desktop

# Or run Vite in web browser preview mode
npm run dev:web
```

### 6. Package Executable
To package your own standalone installer and binary:
```bash
npm run build
npx electron-packager . "An-me Setup" --platform=win32 --arch=x64 --icon=public/anme-icon.ico --out=dist-setup --overwrite --asar --ignore="^(src|node_modules|dist-setup|scripts|\.git)"
```

---

## 📂 Project Architecture

```
an-me-desktop/
├── electron/
│   ├── main.cjs               # Electron main process (lifecycle, IPC handlers, uninstaller registry)
│   └── preload.cjs            # Secure contextBridge API (window controls, disk storage, installer bridge)
├── src/
│   ├── components/
│   │   ├── installer/
│   │   │   ├── InstallerWizard.tsx   # 6-step modern setup wizard
│   │   │   └── UninstallWizard.tsx   # Interactive uninstaller wizard
│   │   ├── watch/
│   │   │   └── WatchView.tsx         # Video player, failover logic & episode selector
│   │   ├── details/                  # Anime detailed overview & cast
│   │   ├── notifications/            # Episode notification drawer
│   │   ├── profile/                  # User profile and avatar picker
│   │   └── ...                       # Discovery cards, carousels, grids, schedules
│   ├── services/
│   │   ├── anilist.ts                # AniList GraphQL queries & episode mapper
│   │   ├── providers.example.ts      # Stream provider interface template
│   │   ├── availability.example.ts   # Catalog availability template
│   │   ├── storage.ts                # Local storage & watchlist manager
│   │   └── localStore.ts             # Electron persistent disk store client
│   ├── types/                        # TypeScript type definitions
│   ├── App.tsx                       # Main application shell
│   └── main.tsx                      # App entry & installer / uninstaller router
├── public/                           # Application icons, logos, and avatars
└── package.json
```

---

## 🔒 Security & Privacy

- **No Tracking or Telemetry**: No third-party analytical trackers or advertising SDKs.
- **Offline First**: All user watchlists, history, and preferences are stored exclusively on your local computer.
- **Provider Protection**: Streaming extraction endpoints and proprietary resolvers are kept outside of source tracking.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
