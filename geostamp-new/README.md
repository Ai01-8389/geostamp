# GeoStamp - Image Geotagging Tool

A web and desktop application for adding location and timestamp overlays to your photos.

## Features

- **EXIF Data Extraction**: Extract GPS coordinates and timestamps from photos
- **Reverse Geocoding**: Convert GPS coordinates to human-readable place names
- **Custom Watermarking**: Add location and timestamp overlays to your photos
- **Multiple Naming Options**: Date-based, GPS coordinates, original filename, or custom prefix
- **Batch Processing**: Process multiple photos at once (Pro users)

## Web Version

### Usage

1. Visit [geostamp.app](https://geostamp.app)
2. Upload your photos (free users: 1 image at a time)
3. Choose your preferred naming convention
4. Click "Annotate Images" to process
5. Download your annotated photos

### Limitations

- **Free Users**: 1 image per session
- **Pro Users**: Unlimited batch processing

## Desktop Version

The desktop app offers unlimited processing and works offline.

### Building from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/geostamp.git
cd geostamp

# Install dependencies
npm install

# Build for your platform
cd electron-app
npm install

# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### Running in Development

```bash
cd electron-app
npm start
```

## Deployment

### GitHub Pages

The web app is automatically deployed to GitHub Pages when pushing to the `main` branch.

### Desktop Releases

Desktop apps are automatically built for Windows, macOS, and Linux on each push to `main`.

## Project Structure

```
geostamp/
├── src/              # React web app source
├── public/           # Static assets
├── electron-app/     # Desktop app source
│   ├── main.js       # Electron main process
│   ├── index.html    # Desktop UI
│   ├── renderer.js   # Desktop logic
│   └── package.json  # Desktop dependencies
├── index.html        # Web app entry
├── package.json      # Web dependencies
└── .github/          # GitHub Actions workflows
```

## Technologies

- **Web**: React, Vite, TailwindCSS
- **Desktop**: Electron, Node.js
- **Libraries**: ExifReader, JSZip
- **API**: Nominatim (OpenStreetMap)

## License

MIT License