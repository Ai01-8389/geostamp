# GeoStamp Desktop App Build Guide

This guide will help you build the GeoStamp desktop application for Windows, macOS, and Linux.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- For Windows: Windows 10/11 with build tools installed
- For macOS: macOS 10.15 or later
- For Linux: Ubuntu 18.04 or similar

## Getting Started

1. Navigate to the electron-app directory:
```bash
cd electron-app
```

2. Install dependencies:
```bash
npm install
```

## Development

To run the app in development mode:
```bash
npm start
```

## Building for Production

### Windows
```bash
npm run build:win
```

### macOS
```bash
npm run build:mac
```

### Linux
```bash
npm run build:linux
```

### Build All Platforms
```bash
npm run build
```

## Build Output

The built packages will be in the `dist` directory:
- Windows: `GeoStamp Setup.exe` (NSIS installer)
- macOS: `GeoStamp.dmg`
- Linux: `geostamp_1.0.0_amd64.deb`

## Features

- **Unlimited Photo Processing**: Process as many images as you want without restrictions
- **EXIF Data Extraction**: Extract GPS coordinates and timestamp from photos
- **Reverse Geocoding**: Convert GPS coordinates to human-readable place names
- **Custom Watermarking**: Add location and timestamp overlays to your photos
- **Multiple Naming Options**: Date-based, GPS coordinates, original filename, or custom prefix
- **Batch Processing**: Process multiple photos at once
- **Local Processing**: All processing happens on your device for privacy

## Project Structure

```
electron-app/
├── main.js          # Main process (Electron entry point)
├── index.html       # Renderer process UI
├── renderer.js      # Renderer process logic
├── package.json     # Dependencies and build configuration
└── BUILD.md         # This file
```

## Notes

1. The app uses Nominatim API for reverse geocoding. Ensure you have internet access when processing photos with GPS data.
2. Geocoding results are cached locally for 7 days to improve performance.
3. All image processing happens locally - your photos never leave your device.

## Troubleshooting

### Build Errors on Windows

If you encounter build errors on Windows, try installing the build tools:
```bash
npm install --global windows-build-tools
```

### Missing Icons

The build configuration references `icon.ico` (Windows) and `icon.icns` (macOS). To add custom icons:
1. Create a 256x256 PNG icon
2. Convert to ICO format for Windows (use tools like ImageMagick)
3. Convert to ICNS format for macOS
4. Place the icons in the electron-app directory

### Permission Issues on Linux

If you get permission errors during build:
```bash
chmod +x node_modules/.bin/electron-builder
```