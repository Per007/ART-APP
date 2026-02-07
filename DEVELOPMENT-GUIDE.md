# Art Album — Local Development Guide

This guide explains how to set up the Art Album PWA for local development and continue building from the prototype.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Runtime |
| npm | 9+ | Package manager |
| VS Code | Latest | Recommended editor |
| Chrome/Edge | Latest | Testing + DevTools |

---

## Quick Start

### 1. Download and Extract

Download `art-collection-pwa.zip` from Claude and extract it:

```bash
# Create a project folder
mkdir art-album
cd art-album

# Extract the zip (adjust path as needed)
unzip ~/Downloads/art-collection-pwa.zip
cd art-collection-pwa
```

### 2. Initialize npm Project

The prototype is vanilla JS. To add build tools and dependencies:

```bash
# Initialize with defaults
npm init -y

# Install development dependencies
npm install --save-dev vite

# Install runtime dependencies
npm install dexie jszip
```

### 3. Update Project Structure

Reorganize for a modern development workflow:

```
art-album/
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── db.js           # Database setup
│   ├── screens/
│   │   ├── home.js
│   │   ├── detail.js
│   │   ├── add.js
│   │   └── edit.js
│   ├── components/
│   │   ├── artwork-card.js
│   │   ├── toast.js
│   │   └── dialog.js
│   ├── utils/
│   │   └── backup.js
│   ├── styles.css
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

### 4. Create Vite Config

Create `vite.config.js`:

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  }
});
```

### 5. Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "serve": "npx serve dist"
  }
}
```

### 6. Run Development Server

```bash
npm run dev
```

Opens `http://localhost:3000` with hot reload.

---

## Running the Prototype As-Is

If you just want to run the prototype without restructuring:

```bash
cd art-collection-pwa

# Option 1: Using serve (recommended)
npx serve .

# Option 2: Using Python
python3 -m http.server 8000

# Option 3: Using PHP
php -S localhost:8000
```

**Important:** PWA features (install prompt, service worker) require either:
- `localhost` (any port)
- HTTPS (for production)

---

## Key Files Explained

### `index.html`
App shell that loads styles and scripts. Minimal — just a container div.

### `styles.css`
All styling in vanilla CSS with CSS custom properties (variables). Well-organized by screen/component.

### `app.js`
Main application file containing:
- **Database setup** (Dexie.js schema)
- **Sample data** (6 pre-loaded artworks)
- **State management** (simple object)
- **Rendering functions** (returns HTML strings)
- **Event listeners** (attached after render)
- **Screen navigation**

### `manifest.json`
PWA manifest defining app name, icons, colors, and display mode.

### `sw.js`
Service worker for offline caching. Caches app shell and CDN resources.

---

## Development Tasks

### Adding Image Recognition

1. **Choose a service:**
   - Google Cloud Vision API (recommended)
   - Clarifai
   - AWS Rekognition

2. **Create API wrapper:**

```javascript
// src/utils/recognition.js
const VISION_API_KEY = 'your-api-key';
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export async function recognizeArtwork(imageBase64) {
  const response = await fetch(`${VISION_API_URL}?key=${VISION_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: imageBase64.split(',')[1] },
        features: [
          { type: 'WEB_DETECTION', maxResults: 10 },
          { type: 'LABEL_DETECTION', maxResults: 5 }
        ]
      }]
    })
  });
  
  const data = await response.json();
  return parseVisionResponse(data);
}

function parseVisionResponse(data) {
  const webDetection = data.responses[0]?.webDetection;
  
  // Extract best guesses for artwork info
  return {
    title: webDetection?.bestGuessLabels?.[0]?.label || null,
    artist: extractArtist(webDetection?.webEntities),
    relatedImages: webDetection?.visuallySimilarImages || []
  };
}
```

3. **Integrate into add flow:**

```javascript
// In handleImageSelect()
const recognition = await recognizeArtwork(imageData);
if (recognition.title || recognition.artist) {
  state.newArtwork.title = recognition.title;
  state.newArtwork.artist = recognition.artist;
  showRecognitionResults(recognition);
} else {
  showEditScreen(state.newArtwork, true);
}
```

### Adding Backup/Restore

1. **Install JSZip:**

```bash
npm install jszip
```

2. **Create backup utilities:**

```javascript
// src/utils/backup.js
import JSZip from 'jszip';

export async function exportCollection(db) {
  const zip = new JSZip();
  
  // Export data
  const artworks = await db.artworks.toArray();
  const collections = await db.collections.toArray();
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: 1,
    collections,
    artworks: artworks.map(a => ({
      ...a,
      imageData: undefined // Handle separately
    }))
  };
  
  zip.file('collection.json', JSON.stringify(exportData, null, 2));
  
  // Export images
  const imagesFolder = zip.folder('images');
  for (const artwork of artworks) {
    if (artwork.imageData) {
      const base64Data = artwork.imageData.split(',')[1];
      imagesFolder.file(`${artwork.id}.jpg`, base64Data, { base64: true });
    }
  }
  
  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `art-collection-backup-${formatDate(new Date())}.zip`);
}

