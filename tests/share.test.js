import { describe, expect, it } from 'vitest';
import { appReady, buildShareCardLayout } from '../app.js';

await appReady;

// Stand-in for ctx.measureText: width scales with the font size in the spec.
function measureText(text, font) {
  const size = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
  return text.length * size * 0.5;
}

function layoutFor(artwork, imageSize = { width: 1600, height: 1200 }) {
  return buildShareCardLayout(artwork, imageSize, { measureText });
}

const fullArtwork = {
  title: 'Composition in Ochre',
  artist: 'Maria van den Berg',
  year: 2023,
  medium: 'Oil on canvas',
  dimensions: '80 × 100 cm'
};

function textOf(layout, role) {
  return layout.lines.filter((line) => line.role === role).map((line) => line.text);
}

describe('share card layout', () => {
  it('wraps a title that is too wide for the card', () => {
    const layout = layoutFor({
      ...fullArtwork,
      title: 'Untitled (Red Series from the Amsterdam Period, Winter Studies)'
    });

    const titleLines = textOf(layout, 'title');
    expect(titleLines.length).toBeGreaterThan(1);
    expect(titleLines.join(' ')).toBe(
      'Untitled (Red Series from the Amsterdam Period, Winter Studies)'
    );
  });

  it('breaks a single word that is wider than the card', () => {
    const layout = layoutFor({ ...fullArtwork, title: 'Wolkenkrabberbouwvakkersvakbondsvergadering'.repeat(2) });

    const titleLines = textOf(layout, 'title');
    expect(titleLines.length).toBeGreaterThan(1);
    for (const line of titleLines) {
      expect(measureText(line, layout.lines[0].font)).toBeLessThanOrEqual(layout.width);
    }
    expect(titleLines.join('')).toBe('Wolkenkrabberbouwvakkersvakbondsvergadering'.repeat(2));
  });

  it('keeps every line inside the card', () => {
    const layout = layoutFor({
      ...fullArtwork,
      title: 'Untitled (Red Series from the Amsterdam Period, Winter Studies)'
    });

    for (const line of layout.lines) {
      expect(measureText(line.text, line.font)).toBeLessThanOrEqual(layout.width);
      expect(line.y).toBeGreaterThan(layout.image.y + layout.image.height);
      expect(line.y).toBeLessThanOrEqual(layout.height);
    }
  });

  it('joins year and medium into one line', () => {
    expect(textOf(layoutFor(fullArtwork), 'meta')).toEqual([
      '2023 · Oil on canvas',
      '80 × 100 cm'
    ]);
  });

  it('drops the separator when only one of year and medium is known', () => {
    expect(textOf(layoutFor({ ...fullArtwork, medium: '' }), 'meta')).toEqual([
      '2023',
      '80 × 100 cm'
    ]);
    expect(textOf(layoutFor({ ...fullArtwork, year: null }), 'meta')).toEqual([
      'Oil on canvas',
      '80 × 100 cm'
    ]);
  });

  it('omits meta lines entirely when nothing is filled in', () => {
    const layout = layoutFor({ title: 'Growth', artist: 'Lena de Vries' });

    expect(textOf(layout, 'meta')).toEqual([]);
    expect(textOf(layout, 'title')).toEqual(['Growth']);
    expect(textOf(layout, 'artist')).toEqual(['Lena de Vries']);
  });

  it('never leaks the private location and note fields onto the card', () => {
    const layout = layoutFor({
      ...fullArtwork,
      location: 'Living room, east wall',
      personalNote: 'Bought directly from the studio.'
    });

    const allText = layout.lines.map((line) => line.text).join(' ');
    expect(allText).not.toContain('Living room');
    expect(allText).not.toContain('studio');
  });

  it('falls back to placeholders for a missing title and artist', () => {
    const layout = layoutFor({ title: '', artist: null });

    expect(textOf(layout, 'title')).toEqual(['Untitled']);
    expect(textOf(layout, 'artist')).toEqual(['Unknown artist']);
  });

  it('signs the card', () => {
    expect(textOf(layoutFor(fullArtwork), 'watermark')).toEqual(['Art Album']);
  });

  it('grows taller as more text is added', () => {
    const sparse = layoutFor({ title: 'Growth', artist: 'Lena de Vries' });
    const full = layoutFor(fullArtwork);

    expect(full.height).toBeGreaterThan(sparse.height);
  });

  it('caps the card width for large source images', () => {
    const layout = layoutFor(fullArtwork, { width: 2200, height: 1100 });

    expect(layout.width).toBe(1200);
    expect(layout.image.width).toBe(1200);
    expect(layout.image.height).toBe(600);
  });

  it('never upscales a source image that is narrower than the card', () => {
    const layout = layoutFor(fullArtwork, { width: 600, height: 900 });

    expect(layout.width).toBe(600);
    expect(layout.image.width).toBe(600);
    expect(layout.image.height).toBe(900);
  });

  it('scales typography down with the card so small cards stay proportional', () => {
    const large = layoutFor(fullArtwork, { width: 1200, height: 900 });
    const small = layoutFor(fullArtwork, { width: 600, height: 450 });

    const titleSize = (layout) =>
      parseFloat(layout.lines.find((line) => line.role === 'title').font.match(/(\d+(?:\.\d+)?)px/)[1]);

    expect(titleSize(small)).toBeCloseTo(titleSize(large) / 2, 5);
  });
});
