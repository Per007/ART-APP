import { describe, expect, it } from 'vitest';
import {
  appReady,
  closeSearch,
  openSearch,
  renderArtworkGrid,
  state,
  startDemoOnboarding,
  showScreen
} from '../app.js';

await appReady;
await startDemoOnboarding();

async function enterSearch(value) {
  const input = document.getElementById('search-input');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await renderArtworkGrid();
}

describe('artwork search', () => {
  it('opens accessibly and searches all specified metadata fields', async () => {
    state.currentFilter = 'all';
    state.currentCollection = null;
    showScreen('home');
    openSearch();

    expect(document.getElementById('search-row').hidden).toBe(false);
    expect(document.getElementById('search-btn').getAttribute('aria-expanded')).toBe('true');

    await enterSearch('provence');
    expect(document.querySelectorAll('.artwork-card')).toHaveLength(1);
    expect(document.querySelector('.artwork-title').textContent).toBe('Composition in Ochre');

    await enterSearch('bronze');
    expect(document.querySelectorAll('.artwork-card')).toHaveLength(1);
    expect(document.querySelector('.artwork-title').textContent).toBe('Growth');

    await enterSearch('east wall');
    expect(document.querySelectorAll('.artwork-card')).toHaveLength(1);
  });

  it('combines search with status filters and shows a specific empty state', async () => {
    state.currentFilter = 'wishlist';
    await enterSearch('grey');
    expect(document.querySelectorAll('.artwork-card')).toHaveLength(1);
    expect(document.querySelector('.artwork-title').textContent).toBe('Study in Grey');

    await enterSearch('does-not-exist');
    expect(document.querySelectorAll('.artwork-card')).toHaveLength(0);
    expect(document.querySelector('.empty-state h3').textContent).toBe('No matching artworks');
  });

  it('clears the query and restores the grid when closed', async () => {
    closeSearch();
    await renderArtworkGrid();

    expect(state.searchQuery).toBe('');
    expect(document.getElementById('search-row').hidden).toBe(true);
    expect(document.querySelectorAll('.artwork-card')).toHaveLength(2);
  });
});