export async function importCollection(db, file, mode = 'merge') {
  const zip = await JSZip.loadAsync(file);
  
  // Parse data
  const jsonFile = zip.file('collection.json');
  if (!jsonFile) throw new Error('Invalid backup file');
  
  const data = JSON.parse(await jsonFile.async('string'));
  
  if (mode === 'replace') {
    await db.artworks.clear();
    await db.collections.clear();
  }
  
  // Import collections
  for (const collection of data.collections) {
    const existing = await db.collections.get(collection.id);
    if (!existing || mode === 'replace') {
      await db.collections.put(collection);
    }
  }
  
  // Import artworks with images
  for (const artwork of data.artworks) {
    const existing = await db.artworks.get(artwork.id);
    if (!existing || mode === 'replace') {
      // Load image from zip
      const imageFile = zip.file(`images/${artwork.id}.jpg`);
      if (imageFile) {
        const imageBase64 = await imageFile.async('base64');
        artwork.imageData = `data:image/jpeg;base64,${imageBase64}`;
      }
      await db.artworks.put(artwork);
    }
  }
  
  return {
    artworks: data.artworks.length,
    collections: data.collections.length
  };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}
```

### Adding Settings Screen

```javascript
function renderSettingsScreen() {
  return `
    <div class="screen screen-settings" id="screen-settings">
      <header class="edit-header">
        <button class="icon-btn" id="settings-back">
          <svg viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1>Settings</h1>
        <div style="width: 40px;"></div>
      </header>
      
      <div class="settings-content">
        <section class="settings-section">
          <h2 class="form-section-title">Data</h2>
          
          <button class="settings-row" id="export-btn">
            <div class="settings-row-content">
              <span class="settings-row-title">Export Collection</span>
              <span class="settings-row-subtitle">Save backup to device</span>
            </div>
            <svg viewBox="0 0 24 24" class="settings-row-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          
          <button class="settings-row" id="import-btn">
            <div class="settings-row-content">
              <span class="settings-row-title">Import Collection</span>
              <span class="settings-row-subtitle">Restore from backup</span>
            </div>
            <svg viewBox="0 0 24 24" class="settings-row-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </section>
        
        <section class="settings-section">
          <h2 class="form-section-title">About</h2>
          <div class="settings-info">
            <p>Art Album v1.0.0</p>
            <p class="text-tertiary">A personal visual album for art collectors</p>
          </div>
        </section>
      </div>
      
      <input type="file" accept=".zip" class="file-input" id="import-file-input">
    </div>
  `;
}
```

---

## Building for Production

### 1. Build the App

```bash
npm run build
```

Creates optimized files in `dist/` folder.

### 2. Test Production Build

```bash
npm run preview
# or
npx serve dist
```

### 3. Deploy

Upload `dist/` contents to any static hosting:

| Service | Free Tier | Custom Domain |
|---------|-----------|---------------|
| Netlify | Yes | Yes |
| Vercel | Yes | Yes |
| GitHub Pages | Yes | Yes |
| Cloudflare Pages | Yes | Yes |

Example with Netlify:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

---

## Installing the PWA

### On Android (Chrome)

1. Open the app URL in Chrome
2. Tap the menu (⋮)
3. Tap "Add to Home screen"
4. Confirm the name
5. App appears on home screen

### On iOS (Safari)

1. Open the app URL in Safari
2. Tap the Share button
3. Scroll down, tap "Add to Home Screen"
4. Confirm the name
5. App appears on home screen

**Note:** On iOS, the app must be used regularly to prevent data purging. Use the backup feature periodically.

---

## Project Structure (Recommended)

For continued development, consider this structure:

```
art-album/
├── public/
│   ├── icons/
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── components/
│   │   ├── ArtworkCard.js
│   │   ├── ArtworkGrid.js
│   │   ├── DetailPanel.js
│   │   ├── FilterBar.js
│   │   ├── Toast.js
│   │   └── Dialog.js
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── DetailScreen.js
│   │   ├── AddScreen.js
│   │   ├── EditScreen.js
│   │   └── SettingsScreen.js
│   ├── services/
│   │   ├── database.js
│   │   ├── recognition.js
│   │   └── backup.js
│   ├── utils/
│   │   ├── helpers.js
│   │   └── constants.js
│   ├── styles/
│   │   ├── base.css
│   │   ├── components.css
│   │   └── screens.css
│   ├── App.js
│   └── main.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## Converting to React (Optional)

If you want to use React for better component management:

```bash
# Create new React project
npm create vite@latest art-album-react -- --template react

# Install dependencies
cd art-album-react
npm install dexie jszip

# Copy styles and adapt components
```

The current vanilla JS structure maps cleanly to React components.

---

## Generating Proper Icons

Replace placeholder icons with proper ones:

### Option 1: Online Generator

1. Create a 1024x1024 PNG icon
2. Use [realfavicongenerator.net](https://realfavicongenerator.net)
3. Download and replace icons in `public/icons/`

### Option 2: Using Sharp (Node.js)

```bash
npm install sharp
```

```javascript
// scripts/generate-icons.js
const sharp = require('sharp');

const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    await sharp('icon-source.png')
      .resize(size, size)
      .png()
      .toFile(`public/icons/icon-${size}.png`);
  }
}

generateIcons();
```

---

## Troubleshooting

### Service Worker Not Updating

```javascript
// Force update in DevTools
// Application > Service Workers > Update on reload
```

Or increment `CACHE_NAME` in `sw.js`:

```javascript
const CACHE_NAME = 'art-album-v2'; // Was v1
```

### IndexedDB Issues

Clear data in DevTools:
- Application > Storage > Clear site data

### PWA Not Installing

Check:
1. Served over HTTPS or localhost
2. Valid `manifest.json`
3. Service worker registered
4. Icons accessible

---

## Resources

- [Dexie.js Documentation](https://dexie.org/docs/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [JSZip Documentation](https://stuk.github.io/jszip/)

---

*Happy building!*
