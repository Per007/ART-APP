import { describe, expect, it, vi } from 'vitest';
import {
  appReady,
  calculateImageDimensions,
  optimizeImageFile,
  showScreen,
  state
} from '../app.js';

await appReady;

describe('image optimization', () => {
  it('opens the photo picker directly from the plus button', () => {
    showScreen('home');
    const fileInput = document.getElementById('file-input');
    const picker = vi.spyOn(fileInput, 'click').mockImplementation(() => {});

    document.getElementById('fab-add').click();

    expect(picker).toHaveBeenCalledOnce();
    expect(state.currentScreen).toBe('home');
    expect(state.newArtwork).toBeTruthy();
    expect(state.newArtwork.imageData).toBeNull();
  });

  it('keeps small dimensions and scales large images proportionally', () => {
    expect(calculateImageDimensions(1200, 800)).toEqual({ width: 1200, height: 800 });
    expect(calculateImageDimensions(4400, 2200)).toEqual({ width: 2200, height: 1100 });
    expect(calculateImageDimensions(1500, 3000)).toEqual({ width: 1100, height: 2200 });
  });

  it('encodes an optimized WebP and closes the decoded image', async () => {
    const close = vi.fn();
    const encode = vi.fn(async (_image, dimensions, quality) => {
      expect(dimensions).toEqual({ width: 2200, height: 1100 });
      expect(quality).toBe(0.82);
      return new Blob(['optimized'], { type: 'image/webp' });
    });
    const file = new File(['original'], 'art.jpg', { type: 'image/jpeg' });

    const result = await optimizeImageFile(file, {
      decode: async () => ({ width: 4400, height: 2200, close }),
      encode,
      toDataUrl: async () => 'data:image/webp;base64,b3B0aW1pemVk'
    });

    expect(result.width).toBe(2200);
    expect(result.height).toBe(1100);
    expect(result.type).toBe('image/webp');
    expect(result.optimizedBytes).toBeGreaterThan(0);
    expect(close).toHaveBeenCalledOnce();
  });

  it('rejects unsupported formats and oversized inputs before decoding', async () => {
    const decode = vi.fn();
    const gif = new File(['gif'], 'animated.gif', { type: 'image/gif' });
    await expect(optimizeImageFile(gif, { decode })).rejects.toThrow('JPG, PNG or WebP');

    const large = new File(['large'], 'large.jpg', { type: 'image/jpeg' });
    await expect(optimizeImageFile(large, { maxInputBytes: 2, decode })).rejects.toThrow('25 MB');
    expect(decode).not.toHaveBeenCalled();
  });
});
