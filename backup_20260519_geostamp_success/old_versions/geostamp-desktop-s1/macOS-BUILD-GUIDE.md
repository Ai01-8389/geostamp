# GeoStamp macOS Build Guide

## Prerequisites

1. **macOS** (Intel or Apple Silicon)
2. **Rust** - Install via [rustup.rs](https://rustup.rs/)
3. **Node.js** (v18+) - Install via [nodejs.org](https://nodejs.org/)
4. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```

## Build Steps

1. **Extract the source code**:
   ```bash
   unzip GeoStamp-Source.zip -d geostamp
   cd geostamp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the application**:
   ```bash
   npm run tauri build
   ```

4. **Find the built app**:
   - The `.app` bundle will be at:
     ```
     src-tauri/target/release/bundle/macos/GeoStamp.app
     ```
   - The `.dmg` installer will be at:
     ```
     src-tauri/target/release/bundle/dmg/GeoStamp_1.0.0_x64.dmg
     ```

## Output Files

| File | Description |
|------|-------------|
| `GeoStamp.app` | macOS application bundle |
| `GeoStamp_1.0.0_x64.dmg` | Disk image installer |

## Notes

- The app is not signed, so users may need to right-click → Open on first launch
- For Apple Silicon (M1/M2/M3), the build will create a native ARM64 binary
- For Intel Macs, the build will create an x86_64 binary
