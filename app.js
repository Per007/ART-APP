import Dexie from 'dexie';

// ====================
// OUTPUT SAFETY
// ====================

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeImageData(value) {
  if (typeof value !== 'string') return null;
  return /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value) ? value : null;
}

function safePlaceholderClass(value) {
  return /^placeholder-[1-6]$/.test(value || '') ? value : 'placeholder-1';
}

function artworkForDisplay(artwork) {
  return {
    ...artwork,
    id: escapeHtml(artwork.id),
    status: artwork.status === 'wishlist' ? 'wishlist' : 'owned',
    title: escapeHtml(artwork.title),
    artist: escapeHtml(artwork.artist),
    year: escapeHtml(artwork.year),
    medium: escapeHtml(artwork.medium),
    dimensions: escapeHtml(artwork.dimensions),
    location: escapeHtml(artwork.location),
    personalNote: escapeHtml(artwork.personalNote),
    imageData: safeImageData(artwork.imageData),
    placeholderClass: safePlaceholderClass(artwork.placeholderClass)
  };
}

// ==================== 
// DATABASE SETUP
// ====================

const db = new Dexie('ArtCollectionDB');

db.version(1).stores({
  artworks: 'id, status, title, artist, createdAt',
  collections: 'id, name, sortOrder'
});

// ==================== 
// SAMPLE DATA
// ====================

const sampleCollections = [
  { id: 'col-1', name: 'Living Room', sortOrder: 0 },
  { id: 'col-2', name: 'Office', sortOrder: 1 },
  { id: 'col-3', name: 'To Research', sortOrder: 2 },
  { id: 'col-4', name: 'Dutch Artists', sortOrder: 3 }
];

const sampleArtworks = [
  {
    id: 'art-1',
    status: 'owned',
    title: 'Composition in Ochre',
    artist: 'Maria van den Berg',
    year: 2023,
    medium: 'Oil on canvas',
    dimensions: '80 × 100 cm',
    location: 'Living room, east wall',
    personalNote: 'Found this at Art Rotterdam 2023. The warm ochre tones reminded me of late summer afternoons in Provence. Maria was incredibly kind and told me about her process — she layers thin washes over months.',
    sourceUrl: null,
    collections: ['col-1'],
    imageData: null,
    placeholderClass: 'placeholder-1',
    createdAt: Date.now() - 86400000 * 30
  },
  {
    id: 'art-2',
    status: 'owned',
    title: 'Nocturne #7',
    artist: 'James Chen',
    year: 2022,
    medium: 'Acrylic on panel',
    dimensions: '60 × 80 cm',
    location: 'Office, behind desk',
    personalNote: 'Bought directly from the artist\'s studio in Rotterdam.',
    sourceUrl: null,
    collections: ['col-2'],
    imageData: null,
    placeholderClass: 'placeholder-2',
    createdAt: Date.now() - 86400000 * 60
  },
  {
    id: 'art-3',
    status: 'wishlist',
    title: 'Untitled (Red Series)',
    artist: 'Unknown',
    year: null,
    medium: null,
    dimensions: null,
    location: null,
    personalNote: 'Saw this at Stedelijk Museum. Need to find out more about the artist.',
    sourceUrl: null,
    collections: ['col-3'],
    imageData: null,
    placeholderClass: 'placeholder-3',
    createdAt: Date.now() - 86400000 * 14
  },
  {
    id: 'art-4',
    status: 'owned',
    title: 'Horizon Lines IV',
    artist: 'Sophie Bakker',
    year: 2024,
    medium: 'Mixed media on canvas',
    dimensions: '120 × 90 cm',
    location: 'Living room, main wall',
    personalNote: null,
    sourceUrl: null,
    collections: ['col-1', 'col-4'],
    imageData: null,
    placeholderClass: 'placeholder-4',
    createdAt: Date.now() - 86400000 * 7
  },
  {
    id: 'art-5',
    status: 'wishlist',
    title: 'Study in Grey',
    artist: 'Anna Kowalski',
    year: 2021,
    medium: 'Archival print',
    dimensions: '40 × 50 cm',
    location: null,
    personalNote: 'Seen at gallery weekend. Edition of 25.',
    sourceUrl: 'https://example.com/artwork',
    collections: ['col-3'],
    imageData: null,
    placeholderClass: 'placeholder-5',
    createdAt: Date.now() - 86400000 * 21
  },
  {
    id: 'art-6',
    status: 'owned',
    title: 'Growth',
    artist: 'Lena de Vries',
    year: 2023,
    medium: 'Bronze sculpture',
    dimensions: '35 × 20 × 20 cm',
    location: 'Office, shelf',
    personalNote: null,
    sourceUrl: null,
    collections: ['col-2', 'col-4'],
    imageData: null,
    placeholderClass: 'placeholder-6',
    createdAt: Date.now() - 86400000 * 45
  }
];

// ==================== 
// APP STATE
// ====================

const state = {
  currentScreen: 'home',
  currentFilter: 'all', // 'all', 'owned', 'wishlist'
  currentCollection: null,
  selectedArtwork: null,
  newArtwork: null,
  gridView: 'grid', // 'grid' or 'single'
  detailPanelExpanded: false,
  filteredArtworks: [], // List of artworks in current filter for navigation
  currentArtworkIndex: 0, // Current position in filteredArtworks
  isDarkMode: false, // Dark mode preference
  collectionDialog: null,
  searchOpen: false,
  searchQuery: ''
};

// ==================== 
// INITIALIZATION
// ====================

async function initApp() {
  // Load theme preference
  const savedTheme = localStorage.getItem('darkMode');
  state.isDarkMode = savedTheme === 'true';
  if (state.isDarkMode) {
    document.body.classList.add('dark-theme');
  }

  const artworkCount = await db.artworks.count();
  const collectionCount = await db.collections.count();
  const onboardingComplete = localStorage.getItem('onboardingComplete') === 'true';

  // Existing installations predate onboarding. Preserve their data and take
  // them directly to the album; only a genuinely empty first run is onboarded.
  if (onboardingComplete || artworkCount > 0 || collectionCount > 0) {
    localStorage.setItem('onboardingComplete', 'true');
    state.currentScreen = 'home';
  } else {
    state.currentScreen = 'onboarding';
  }

  renderApp();
}

// Toggle dark mode
function toggleDarkMode(enabled) {
  state.isDarkMode = enabled;
  localStorage.setItem('darkMode', enabled);

  if (enabled) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }

  // Update meta theme-color for mobile browser UI
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', enabled ? '#0A0A0A' : '#ffffff');
  }
}

function completeOnboarding() {
  localStorage.setItem('onboardingComplete', 'true');
  showScreen('home');
}

