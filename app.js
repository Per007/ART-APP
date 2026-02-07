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
  currentArtworkIndex: 0 // Current position in filteredArtworks
};

// ==================== 
// INITIALIZATION
// ====================

async function initApp() {
  // Check if we need to seed data
  const count = await db.artworks.count();
  if (count === 0) {
    await db.collections.bulkAdd(sampleCollections);
    await db.artworks.bulkAdd(sampleArtworks);
  }

  renderApp();
}

// ==================== 
// RENDERING
// ====================

function renderApp() {
  const app = document.getElementById('app');

  app.innerHTML = `
    ${renderHomeScreen()}
    ${renderDetailScreen()}
    ${renderAddScreen()}
    ${renderEditScreen()}
    ${renderSettingsScreen()}
    ${renderToast()}
    ${renderConfirmDialog()}
  `;

  attachEventListeners();
  showScreen(state.currentScreen);
}

function renderHomeScreen() {
  return `
    <div class="screen screen-home" id="screen-home">
      <header class="home-header">
        <div class="header-top">
          <span class="logo">Collection</span>
          <div class="header-actions">
            <button class="icon-btn" aria-label="Search">
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
      
      <input type="file" accept="image/*" class="file-input" id="file-input">
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
      
      <input type="file" accept=".zip" class="file-input" id="import-file-input">
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

  // Sort by creation date (newest first)
  artworks.sort((a, b) => b.createdAt - a.createdAt);

  return artworks;
}

async function loadCollections() {
  const collections = await db.collections.orderBy('sortOrder').toArray();
  return collections;
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
      <button class="filter-pill ${state.currentCollection === c.id ? 'active' : ''}" data-collection="${c.id}">
        ${c.name}
      </button>
    `).join('')}
  `;
}

async function renderArtworkGrid() {
  const artworks = await loadArtworks();
  const grid = document.getElementById('artwork-grid');

  if (artworks.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <h3>No artworks yet</h3>
        <p>Tap the + button to add your first piece</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = artworks.map(artwork => `
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
  `).join('');

  await updateCounts();
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
  }
}

// ==================== 
// DETAIL SCREEN
// ====================

async function showDetail(artworkId) {
  const artwork = await db.artworks.get(artworkId);
  if (!artwork) return;

  state.selectedArtwork = artwork;
  state.detailPanelExpanded = false;

  // Load filtered artworks for navigation (same list as grid)
  state.filteredArtworks = await loadArtworks();
  state.currentArtworkIndex = state.filteredArtworks.findIndex(a => a.id === artworkId);
  if (state.currentArtworkIndex === -1) state.currentArtworkIndex = 0;

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
        <button class="collection-link">${c.name}</button>
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
  const freshArtwork = await db.artworks.get(artwork.id);
  if (!freshArtwork) return;

  state.selectedArtwork = freshArtwork;

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
        <button class="collection-link">${c.name}</button>
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

function startAddArtwork() {
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

  showScreen('add');
}

function handleImageSelect(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    state.newArtwork.imageData = e.target.result;

    // Update viewfinder
    const viewfinder = document.getElementById('viewfinder');
    viewfinder.classList.add('has-image');
    viewfinder.innerHTML = `<img src="${e.target.result}" alt="Selected artwork">`;

    // Auto-proceed to edit after short delay
    setTimeout(() => {
      showEditScreen(state.newArtwork, true);
    }, 500);
  };
  reader.readAsDataURL(file);
}

async function showEditScreen(artwork, isNew = false) {
  state.newArtwork = { ...artwork };

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
          <button class="collection-pill ${artwork.collections && artwork.collections.includes(c.id) ? 'active' : ''}" data-collection="${c.id}">
            ${c.name}
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

async function deleteArtwork(artworkId) {
  await db.artworks.delete(artworkId);
  showToast('Artwork deleted');
  showScreen('home');
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

    // Create zip using inline implementation (no external dependency)
    const zipParts = [];
    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });

    // Create a simple format - just download JSON with base64 images embedded
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

    if (!data.artworks || !data.collections) {
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
    showScreen('home');
  } catch (error) {
    console.error('Import failed:', error);
    showToast('Import failed: Invalid file');
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
  document.getElementById('fab-add').addEventListener('click', startAddArtwork);

  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => showScreen('settings'));

  // Settings screen
  document.getElementById('settings-back').addEventListener('click', () => showScreen('home'));
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

  // Detail screen
  document.getElementById('detail-back').addEventListener('click', () => showScreen('home'));
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

  document.getElementById('file-input').addEventListener('change', (e) => {
    handleImageSelect(e.target.files[0]);
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
}

// ==================== 
// START APP
// ====================

initApp();
