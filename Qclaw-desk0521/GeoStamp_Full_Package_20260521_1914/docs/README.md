# GeoStamp A1 - Tauri Desktop App

Lightweight photo geotag annotator. Reads EXIF GPS data, performs reverse geocoding, and adds location watermark to the bottom-left of images.

## Features

- **Drag & drop** image upload
- **EXIF GPS extraction** with automatic DMS to decimal conversion
- **Reverse geocoding**: BigDataCloud (primary) → OpenStreetMap Nominatim (fallback)
- **Bottom-left annotation**: Location name + Coordinates|Time|Filename
- **Filename rules**: Prefix (None/Time/Location/Custom) + serial number
- **Settings**: Keep original filename toggle, custom download path
- **Pure English UI**
- **Cross-platform**: Windows + macOS

## Tech Stack

- **Frontend**: Vanilla JS + Vite
- **Backend**: Rust + Tauri v2
- **EXIF parsing**: exif-js (CDN)
- **Size**: ~10MB (vs 150MB Electron)

## Prerequisites

### Windows

1. **Rust** (latest stable): https://rustup.rs
2. **Node.js** (v18+): https://nodejs.org
3. **Visual Studio Build Tools** with C++ workload:
   - Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - During install, select: **Desktop development with C++**
   - Or run: `winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --add Microsoft.VisualStudio.Workload.VCTools"`
4. **WebView2 Runtime** (usually pre-installed on Windows 10/11)

### macOS

1. **Rust** (latest stable): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. **Node.js** (v18+): `brew install node` or https://nodejs.org
3. **Xcode Command Line Tools**: `xcode-select --install`

## Build Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Cargo Mirror (China users, optional)

Create `~/.cargo/config.toml`:
```toml
[source.crates-io]
replace-with = 'ustc'

[source.ustc]
registry = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"
```

### 3. Development Mode

```bash
npm run tauri-dev
```

### 4. Build Release

#### Windows
```bash
npm run tauri-build
```
Output: `src-tauri/target/release/bundle/msi/*.msi` and `src-tauri/target/release/bundle/nsis/*.exe`

#### macOS
```bash
npm run tauri-build
```
Output: `src-tauri/target/release/bundle/dmg/*.dmg`

## Project Structure

```
A1/
├── index.html          # Main UI
├── style.css           # Styles
├── app.js              # Frontend logic
├── package.json        # Node dependencies
├── vite.config.js      # Vite config
└── src-tauri/
    ├── Cargo.toml      # Rust dependencies
    ├── tauri.conf.json # Tauri config
    └── src/
        └── main.rs     # Rust backend commands
```

## Key Design Decisions

- **Removed**: Login, subscription, pricing, debug UI (vs Electron version)
- **Annotation**: Bottom-left, 2 lines, text width = 50% of image width
- **Geocoding priority**: BigDataCloud (free, no API key) → Nominatim (OSM)
- **Filename**: Prefix + 3-digit serial (e.g., `Beijing_001.jpg`)
- **Download**: Single or batch, with optional original filename preservation

## License

MIT