async function startEmptyOnboarding() {
  completeOnboarding();
}

async function startDemoOnboarding() {
  await db.transaction('rw', db.artworks, db.collections, async () => {
    await db.collections.bulkPut(sampleCollections);
    await db.artworks.bulkPut(sampleArtworks);
  });
  completeOnboarding();
  showToast('Demo collection added');
}

// ==================== 
// RENDERING
// ====================

function renderApp() {
  const app = document.getElementById('app');

  app.innerHTML = `
    ${renderHomeScreen()}
    ${renderOnboardingScreen()}
    ${renderDetailScreen()}
    ${renderAddScreen()}
    ${renderEditScreen()}
    ${renderSettingsScreen()}
    ${renderToast()}
    ${renderConfirmDialog()}
    ${renderCollectionDialog()}
  `;

  attachEventListeners();
  showScreen(state.currentScreen);
}

function renderOnboardingScreen() {
  return `
    <div class="screen screen-onboarding" id="screen-onboarding">
      <main class="onboarding-content">
        <div class="onboarding-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <rect x="5" y="5" width="22" height="22" rx="2"/>
            <path d="M10 21l5-6 4 4 3-3 3 5"/>
          </svg>
        </div>
        <h1>Start your art album</h1>
        <p>Keep a private visual record of works you own and pieces you want to remember.</p>

        <div class="onboarding-actions">
          <button class="onboarding-btn primary" id="onboarding-empty">
            <span>Start an empty album</span>
            <small>Add your own first artwork</small>
          </button>
          <button class="onboarding-btn" id="onboarding-demo">
            <span>Explore the demo</span>
            <small>See an example collection</small>
          </button>
          <button class="onboarding-btn" id="onboarding-import">
            <span>Import a backup</span>
            <small>Restore an Art Album JSON file</small>
          </button>
        </div>
      </main>
      <input type="file" accept=".json,application/json" class="file-input" id="onboarding-import-input">
    </div>
  `;
}

function renderHomeScreen() {
  return `
    <div class="screen screen-home" id="screen-home">
      <header class="home-header">
        <div class="header-top">
          <span class="logo">Collection</span>
          <div class="header-actions">
            <button class="icon-btn" id="search-btn" aria-label="Search" aria-expanded="false">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
            <button class="icon-btn" id="settings-btn" aria-label="Settings">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="search-row" id="search-row" hidden>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input id="search-input" type="search" placeholder="Search artworks" aria-label="Search artworks" autocomplete="off">
          <button class="search-close" id="search-close" aria-label="Close search">Close</button>
        </div>
        
        <nav class="tabs">
          <button class="tab ${state.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
            All<span class="tab-count" id="count-all"></span>
          </button>
          <button class="tab ${state.currentFilter === 'owned' ? 'active' : ''}" data-filter="owned">
            Owned<span class="tab-count" id="count-owned"></span>
          </button>
          <button class="tab ${state.currentFilter === 'wishlist' ? 'active' : ''}" data-filter="wishlist">
            Wishlist<span class="tab-count" id="count-wishlist"></span>
          </button>
        </nav>
      </header>
      
      <div class="filter-bar" id="filter-bar"></div>
      
      <main class="grid-container">
        <div class="view-toggle">
          <button class="view-btn ${state.gridView === 'grid' ? 'active' : ''}" data-view="grid" aria-label="Grid view">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
          <button class="view-btn ${state.gridView === 'single' ? 'active' : ''}" data-view="single" aria-label="List view">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="6" rx="1"/>
              <rect x="3" y="14" width="18" height="6" rx="1"/>
            </svg>
          </button>
        </div>
        
        <div class="artwork-grid ${state.gridView === 'single' ? 'single-column' : ''}" id="artwork-grid"></div>
      </main>
      
      <button class="fab" id="fab-add" aria-label="Add artwork">
        <svg viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>
  `;
}

function renderDetailScreen() {
  return `
    <div class="screen screen-detail" id="screen-detail">
      <div class="detail-fullscreen" id="detail-image-area"></div>
      
      <!-- Navigation arrows for horizontal scrolling -->
      <button class="nav-arrow nav-arrow-left" id="nav-prev" aria-label="Previous artwork">
        <svg viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button class="nav-arrow nav-arrow-right" id="nav-next" aria-label="Next artwork">
        <svg viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
      
      <nav class="detail-top-bar">
        <button class="icon-btn dark" id="detail-back" aria-label="Back">
          <svg viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="nav-position-indicator" id="nav-position"></div>
        <div class="top-bar-actions">
          <button class="icon-btn dark" aria-label="Search online">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <button class="icon-btn dark" id="share-btn" aria-label="Share artwork">
            <svg viewBox="0 0 24 24">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
          <button class="icon-btn dark" aria-label="More options">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="6" cy="12" r="1.5"/>
              <circle cx="18" cy="12" r="1.5"/>
            </svg>
          </button>
        </div>
      </nav>
      
      <div class="detail-bottom-bar" id="detail-bottom-bar">
        <div class="bottom-bar-content">
          <div class="artwork-title-compact" id="detail-compact-info"></div>
          <div class="swipe-hint">
            <svg viewBox="0 0 24 24">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
            Details
          </div>
        </div>
      </div>
      
      <div class="detail-panel" id="detail-panel">
        <div class="panel-handle" id="panel-handle"></div>
        <div class="panel-content" id="panel-content"></div>
      </div>
    </div>
  `;
}

function renderAddScreen() {
  return `
    <div class="screen screen-add" id="screen-add">
      <header class="add-header">
        <button class="icon-btn dark" id="add-close" aria-label="Close">
          <svg viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <h1>Add Artwork</h1>
        <div style="width: 40px;"></div>
      </header>
      
      <div class="camera-area">
        <div class="viewfinder-frame" id="viewfinder">
          <span class="viewfinder-hint">Tap to select an image</span>
        </div>
      </div>
      
      <div class="capture-controls">
        <button class="capture-btn" id="capture-btn" aria-label="Select image"></button>
        
        <div class="capture-options">
          <button class="capture-option" id="gallery-btn">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Gallery</span>
          </button>
          <button class="capture-option" id="link-btn">
            <svg viewBox="0 0 24 24">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span>Paste Link</span>
          </button>
        </div>
      </div>
      
      <input type="file" accept="image/jpeg,image/png,image/webp" class="file-input" id="file-input">
    </div>
  `;
}

function renderEditScreen() {
  return `
    <div class="screen screen-edit" id="screen-edit">
      <header class="edit-header">
        <button class="icon-btn" id="edit-back" aria-label="Back">
          <svg viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 id="edit-title">New Artwork</h1>
        <button class="save-btn" id="save-btn">Save</button>
      </header>
      
      <div class="edit-content" id="edit-content"></div>
    </div>
  `;
}

