# Art Album — Product Requirements Document

**Version:** 1.0  
**Date:** February 2026  
**Status:** Design Complete, Prototype Available

---

## Executive Summary

Art Album is a personal visual album for collecting and organizing modern art. Designed for emerging collectors (1-20 pieces), it provides a beautiful, minimal interface to catalog owned artworks and wishlist pieces, with optional image recognition for artwork lookup.

The app prioritizes the art itself — clean, museum-like aesthetics where the interface recedes and the artwork speaks.

---

## Target User

| Attribute | Description |
|-----------|-------------|
| **Profile** | Emerging art collectors with 1-20 pieces |
| **Motivation** | Want a beautiful way to track and remember their collection |
| **Technical level** | Non-technical users who want simplicity |
| **Platform** | iOS and Android (via PWA) |

---

## Core Principles

1. **Art-forward**: The artwork is always the hero — minimal UI, generous white space
2. **Personal, not transactional**: This is a visual album, not a finance tool
3. **Flexible data entry**: All fields optional except image — no pressure to complete
4. **Privacy-first**: Fully local storage, no account required
5. **Offline-capable**: Works without internet connection

---

## Features

### 1. Collection Grid (Home Screen)

The primary view showing all artworks in a visual grid.

| Feature | Description |
|---------|-------------|
| **Grid layout** | 2-column grid (default) or single-column list |
| **Filtering** | Tabs: All / Owned / Wishlist |
| **Collections** | Horizontal scrolling pills to filter by custom collection |
| **Status indicators** | Subtle colored dots (green=owned, rose=wishlist) |
| **Card content** | Image, title, artist, year, medium, collection tag |

### 2. Artwork Detail View

Full-screen artwork view with expandable information panel.

| Feature | Description |
|---------|-------------|
| **Full-bleed image** | Dark background, artwork centered |
| **Multiple images** | Swipe through additional photos |
| **Expandable panel** | Swipe up to reveal details |
| **Information shown** | Status, title, artist, year, medium, dimensions, location, personal note, collections |
| **Actions** | Edit, Delete, Look Up (image recognition) |

### 3. Add Artwork Flow

Four-step process to add new pieces.

| Step | Description |
|------|-------------|
| **1. Capture** | Camera viewfinder, gallery picker, or paste URL |
| **2. Recognition** | Auto-lookup via image recognition (skippable) |
| **3. Edit** | Form with all optional fields |
| **4. Confirmation** | "Add Another" or return to grid |

### 4. Custom Collections

User-created folders to organize artworks.

| Feature | Description |
|---------|-------------|
| **Creation** | Create new collections from edit screen |
| **Assignment** | Artworks can belong to multiple collections |
| **Examples** | "Living Room", "Office", "Dutch Artists", "To Research" |

### 5. Backup & Restore

Manual export/import for data safety.

| Feature | Description |
|---------|-------------|
| **Export** | Creates .zip with JSON data + images |
| **Import** | Restore from backup with merge or replace option |
| **Location** | Settings screen |

---

## Data Model

### Artwork

| Field | Type | Required |
|-------|------|----------|
| id | string (UUID) | Yes |
| status | 'owned' \| 'wishlist' | Yes (default: owned) |
| title | string | No |
| artist | string | No |
| year | number | No |
| medium | string | No |
| dimensions | string | No |
| location | string | No |
| personalNote | string | No |
| sourceUrl | string | No |
| collections | string[] | No |
| imageData | base64 string | Yes |
| createdAt | timestamp | Yes |
| updatedAt | timestamp | Yes |

### Collection

| Field | Type | Required |
|-------|------|----------|
| id | string (UUID) | Yes |
| name | string | Yes |
| sortOrder | number | Yes |

---

## Visual Design

### Design Direction: "Quiet Gallery"

The app should feel like walking through a well-lit contemporary art space.

### Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background | White | #FFFFFF |
| Background alt | Warm gray | #F7F7F5 |
| Text primary | Near black | #1A1A1A |
| Text secondary | Medium gray | #6B6B6B |
| Text tertiary | Light gray | #9A9A9A |
| Owned indicator | Sage green | #A5B8A0 |
| Wishlist indicator | Muted rose | #D4A5A5 |
| Success | Forest green | #4A7C59 |

### Typography

