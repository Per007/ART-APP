import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'styles.css'), 'utf8');

describe('theme contrast', () => {
  it('uses inverse text on the Save button in both themes', () => {
    const saveButtonRule = css.match(/\.save-btn\s*\{([^}]+)\}/)?.[1] || '';
    expect(saveButtonRule).toContain('background: var(--text-primary)');
    expect(saveButtonRule).toContain('color: var(--text-inverse)');
  });
});

describe('artwork image framing', () => {
  it.each([
    '.artwork-image',
    '.detail-image',
    '.viewfinder-frame img',
    '.image-preview img'
  ])('shows the complete image in %s', (selector) => {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rule = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`))?.[1] || '';
    expect(rule).toContain('object-fit: contain');
  });

  it('does not crop artwork cards with hover zoom', () => {
    expect(css).not.toMatch(/\.artwork-card:hover\s+\.artwork-image/);
  });

  it('keeps large detail images within a restrained viewport area', () => {
    const detailRule = css.match(/\.detail-image\s*\{([^}]+)\}/)?.[1] || '';
    expect(detailRule).toContain('max-width: min(88%, 960px)');
    expect(detailRule).toContain('max-height: 80%');
  });
});