function renderToast() {
  return `
    <div class="toast" id="toast">
      <svg viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span id="toast-message">Artwork saved</span>
    </div>
  `;
}

function renderConfirmDialog() {
  return `
    <div class="dialog-overlay" id="dialog-overlay">
      <div class="dialog">
        <h3 id="dialog-title">Delete artwork?</h3>
        <p id="dialog-message">This action cannot be undone.</p>
        <div class="dialog-actions">
          <button class="dialog-btn cancel" id="dialog-cancel">Cancel</button>
          <button class="dialog-btn confirm" id="dialog-confirm">Delete</button>
        </div>
      </div>
    </div>
  `;
}

function renderCollectionDialog() {
  return `
    <div class="dialog-overlay" id="collection-dialog-overlay" role="presentation">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="collection-dialog-title">
        <h3 id="collection-dialog-title">New collection</h3>
        <label class="input-label" for="collection-name-input">Name</label>
        <input class="input-field dialog-field" id="collection-name-input" type="text" maxlength="60" autocomplete="off">
        <p class="dialog-error" id="collection-dialog-error" aria-live="polite"></p>
        <div class="dialog-actions">
          <button class="dialog-btn cancel" id="collection-dialog-cancel">Cancel</button>
          <button class="dialog-btn primary" id="collection-dialog-save">Save</button>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsScreen() {
  return `
    <div class="screen screen-settings" id="screen-settings">
      <header class="edit-header">
        <button class="icon-btn" id="settings-back" aria-label="Back">
          <svg viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1>Settings</h1>
        <div style="width: 40px;"></div>
      </header>
      
      <div class="settings-content">
        <section class="settings-section">
          <h2 class="form-section-title">Appearance</h2>
          
          <div class="settings-row">
            <div class="settings-row-content">
              <span class="settings-row-title">Dark Mode</span>
              <span class="settings-row-subtitle">Use dark color theme</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="dark-mode-toggle" ${state.isDarkMode ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </section>

        <section class="settings-section">
          <div class="settings-section-heading">
            <h2 class="form-section-title">Collections</h2>
            <button class="text-btn" id="settings-add-collection">Add</button>
          </div>
          <div class="settings-collection-list" id="settings-collection-list"></div>
        </section>
        
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
            <p class="settings-app-name">Art Album</p>
            <p class="settings-version">Version 1.0.0</p>
            <p class="settings-description">A personal visual album for art collectors</p>
          </div>
        </section>
      </div>
      
      <input type="file" accept=".json,application/json" class="file-input" id="import-file-input">
    </div>
  `;
}

// ==================== 
// DATA LOADING
// ====================

async function loadArtworks() {
  let artworks = await db.artworks.toArray();

  // Apply filter
  if (state.currentFilter === 'owned') {
    artworks = artworks.filter(a => a.status === 'owned');
  } else if (state.currentFilter === 'wishlist') {
    artworks = artworks.filter(a => a.status === 'wishlist');
  }

  // Apply collection filter
  if (state.currentCollection) {
    artworks = artworks.filter(a => a.collections && a.collections.includes(state.currentCollection));
  }

  if (state.searchQuery) {
    const query = normalizeSearchValue(state.searchQuery);
    artworks = artworks.filter((artwork) => normalizeSearchValue([
      artwork.title,
      artwork.artist,
      artwork.year,
      artwork.medium,
      artwork.location,
      artwork.personalNote
    ].join(' ')).includes(query));
  }

  // Sort by creation date (newest first)
  artworks.sort((a, b) => b.createdAt - a.createdAt);

  return artworks;
}

function normalizeSearchValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .trim();
}

async function loadCollections() {
  const collections = await db.collections.orderBy('sortOrder').toArray();
  return collections;
}

async function renderSettingsCollections() {
  const container = document.getElementById('settings-collection-list');
  if (!container) return;

  const collections = await loadCollections();
  if (collections.length === 0) {
    container.innerHTML = '<p class="settings-empty">No collections yet.</p>';
    return;
  }

  container.innerHTML = collections.map((collection) => `
    <div class="collection-manage-row">
      <span class="collection-manage-name">${escapeHtml(collection.name)}</span>
      <div class="collection-manage-actions">
        <button class="small-action-btn" data-action="rename-collection" data-id="${escapeHtml(collection.id)}" aria-label="Rename ${escapeHtml(collection.name)}">Rename</button>
        <button class="small-action-btn danger" data-action="delete-collection" data-id="${escapeHtml(collection.id)}" aria-label="Delete ${escapeHtml(collection.name)}">Delete</button>
      </div>
    </div>
  `).join('');
}

async function updateCounts() {
  const all = await db.artworks.count();
  const owned = await db.artworks.where('status').equals('owned').count();
  const wishlist = await db.artworks.where('status').equals('wishlist').count();

  document.getElementById('count-all').textContent = all;
  document.getElementById('count-owned').textContent = owned;
  document.getElementById('count-wishlist').textContent = wishlist;
}

async function renderFilterBar() {
  const collections = await loadCollections();
  const filterBar = document.getElementById('filter-bar');

  filterBar.innerHTML = `
    <button class="filter-pill ${!state.currentCollection ? 'active' : ''}" data-collection="">
      All Collections
    </button>
    ${collections.map(c => `
      <button class="filter-pill ${state.currentCollection === c.id ? 'active' : ''}" data-collection="${escapeHtml(c.id)}">
        ${escapeHtml(c.name)}
      </button>
    `).join('')}
  `;
}

async function renderArtworkGrid() {
  const artworks = await loadArtworks();
  const grid = document.getElementById('artwork-grid');
  await updateCounts();

  if (artworks.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <h3>${state.searchQuery ? 'No matching artworks' : 'No artworks yet'}</h3>
        <p>${state.searchQuery ? 'Try another search term' : 'Tap the + button to add your first piece'}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = artworks.map(artwork => {
    artwork = artworkForDisplay(artwork);
    return `
    <article class="artwork-card" data-id="${artwork.id}">
      <div class="artwork-image-container">
        ${artwork.imageData
      ? `<img class="artwork-image" src="${artwork.imageData}" alt="${artwork.title || 'Artwork'}">`
      : `<div class="artwork-image ${artwork.placeholderClass || 'placeholder-1'}"></div>`
    }
        <span class="status-indicator ${artwork.status === 'wishlist' ? 'wishlist' : ''}"></span>
      </div>
      <div class="artwork-info">
        <h3 class="artwork-title">${artwork.title || 'Untitled'}</h3>
        <p class="artwork-artist">${artwork.artist || 'Unknown artist'}</p>
        <p class="artwork-meta">
          ${artwork.year || ''}${artwork.year && artwork.medium ? ' · ' : ''}${artwork.medium || ''}
        </p>
      </div>
    </article>
  `;
  }).join('');

}

function openSearch() {
  state.searchOpen = true;
  const row = document.getElementById('search-row');
  row.hidden = false;
  document.getElementById('search-btn').setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => document.getElementById('search-input').focus());
}

function closeSearch() {
  state.searchOpen = false;
  state.searchQuery = '';
  document.getElementById('search-input').value = '';
  document.getElementById('search-row').hidden = true;
  document.getElementById('search-btn').setAttribute('aria-expanded', 'false');
  renderArtworkGrid();
}

// ==================== 
// SCREEN NAVIGATION
// ====================

function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => screen.classList.remove('active'));

  const target = document.getElementById(`screen-${screenId}`);
  if (target) {
    target.classList.add('active');
    state.currentScreen = screenId;
  }

  // Load data for specific screens
  if (screenId === 'home') {
    renderFilterBar();
    renderArtworkGrid();
  } else if (screenId === 'settings') {
    renderSettingsCollections();
  }
}

// ==================== 
// DETAIL SCREEN
// ====================

async function showDetail(artworkId) {
  let artwork = await db.artworks.get(artworkId);
  if (!artwork) return;

  state.selectedArtwork = artwork;
  state.detailPanelExpanded = false;

  // Load filtered artworks for navigation (same list as grid)
  state.filteredArtworks = await loadArtworks();
  state.currentArtworkIndex = state.filteredArtworks.findIndex(a => a.id === artworkId);
  if (state.currentArtworkIndex === -1) state.currentArtworkIndex = 0;

  artwork = artworkForDisplay(artwork);

  // Update navigation UI
  updateNavigationUI();

  // Render image
  renderDetailImage(artwork);

  // Render compact info
  document.getElementById('detail-compact-info').innerHTML = `
    <h1>${artwork.title || 'Untitled'}</h1>
    <p>${artwork.artist || 'Unknown artist'}${artwork.year ? ' · ' + artwork.year : ''}</p>
  `;

  // Render panel content
  const collections = await loadCollections();
  const artworkCollections = collections.filter(c => artwork.collections && artwork.collections.includes(c.id));

  document.getElementById('panel-content').innerHTML = `
    <header class="panel-header">
      <span class="status-badge ${artwork.status === 'wishlist' ? 'wishlist' : ''}">
        ${artwork.status === 'owned' ? 'In Collection' : 'Wishlist'}
      </span>
      <h1 class="panel-title">${artwork.title || 'Untitled'}</h1>
      <p class="panel-artist">${artwork.artist || 'Unknown artist'}</p>
    </header>
    
    <section class="info-section">
      <h2 class="info-section-title">Details</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Year</span>
          <span class="info-value ${!artwork.year ? 'empty' : ''}">${artwork.year || 'Not specified'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Medium</span>
          <span class="info-value ${!artwork.medium ? 'empty' : ''}">${artwork.medium || 'Not specified'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Dimensions</span>
          <span class="info-value ${!artwork.dimensions ? 'empty' : ''}">${artwork.dimensions || 'Not specified'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Location</span>
          <span class="info-value ${!artwork.location ? 'empty' : ''}">${artwork.location || 'Not specified'}</span>
        </div>
      </div>
    </section>
    
    ${artwork.personalNote ? `
    <section class="info-section">
      <h2 class="info-section-title">Personal Note</h2>
      <div class="personal-note">
        <p>"${artwork.personalNote}"</p>
        <span class="note-date">Added ${new Date(artwork.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
      </div>
    </section>
    ` : ''}
    
    ${artworkCollections.length > 0 ? `
    <section class="info-section">
      <h2 class="info-section-title">Collections</h2>
      ${artworkCollections.map(c => `
        <button class="collection-link">${escapeHtml(c.name)}</button>
      `).join(' ')}
    </section>
    ` : ''}
    
    <div class="action-buttons">
      <button class="action-btn secondary" id="edit-artwork-btn">
        <svg viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit
      </button>
      <button class="action-btn danger" id="delete-artwork-btn">
        <svg viewBox="0 0 24 24">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Delete
      </button>
    </div>
  `;

  // Reset panel state
  const detailPanel = document.getElementById('detail-panel');
  const detailBottomBar = document.getElementById('detail-bottom-bar');
  detailPanel.classList.remove('expanded');
  detailBottomBar.style.opacity = '1';
  detailBottomBar.style.pointerEvents = 'auto';
  state.detailPanelExpanded = false;

  showScreen('detail');
}

// Helper to render detail image with animation support
function renderDetailImage(artwork, direction = null) {
  const imageArea = document.getElementById('detail-image-area');
  const animClass = direction ? `slide-${direction}` : '';

  if (artwork.imageData) {
    imageArea.innerHTML = `<img class="detail-image ${animClass}" src="${artwork.imageData}" alt="${artwork.title || 'Artwork'}">`;
  } else {
    imageArea.innerHTML = `<div class="detail-image-placeholder ${artwork.placeholderClass || 'placeholder-1'} ${animClass}"></div>`;
  }
}

// Update navigation arrows and position indicator
function updateNavigationUI() {
  const prevBtn = document.getElementById('nav-prev');
  const nextBtn = document.getElementById('nav-next');
  const positionIndicator = document.getElementById('nav-position');

  const hasPrev = state.currentArtworkIndex > 0;
  const hasNext = state.currentArtworkIndex < state.filteredArtworks.length - 1;
  const total = state.filteredArtworks.length;

  // Show/hide navigation arrows
  if (prevBtn) {
    prevBtn.style.display = hasPrev ? 'flex' : 'none';
  }
  if (nextBtn) {
    nextBtn.style.display = hasNext ? 'flex' : 'none';
  }

  // Update position indicator
  if (positionIndicator && total > 1) {
    positionIndicator.textContent = `${state.currentArtworkIndex + 1} / ${total}`;
    positionIndicator.style.display = 'block';
  } else if (positionIndicator) {
    positionIndicator.style.display = 'none';
  }
}

// Navigate to previous or next artwork
async function navigateArtwork(direction) {
  if (state.detailPanelExpanded) return; // Don't navigate when panel is open

  const newIndex = direction === 'prev'
    ? state.currentArtworkIndex - 1
    : state.currentArtworkIndex + 1;

  if (newIndex < 0 || newIndex >= state.filteredArtworks.length) return;

  state.currentArtworkIndex = newIndex;
  const artwork = state.filteredArtworks[newIndex];

  // Re-fetch from DB to ensure we have latest data
  let freshArtwork = await db.artworks.get(artwork.id);
  if (!freshArtwork) return;

  state.selectedArtwork = freshArtwork;
  freshArtwork = artworkForDisplay(freshArtwork);

  // Animate the transition
  const slideDirection = direction === 'prev' ? 'in-left' : 'in-right';
  renderDetailImage(freshArtwork, slideDirection);

  // Update compact info
  document.getElementById('detail-compact-info').innerHTML = `
    <h1>${freshArtwork.title || 'Untitled'}</h1>
    <p>${freshArtwork.artist || 'Unknown artist'}${freshArtwork.year ? ' · ' + freshArtwork.year : ''}</p>
  `;

  // Update panel content
  const collections = await loadCollections();
  const artworkCollections = collections.filter(c => freshArtwork.collections && freshArtwork.collections.includes(c.id));

  document.getElementById('panel-content').innerHTML = `
    <header class="panel-header">
      <span class="status-badge ${freshArtwork.status === 'wishlist' ? 'wishlist' : ''}">
        ${freshArtwork.status === 'owned' ? 'In Collection' : 'Wishlist'}
      </span>
      <h1 class="panel-title">${freshArtwork.title || 'Untitled'}</h1>
      <p class="panel-artist">${freshArtwork.artist || 'Unknown artist'}</p>
    </header>
    
    <section class="info-section">
      <h2 class="info-section-title">Details</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Year</span>
          <span class="info-value ${!freshArtwork.year ? 'empty' : ''}">${freshArtwork.year || 'Not specified'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Medium</span>
          <span class="info-value ${!freshArtwork.medium ? 'empty' : ''}">${freshArtwork.medium || 'Not specified'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Dimensions</span>
          <span class="info-value ${!freshArtwork.dimensions ? 'empty' : ''}">${freshArtwork.dimensions || 'Not specified'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Location</span>
          <span class="info-value ${!freshArtwork.location ? 'empty' : ''}">${freshArtwork.location || 'Not specified'}</span>
        </div>
      </div>
    </section>
    
    ${freshArtwork.personalNote ? `
    <section class="info-section">
      <h2 class="info-section-title">Personal Note</h2>
      <div class="personal-note">
        <p>"${freshArtwork.personalNote}"</p>
        <span class="note-date">Added ${new Date(freshArtwork.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
      </div>
    </section>
    ` : ''}
    
    ${artworkCollections.length > 0 ? `
    <section class="info-section">
      <h2 class="info-section-title">Collections</h2>
      ${artworkCollections.map(c => `
        <button class="collection-link">${escapeHtml(c.name)}</button>
      `).join(' ')}
    </section>
    ` : ''}
    
    <div class="action-buttons">
      <button class="action-btn secondary" id="edit-artwork-btn">
        <svg viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit
      </button>
      <button class="action-btn danger" id="delete-artwork-btn">
        <svg viewBox="0 0 24 24">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Delete
      </button>
    </div>
  `;

  // Update navigation UI
  updateNavigationUI();
}

function toggleDetailPanel(expand) {
  const panel = document.getElementById('detail-panel');
  const bottomBar = document.getElementById('detail-bottom-bar');

  if (expand) {
    panel.classList.add('expanded');
    bottomBar.style.opacity = '0';
    bottomBar.style.pointerEvents = 'none';
    state.detailPanelExpanded = true;
  } else {
    panel.classList.remove('expanded');
    bottomBar.style.opacity = '1';
    bottomBar.style.pointerEvents = 'auto';
    state.detailPanelExpanded = false;
  }
}

// ==================== 
// ADD/EDIT ARTWORK
// ====================

function startAddArtwork(showCaptureScreen = true) {
  state.newArtwork = {
    id: 'art-' + Date.now(),
    status: 'owned',
    title: '',
    artist: '',
    year: null,
    medium: '',
    dimensions: '',
    location: '',
    personalNote: '',
    sourceUrl: null,
    collections: [],
    imageData: null,
    placeholderClass: `placeholder-${Math.floor(Math.random() * 6) + 1}`,
    createdAt: Date.now()
  };

  // Reset viewfinder
  const viewfinder = document.getElementById('viewfinder');
  viewfinder.classList.remove('has-image');
  viewfinder.innerHTML = '<span class="viewfinder-hint">Tap to select an image</span>';

  if (showCaptureScreen) showScreen('add');
}

function openArtworkPicker() {
  startAddArtwork(false);
  document.getElementById('file-input').click();
}

function calculateImageDimensions(width, height, maxDimension = 2200) {
  if (!width || !height) throw new Error('Invalid image dimensions');
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

async function decodeImageFile(file) {
  if ('createImageBitmap' in globalThis) {
    return globalThis.createImageBitmap(file, { imageOrientation: 'from-image' });
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Image decoding failed'));
      image.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function encodeOptimizedImage(image, dimensions, quality = 0.82) {
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image canvas is unavailable');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, dimensions.width, dimensions.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Image encoding failed')),
      'image/webp',
      quality
    );
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Image reading failed'));
    reader.readAsDataURL(blob);
  });
}

async function optimizeImageFile(file, options = {}) {
  const maxInputBytes = options.maxInputBytes ?? 25 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Choose a JPG, PNG or WebP image');
  }
  if (file.size > maxInputBytes) {
    throw new Error('Image is larger than 25 MB');
  }

  const decode = options.decode ?? decodeImageFile;
  const encode = options.encode ?? encodeOptimizedImage;
  const toDataUrl = options.toDataUrl ?? blobToDataUrl;
  const image = await decode(file);

  try {
    const dimensions = calculateImageDimensions(image.width, image.height, options.maxDimension ?? 2200);
    const blob = await encode(image, dimensions, options.quality ?? 0.82);
    const dataUrl = await toDataUrl(blob);
    if (!safeImageData(dataUrl)) throw new Error('Optimized image is invalid');

    return {
      dataUrl,
      width: dimensions.width,
      height: dimensions.height,
      originalBytes: file.size,
      optimizedBytes: blob.size,
      type: blob.type || 'image/webp'
    };
  } finally {
    if (typeof image.close === 'function') image.close();
  }
}

async function handleImageSelect(file) {
  if (!file) return;

  const viewfinder = document.getElementById('viewfinder');
  viewfinder.classList.remove('has-image');
  viewfinder.innerHTML = '<span class="viewfinder-hint">Optimizing image…</span>';

  try {
    const optimized = await optimizeImageFile(file);
    state.newArtwork.imageData = optimized.dataUrl;
    state.newArtwork.imageWidth = optimized.width;
    state.newArtwork.imageHeight = optimized.height;
    state.newArtwork.imageSize = optimized.optimizedBytes;

    // Update viewfinder
    viewfinder.classList.add('has-image');
    const preview = document.createElement('img');
    preview.src = optimized.dataUrl;
    preview.alt = 'Selected artwork';
    viewfinder.replaceChildren(preview);

    await showEditScreen(state.newArtwork, true);
  } catch (error) {
    console.error('Image optimization failed:', error);
    viewfinder.innerHTML = '<span class="viewfinder-hint">Tap to select an image</span>';
    showToast(error.message || 'This image could not be processed');
  }
}

async function showEditScreen(artwork, isNew = false) {
  state.newArtwork = { ...artwork };
  artwork = artworkForDisplay(artwork);

  const collections = await loadCollections();

  document.getElementById('edit-title').textContent = isNew ? 'New Artwork' : 'Edit Artwork';

  document.getElementById('edit-content').innerHTML = `
    <section class="image-preview-section">
      <div class="image-preview-container">
        <div class="image-preview">
          ${artwork.imageData
      ? `<img src="${artwork.imageData}" alt="Artwork">`
      : `<div class="${artwork.placeholderClass || 'placeholder-1'}" style="width:100%;height:100%;"></div>`
    }
        </div>
      </div>
    </section>
    
    <section class="form-section">
      <h2 class="form-section-title">Status</h2>
      <div class="status-toggle">
        <button class="status-option ${artwork.status === 'owned' ? 'active' : ''}" data-status="owned">
          <span class="status-dot"></span>
          <span>Owned</span>
        </button>
        <button class="status-option wishlist ${artwork.status === 'wishlist' ? 'active' : ''}" data-status="wishlist">
          <span class="status-dot"></span>
          <span>Wishlist</span>
        </button>
      </div>
    </section>
    
    <section class="form-section">
      <h2 class="form-section-title">Details</h2>
      
      <div class="input-group">
        <label class="input-label">Title <span class="optional-hint">· optional</span></label>
        <input type="text" class="input-field" id="input-title" placeholder="e.g. Composition in Ochre" value="${artwork.title || ''}">
      </div>
      
      <div class="input-group">
        <label class="input-label">Artist <span class="optional-hint">· optional</span></label>
        <input type="text" class="input-field" id="input-artist" placeholder="e.g. Maria van den Berg" value="${artwork.artist || ''}">
      </div>
      
      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Year <span class="optional-hint">· optional</span></label>
          <input type="text" class="input-field" id="input-year" placeholder="e.g. 2023" value="${artwork.year || ''}">
        </div>
        <div class="input-group">
          <label class="input-label">Medium <span class="optional-hint">· optional</span></label>
          <input type="text" class="input-field" id="input-medium" placeholder="e.g. Oil on canvas" value="${artwork.medium || ''}">
        </div>
      </div>
      
      <div class="input-group">
        <label class="input-label">Dimensions <span class="optional-hint">· optional</span></label>
        <input type="text" class="input-field" id="input-dimensions" placeholder="e.g. 80 × 100 cm" value="${artwork.dimensions || ''}">
      </div>
    </section>
    
    <section class="form-section">
      <h2 class="form-section-title">Personal</h2>
      
      <div class="input-group">
        <label class="input-label">Location <span class="optional-hint">· optional</span></label>
        <input type="text" class="input-field" id="input-location" placeholder="e.g. Living room, east wall" value="${artwork.location || ''}">
      </div>
      
      <div class="input-group">
        <label class="input-label">Note <span class="optional-hint">· optional</span></label>
        <textarea class="input-field textarea" id="input-note" placeholder="Your thoughts, memories, or story behind this piece...">${artwork.personalNote || ''}</textarea>
      </div>
    </section>
    
    <section class="form-section">
      <h2 class="form-section-title">Collections</h2>
      <div class="collection-pills">
        ${collections.map(c => `
          <button class="collection-pill ${artwork.collections && artwork.collections.includes(c.id) ? 'active' : ''}" data-collection="${escapeHtml(c.id)}">
            ${escapeHtml(c.name)}
          </button>
        `).join('')}
        <button class="collection-pill add" id="add-collection-btn">
          <svg viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New
        </button>
      </div>
    </section>
  `;

  showScreen('edit');
}

async function saveArtwork() {
  const artwork = state.newArtwork;

  // Get values from form
  artwork.title = document.getElementById('input-title').value.trim();
  artwork.artist = document.getElementById('input-artist').value.trim();
  artwork.year = document.getElementById('input-year').value.trim() || null;
  artwork.medium = document.getElementById('input-medium').value.trim();
  artwork.dimensions = document.getElementById('input-dimensions').value.trim();
  artwork.location = document.getElementById('input-location').value.trim();
  artwork.personalNote = document.getElementById('input-note').value.trim();

  // Get selected collections
  const selectedPills = document.querySelectorAll('.collection-pill.active:not(.add)');
  artwork.collections = Array.from(selectedPills).map(p => p.dataset.collection);

  // Save to database
  await db.artworks.put(artwork);

  // Show toast
  showToast('Artwork saved');

  // Go back to home
  showScreen('home');
}

function syncEditFormToState() {
  const titleInput = document.getElementById('input-title');
  if (!titleInput || !state.newArtwork) return;

  state.newArtwork.title = titleInput.value.trim();
  state.newArtwork.artist = document.getElementById('input-artist').value.trim();
  state.newArtwork.year = document.getElementById('input-year').value.trim() || null;
  state.newArtwork.medium = document.getElementById('input-medium').value.trim();
  state.newArtwork.dimensions = document.getElementById('input-dimensions').value.trim();
  state.newArtwork.location = document.getElementById('input-location').value.trim();
  state.newArtwork.personalNote = document.getElementById('input-note').value.trim();
  state.newArtwork.collections = Array.from(
    document.querySelectorAll('.collection-pill.active:not(.add)')
  ).map((pill) => pill.dataset.collection);
}

function openCollectionDialog(collection = null, selectAfterCreate = false) {
  state.collectionDialog = {
    id: collection?.id || null,
    selectAfterCreate
  };

  document.getElementById('collection-dialog-title').textContent = collection ? 'Rename collection' : 'New collection';
  document.getElementById('collection-name-input').value = collection?.name || '';
  document.getElementById('collection-dialog-error').textContent = '';
  document.getElementById('collection-dialog-overlay').classList.add('show');
  requestAnimationFrame(() => document.getElementById('collection-name-input').focus());
}

function hideCollectionDialog() {
  document.getElementById('collection-dialog-overlay').classList.remove('show');
  state.collectionDialog = null;
}

async function saveCollectionDialog() {
  const input = document.getElementById('collection-name-input');
  const error = document.getElementById('collection-dialog-error');
  const name = input.value.trim();

  if (!name) {
    error.textContent = 'Enter a collection name.';
    input.focus();
    return;
  }

  const collections = await loadCollections();
  const duplicate = collections.find((collection) => (
    collection.name.toLocaleLowerCase() === name.toLocaleLowerCase() &&
    collection.id !== state.collectionDialog?.id
  ));
  if (duplicate) {
    error.textContent = 'A collection with this name already exists.';
    input.focus();
    return;
  }

  let collectionId = state.collectionDialog?.id;
  const selectAfterCreate = state.collectionDialog?.selectAfterCreate;

  if (collectionId) {
    await db.collections.update(collectionId, { name });
    showToast('Collection renamed');
  } else {
    collectionId = globalThis.crypto?.randomUUID
      ? `col-${globalThis.crypto.randomUUID()}`
      : `col-${Date.now()}`;
    const nextSortOrder = collections.length
      ? Math.max(...collections.map((collection) => Number(collection.sortOrder) || 0)) + 1
      : 0;
    await db.collections.add({ id: collectionId, name, sortOrder: nextSortOrder });
    showToast('Collection created');
  }

  hideCollectionDialog();
  await renderFilterBar();
  await renderSettingsCollections();

  if (selectAfterCreate && state.newArtwork) {
    syncEditFormToState();
    state.newArtwork.collections = [...new Set([
      ...(state.newArtwork.collections || []),
      collectionId
    ])];
    await showEditScreen(state.newArtwork, document.getElementById('edit-title').textContent === 'New Artwork');
  }
}

async function deleteCollection(collection) {
  await db.transaction('rw', db.artworks, db.collections, async () => {
    const artworks = await db.artworks.toArray();
    const changedArtworks = artworks
      .filter((artwork) => artwork.collections?.includes(collection.id))
      .map((artwork) => ({
        ...artwork,
        collections: artwork.collections.filter((id) => id !== collection.id)
      }));

    if (changedArtworks.length) await db.artworks.bulkPut(changedArtworks);
    await db.collections.delete(collection.id);
  });

  if (state.currentCollection === collection.id) state.currentCollection = null;
  showToast('Collection deleted');
  await renderSettingsCollections();
  await renderFilterBar();
}

async function deleteArtwork(artworkId) {
  await db.artworks.delete(artworkId);
  showToast('Artwork deleted');
  showScreen('home');
}

async function shareArtwork(artwork) {
  const imageData = safeImageData(artwork.imageData);
  if (!imageData) {
    showToast('No image to share');
    return;
  }

  showToast('Preparing share...');

  try {
    // 1. Create canvas and draw the card
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Wait for image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageData;
    });

    // Set canvas size (vertical layout)
    const padding = 60;
    const textHeight = 200;
    const width = 1200;
    const scale = width / img.width;
    const height = (img.height * scale) + textHeight + (padding * 2);

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw Image
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, img.height * scale);

    // Text configuration
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';

    // Title
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText(artwork.title || 'Untitled', width / 2, (img.height * scale) + 100);

    // Artist
    ctx.fillStyle = '#666666';
    ctx.font = '40px sans-serif';
    ctx.fillText(artwork.artist || 'Unknown Artist', width / 2, (img.height * scale) + 170);

    // Watermark
    ctx.fillStyle = '#cccccc';
    ctx.font = '24px sans-serif';
    ctx.fillText('Art Album', width / 2, height - 30);

    // 2. Convert to Blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    const file = new File([blob], `share-${artwork.id}.jpg`, { type: 'image/jpeg' });

    // 3. Share or Download
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: artwork.title || 'Artwork',
        text: `Check out "${artwork.title}" by ${artwork.artist} from my collection.`
      });
    } else {
      // Fallback: Download
      downloadBlob(blob, `share-${artwork.title || 'artwork'}.jpg`);
      showToast('Image downloaded');
    }

  } catch (error) {
    console.error('Share failed:', error);
    showToast('Share failed');
  }
}

// ==================== 
// UI HELPERS
// ====================

function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function showConfirmDialog(title, message, onConfirm) {
  document.getElementById('dialog-title').textContent = title;
  document.getElementById('dialog-message').textContent = message;
  document.getElementById('dialog-overlay').classList.add('show');

  // Store callback
  window.dialogConfirmCallback = onConfirm;
}

function hideConfirmDialog() {
  document.getElementById('dialog-overlay').classList.remove('show');
  window.dialogConfirmCallback = null;
}

// ==================== 
// BACKUP/RESTORE
// ====================

async function exportCollection() {
  try {
    showToast('Preparing backup...');

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

    // Download one portable JSON file with the image data embedded.
    const fullExport = {
      ...exportData,
      artworks: artworks // Include full artwork data with images
    };

    const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `art-collection-backup-${formatDate(new Date())}.json`);

    showToast('Backup saved!');
  } catch (error) {
    console.error('Export failed:', error);
    showToast('Export failed');
  }
}

async function importCollection(file, mode = 'merge') {
  try {
    showToast('Importing...');

    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data.artworks) || !Array.isArray(data.collections)) {
      throw new Error('Invalid backup file format');
    }

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

    // Import artworks
    for (const artwork of data.artworks) {
      const existing = await db.artworks.get(artwork.id);
      if (!existing || mode === 'replace') {
        await db.artworks.put(artwork);
      }
    }

    showToast(`Imported ${data.artworks.length} artworks`);
    if (state.currentScreen === 'onboarding') {
      completeOnboarding();
    } else {
      showScreen('home');
    }
    return true;
  } catch (error) {
    console.error('Import failed:', error);
    showToast('Import failed: Invalid file');
    return false;
  }
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

// ==================== 
// EVENT LISTENERS
// ====================

function attachEventListeners() {
  // First-run onboarding
  document.getElementById('onboarding-empty').addEventListener('click', startEmptyOnboarding);
  document.getElementById('onboarding-demo').addEventListener('click', startDemoOnboarding);
  document.getElementById('onboarding-import').addEventListener('click', () => {
    document.getElementById('onboarding-import-input').click();
  });
  document.getElementById('onboarding-import-input').addEventListener('change', async (e) => {
    if (e.target.files[0]) await importCollection(e.target.files[0], 'merge');
    e.target.value = '';
  });

  // Tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.currentFilter = tab.dataset.filter;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderArtworkGrid();
    });
  });

  // Collection filter
  document.getElementById('filter-bar').addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (pill) {
      state.currentCollection = pill.dataset.collection || null;
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderArtworkGrid();
    }
  });

  // View toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.gridView = btn.dataset.view;
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const grid = document.getElementById('artwork-grid');
      grid.classList.toggle('single-column', state.gridView === 'single');
    });
  });

  // Artwork card click
  document.getElementById('artwork-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.artwork-card');
    if (card) {
      showDetail(card.dataset.id);
    }
  });

  // FAB
  document.getElementById('fab-add').addEventListener('click', openArtworkPicker);

  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => showScreen('settings'));

  // Search
  document.getElementById('search-btn').addEventListener('click', openSearch);
  document.getElementById('search-close').addEventListener('click', closeSearch);
  document.getElementById('search-input').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderArtworkGrid();
  });
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });

  // Settings screen
  document.getElementById('settings-back').addEventListener('click', () => showScreen('home'));
  document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
    toggleDarkMode(e.target.checked);
  });
  document.getElementById('export-btn').addEventListener('click', exportCollection);
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });
  document.getElementById('import-file-input').addEventListener('change', (e) => {
    if (e.target.files[0]) {
      importCollection(e.target.files[0], 'merge');
      e.target.value = ''; // Reset input
    }
  });
  document.getElementById('settings-add-collection').addEventListener('click', () => openCollectionDialog());
  document.getElementById('settings-collection-list').addEventListener('click', async (e) => {
    const actionButton = e.target.closest('[data-action]');
    if (!actionButton) return;

    const collection = await db.collections.get(actionButton.dataset.id);
    if (!collection) return;

    if (actionButton.dataset.action === 'rename-collection') {
      openCollectionDialog(collection);
    } else if (actionButton.dataset.action === 'delete-collection') {
      showConfirmDialog(
        'Delete collection?',
        `Artworks stay in your album, but “${collection.name}” will be removed from them.`,
        () => deleteCollection(collection)
      );
    }
  });

  // Detail screen
  document.getElementById('detail-back').addEventListener('click', () => showScreen('home'));
  document.getElementById('share-btn').addEventListener('click', () => shareArtwork(state.selectedArtwork));
  document.getElementById('detail-bottom-bar').addEventListener('click', () => toggleDetailPanel(true));
  document.getElementById('panel-handle').addEventListener('click', () => toggleDetailPanel(false));

  // Navigation arrows
  document.getElementById('nav-prev').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateArtwork('prev');
  });
  document.getElementById('nav-next').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateArtwork('next');
  });

  // Swipe gesture support for artwork navigation
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const minSwipeDistance = 50;

  const detailImageArea = document.getElementById('detail-image-area');

  detailImageArea.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  detailImageArea.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture();
  }, { passive: true });

  function handleSwipeGesture() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Only handle horizontal swipes (ignore if mostly vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous
        navigateArtwork('prev');
      } else {
        // Swipe left - go to next
        navigateArtwork('next');
      }
    }
  }

  // Keyboard navigation (for desktop)
  document.addEventListener('keydown', (e) => {
    if (state.currentScreen !== 'detail' || state.detailPanelExpanded) return;

    if (e.key === 'ArrowLeft') {
      navigateArtwork('prev');
    } else if (e.key === 'ArrowRight') {
      navigateArtwork('next');
    }
  });

  // Tap outside detail panel to close
  detailImageArea.addEventListener('click', () => {
    if (state.detailPanelExpanded) {
      toggleDetailPanel(false);
    }
  });

  // Detail panel actions (delegated)
  document.getElementById('panel-content').addEventListener('click', (e) => {
    if (e.target.closest('#edit-artwork-btn')) {
      showEditScreen(state.selectedArtwork, false);
    }
    if (e.target.closest('#delete-artwork-btn')) {
      showConfirmDialog(
        'Delete artwork?',
        'This action cannot be undone.',
        () => deleteArtwork(state.selectedArtwork.id)
      );
    }
  });

  // Add screen
  document.getElementById('add-close').addEventListener('click', () => showScreen('home'));
  document.getElementById('capture-btn').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('gallery-btn').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('viewfinder').addEventListener('click', () => document.getElementById('file-input').click());

  document.getElementById('file-input').addEventListener('change', async (e) => {
    await handleImageSelect(e.target.files[0]);
    e.target.value = '';
  });

  // Edit screen
  document.getElementById('edit-back').addEventListener('click', () => {
    if (state.currentScreen === 'edit' && document.getElementById('edit-title').textContent === 'New Artwork') {
      showScreen('add');
    } else {
      showScreen('home');
    }
  });

  document.getElementById('save-btn').addEventListener('click', saveArtwork);

  // Edit screen delegated events
  document.getElementById('edit-content').addEventListener('click', (e) => {
    // Status toggle
    const statusBtn = e.target.closest('.status-option');
    if (statusBtn) {
      document.querySelectorAll('.status-option').forEach(b => b.classList.remove('active'));
      statusBtn.classList.add('active');
      state.newArtwork.status = statusBtn.dataset.status;
    }

    // Collection pills
    const collectionPill = e.target.closest('.collection-pill:not(.add)');
    if (collectionPill) {
      collectionPill.classList.toggle('active');
    }

    if (e.target.closest('#add-collection-btn')) {
      syncEditFormToState();
      openCollectionDialog(null, true);
    }
  });

  // Confirm dialog
  document.getElementById('dialog-cancel').addEventListener('click', hideConfirmDialog);
  document.getElementById('dialog-confirm').addEventListener('click', () => {
    if (window.dialogConfirmCallback) {
      window.dialogConfirmCallback();
    }
    hideConfirmDialog();
  });
  document.getElementById('dialog-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      hideConfirmDialog();
    }
  });

  document.getElementById('collection-dialog-cancel').addEventListener('click', hideCollectionDialog);
  document.getElementById('collection-dialog-save').addEventListener('click', saveCollectionDialog);
  document.getElementById('collection-dialog-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideCollectionDialog();
  });
  document.getElementById('collection-name-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveCollectionDialog();
    if (e.key === 'Escape') hideCollectionDialog();
  });
}

// ==================== 
// START APP
// ====================

const appReady = initApp();

export {
  appReady,
  calculateImageDimensions,
  db,
  state,
  deleteCollection,
  closeSearch,
  completeOnboarding,
  hideCollectionDialog,
  handleImageSelect,
  importCollection,
  openCollectionDialog,
  openArtworkPicker,
  openSearch,
  optimizeImageFile,
  loadArtworks,
  renderArtworkGrid,
  renderSettingsCollections,
  saveCollectionDialog,
  startDemoOnboarding,
  startEmptyOnboarding,
  startAddArtwork,
  showEditScreen,
  showScreen
};
