import { describe, expect, it } from 'vitest';
import {
  appReady,
  db,
  deleteCollection,
  openCollectionDialog,
  saveCollectionDialog,
  showEditScreen,
  showScreen,
  startDemoOnboarding,
  state
} from '../app.js';

await appReady;
await startDemoOnboarding();

describe('collection management', () => {
  it('creates and renames a unique collection', async () => {
    showScreen('settings');
    openCollectionDialog();
    document.getElementById('collection-name-input').value = 'Archive';
    await saveCollectionDialog();

    let collection = await db.collections.where('name').equals('Archive').first();
    expect(collection).toBeTruthy();

    openCollectionDialog(collection);
    document.getElementById('collection-name-input').value = 'Private archive';
    await saveCollectionDialog();

    collection = await db.collections.get(collection.id);
    expect(collection.name).toBe('Private archive');
  });

  it('rejects duplicate and empty names', async () => {
    openCollectionDialog();
    document.getElementById('collection-name-input').value = '  ';
    await saveCollectionDialog();
    expect(document.getElementById('collection-dialog-error').textContent).toContain('Enter');

    document.getElementById('collection-name-input').value = 'living room';
    await saveCollectionDialog();
    expect(document.getElementById('collection-dialog-error').textContent).toContain('already exists');
  });

  it('preserves form values when creating a collection from the artwork editor', async () => {
    const artwork = {
      id: 'test-edit-artwork',
      status: 'owned',
      title: '',
      artist: '',
      year: null,
      medium: '',
      dimensions: '',
      location: '',
      personalNote: '',
      collections: [],
      imageData: null,
      placeholderClass: 'placeholder-1',
      createdAt: Date.now()
    };

    await showEditScreen(artwork, true);
    document.getElementById('input-title').value = 'Unsaved title';
    document.getElementById('add-collection-btn').click();
    document.getElementById('collection-name-input').value = 'New room';
    await saveCollectionDialog();

    expect(document.getElementById('input-title').value).toBe('Unsaved title');
    expect(state.newArtwork.collections).toHaveLength(1);
    expect(document.querySelector('.collection-pill.active')?.textContent).toContain('New room');
  });

  it('deletes a collection and removes its artwork references', async () => {
    const collection = await db.collections.where('name').equals('Private archive').first();
    await db.artworks.put({
      id: 'test-delete-artwork',
      status: 'owned',
      title: 'Test',
      collections: [collection.id],
      createdAt: Date.now()
    });

    await deleteCollection(collection);

    expect(await db.collections.get(collection.id)).toBeUndefined();
    expect((await db.artworks.get('test-delete-artwork')).collections).toEqual([]);
  });
});
