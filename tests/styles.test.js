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