| Element | Font | Size |
|---------|------|------|
| Primary font | DM Sans | — |
| Artwork title | Regular | 14px |
| Artist name | Regular | 12px |
| Metadata | Regular | 11px |
| Section headers | Uppercase | 10px |
| Panel title | Regular | 24px |

### Layout Principles

- Generous white space around images
- Image takes 80%+ of card space
- No borders or heavy shadows — subtle separation only
- Single column for focused viewing, two-column for browsing

### Interaction Style

| Action | Behavior |
|--------|----------|
| Transitions | Slow, smooth fades (200-300ms) |
| Scrolling | Gentle momentum |
| Buttons | Ghost style, subtle fills |
| Feedback | Minimal haptics |

---

## Technical Architecture

### Platform

**Progressive Web App (PWA)** — chosen for cross-platform support without app store distribution.

| Benefit | Description |
|---------|-------------|
| No app store | Install directly from browser |
| Cross-platform | Works on iOS and Android |
| Offline support | Service worker caching |
| Home screen | Add to home screen for app-like experience |

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React (Vite) |
| Styling | Tailwind CSS / vanilla CSS |
| Database | Dexie.js (IndexedDB wrapper) |
| Image storage | IndexedDB as blobs |
| Offline | Service Worker |
| Backup | JSZip for export/import |

### Storage Limits

| Platform | IndexedDB Limit |
|----------|-----------------|
| Chrome Android | ~50% of free space |
| Safari iOS | ~1GB before prompts |
| Firefox | 2GB default |

Sufficient for 50-100 artworks with multiple images each.

### iOS Safari Consideration

IndexedDB can be purged if storage is low and app unused. Mitigation: manual backup/restore feature.

---

## Image Recognition (Future)

Placeholder implemented, ready for integration.

### Options

| Service | Pros | Cons |
|---------|------|------|
| Google Cloud Vision | Accurate, well-documented | Requires API key, costs |
| Google Lens URL hack | Free | Unreliable, may break |
| TensorFlow.js | On-device, private | Less accurate for art |

### Flow

1. User captures/selects image
2. Auto-lookup triggers (skippable)
3. If match found: pre-fill title, artist, year, medium
4. User can accept, edit, or skip

---

## Screens Summary

| Screen | Status |
|--------|--------|
| Home (Collection Grid) | ✅ Designed + Prototyped |
| Artwork Detail | ✅ Designed + Prototyped |
| Add Artwork (Capture) | ✅ Designed + Prototyped |
| Add Artwork (Recognition) | ✅ Designed (placeholder) |
| Add Artwork (Edit Form) | ✅ Designed + Prototyped |
| Success Confirmation | ✅ Designed + Prototyped |
| Settings | Pending |
| Backup/Restore | Pending |

---

## User Decisions Log

| Decision | Choice |
|----------|--------|
| Primary purpose | Inventory + wishlist |
| Target user | Emerging collectors (1-20 pieces) |
| Data depth | Basic info + optional personal context |
| Social features | Private first (undecided on sharing) |
| Visual style | Museum-like, minimal, white, art-forward |
| Platform | Cross-platform (iOS + Android) |
| Personal fields | Structured but optional |
| Wishlist input | Links + own photos |
| Offline access | Nice to have |
| Image recognition | Auto-lookup after capture (skippable) |
| Required fields | Only image required |
| After save | Ask "Add another?" |
| Distribution | PWA (no app store) |
| Storage | Fully local (no account) |
| Backup | Manual export/import as zip |

---

## File Deliverables

| File | Description |
|------|-------------|
| `art-collection-pwa.zip` | Complete PWA prototype |
| `index.html` | App shell |
| `styles.css` | All styling |
| `app.js` | Application logic + database |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker |
| Design mockups | 3 HTML files (grid, detail, add flow) |

---

## Running the Prototype

```bash
# Unzip and serve
unzip art-collection-pwa.zip
cd art-collection-pwa
npx serve .
```

Open `http://localhost:3000` and test:

- Browse sample collection (6 artworks pre-loaded)
- Filter by status and collection
- View artwork details
- Add new artwork from gallery
- Edit and delete artworks

---

## Next Steps

1. **Settings screen** — with backup/restore UI
2. **Image recognition integration** — Google Cloud Vision or alternative
3. **Proper app icons** — generate PNG icons for all sizes
4. **Production build** — minify, optimize, test on devices
5. **User testing** — validate UX with real collectors

---

*Document generated February 2026*
