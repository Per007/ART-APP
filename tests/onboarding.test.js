import { describe, expect, it } from 'vitest';
import {
  appReady,
  db,
  importCollection,
  startDemoOnboarding,
  startEmptyOnboarding,
  state
} from '../app.js';

await appReady;

describe('first-run onboarding', () => {
  it('shows onboarding for a genuinely empty first run', () => {
    expect(state.currentScreen).toBe('onboarding');
    expect(document.getElementById('screen-onboarding').classList.contains('active')).toBe(true);
    expect(document.getElementById('onboarding-empty')).toBeTruthy();
    expect(document.getElementById('onboarding-demo')).toBeTruthy();
    expect(document.getElementById('onboarding-import')).toBeTruthy();
  });

  it('can start empty without silently adding demo records', async () => {
    await startEmptyOnboarding();
    expect(localStorage.getItem('onboardingComplete')).toBe('true');
    expect(state.currentScreen).toBe('home');
    expect(await db.artworks.count()).toBe(0);
  });

  it('can explicitly populate the demo collection', async () => {
    await startDemoOnboarding();
    expect(state.currentScreen).toBe('home');
    expect(await db.artworks.count()).toBe(6);
    expect(await db.collections.count()).toBe(4);
  });

  it('completes onboarding after importing a valid backup', async () => {
    await db.artworks.clear();
    await db.collections.clear();
    localStorage.removeItem('onboardingComplete');
    state.currentScreen = 'onboarding';

    const backup = {
      version: 1,
      collections: [{ id: 'imported-col', name: 'Imported', sortOrder: 0 }],
      artworks: [{
        id: 'imported-art',
        status: 'owned',
        title: 'Imported artwork',
        collections: ['imported-col'],
        createdAt: Date.now()
      }]
    };
    const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });

    expect(await importCollection(file)).toBe(true);
    expect(localStorage.getItem('onboardingComplete')).toBe('true');
    expect(state.currentScreen).toBe('home');
    expect(await db.artworks.get('imported-art')).toBeTruthy();
  });
});
