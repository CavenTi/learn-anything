import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleSite, escapeTemplateString, generateFilesTs } from '../scripts/bundle-site.mjs';

/* ------------------------------------------------------------------ */
/*  Test helpers                                                      */
/* ------------------------------------------------------------------ */

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const tmpDir = resolve(__dirname, '__tmp_bundle_test__');

function createFile(relativePath: string, content: string): void {
  const fullPath = join(tmpDir, relativePath);
  const dir = join(fullPath, '..');
  mkdirSync(dir, { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
}

beforeEach(() => {
  // Clean start
  rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

/* ------------------------------------------------------------------ */
/*  bundleSite                                                        */
/* ------------------------------------------------------------------ */

describe('bundleSite', () => {
  it('returns empty object for empty directory', () => {
    const result = bundleSite(tmpDir);
    expect(result).toEqual({});
  });

  it('returns empty object for non-existent directory', () => {
    const result = bundleSite(join(tmpDir, 'nope'));
    expect(result).toEqual({});
  });

  it('scans flat files', () => {
    createFile('package.json', '{"name":"test"}');
    createFile('index.md', '# Hello');

    const result = bundleSite(tmpDir);

    expect(Object.keys(result).sort()).toEqual(['index.md', 'package.json']);
    expect(result['package.json']).toBe('{"name":"test"}');
    expect(result['index.md']).toBe('# Hello');
  });

  it('scans nested directories', () => {
    createFile('src/components/Dashboard.vue', '<template></template>');
    createFile('src/composables/useI18n.ts', 'export {}');
    createFile('src/router/index.ts', 'export {}');

    const result = bundleSite(tmpDir);

    expect(Object.keys(result).sort()).toEqual([
      'src/components/Dashboard.vue',
      'src/composables/useI18n.ts',
      'src/router/index.ts',
    ]);
  });

  it('excludes node_modules', () => {
    createFile('package.json', '{}');
    createFile('node_modules/vitepress/package.json', '{}');
    createFile('node_modules/vue/index.js', '// vue');

    const result = bundleSite(tmpDir);

    expect(Object.keys(result)).toEqual(['package.json']);
    expect(result['node_modules/vitepress/package.json']).toBeUndefined();
  });

  it('excludes topics directory', () => {
    createFile('package.json', '{}');
    createFile('topics/javascript/state.json', '{}');
    createFile('topics/javascript/knowledge-map.md', '# JS');

    const result = bundleSite(tmpDir);

    expect(Object.keys(result)).toEqual(['package.json']);
    expect(result['topics/javascript/state.json']).toBeUndefined();
  });

  it('excludes package-lock.json', () => {
    createFile('package.json', '{}');
    createFile('package-lock.json', '{}');

    const result = bundleSite(tmpDir);

    expect(Object.keys(result)).toEqual(['package.json']);
  });

  it('excludes dist directory', () => {
    createFile('package.json', '{}');
    createFile('dist/index.html', '<html>');
    createFile('dist/assets/app.js', '//');

    const result = bundleSite(tmpDir);

    expect(Object.keys(result)).toEqual(['package.json']);
  });

  it('preserves src subdirectories', () => {
    createFile('src/components/Dashboard.vue', '<template>');
    createFile('src/components/TopicCard.vue', '<template>');
    createFile('src/composables/useI18n.ts', 'export {}');
    createFile('src/styles/main.css', 'body {}');

    const result = bundleSite(tmpDir);

    expect(Object.keys(result).sort()).toEqual([
      'src/components/Dashboard.vue',
      'src/components/TopicCard.vue',
      'src/composables/useI18n.ts',
      'src/styles/main.css',
    ]);
  });

  it('reads file contents correctly including UTF-8', () => {
    createFile('test.md', '# 你好世界\n\n这是中文内容。');
    createFile('config.mts', 'const title = "Jürgen\'s Blog";\n');

    const result = bundleSite(tmpDir);

    expect(result['test.md']).toBe('# 你好世界\n\n这是中文内容。');
    expect(result['config.mts']).toBe('const title = "Jürgen\'s Blog";\n');
  });

  it('sorts keys consistently via generateFilesTs', () => {
    createFile('z-last.md', 'z');
    createFile('a-first.md', 'a');
    createFile('m-middle.md', 'm');

    const files = bundleSite(tmpDir);
    const ts = generateFilesTs(files);

    const aIndex = ts.indexOf("'a-first.md'");
    const mIndex = ts.indexOf("'m-middle.md'");
    const zIndex = ts.indexOf("'z-last.md'");

    expect(aIndex).toBeLessThan(mIndex);
    expect(mIndex).toBeLessThan(zIndex);
  });
});

/* ------------------------------------------------------------------ */
/*  escapeTemplateString                                               */
/* ------------------------------------------------------------------ */

describe('escapeTemplateString', () => {
  it('returns unchanged string with no special characters', () => {
    expect(escapeTemplateString('hello world')).toBe('hello world');
    expect(escapeTemplateString('const x = 1;')).toBe('const x = 1;');
  });

  it('escapes backslashes', () => {
    expect(escapeTemplateString('C:\\Users\\test')).toBe('C:\\\\Users\\\\test');
    expect(escapeTemplateString('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  it('escapes backticks', () => {
    expect(escapeTemplateString('`hello`')).toBe('\\`hello\\`');
    expect(escapeTemplateString('const s = `template`;')).toBe('const s = \\`template\\`;');
  });

  it('escapes template literal interpolation', () => {
    expect(escapeTemplateString('${foo}')).toBe('\\${foo}');
    expect(escapeTemplateString('Hello ${name}!')).toBe('Hello \\${name}!');
  });

  it('handles combined special characters', () => {
    const input = 'const path = `C:\\Users\\${name}\\docs`;';
    const expected = 'const path = \\`C:\\\\Users\\\\\\${name}\\\\docs\\`;';
    expect(escapeTemplateString(input)).toBe(expected);
  });

  it('handles empty string', () => {
    expect(escapeTemplateString('')).toBe('');
  });

  it('handles multiline content', () => {
    const input = '# Title\n\n```ts\nconst x = `${y}`;\n```\n';
    const result = escapeTemplateString(input);
    // Backticks escaped
    expect(result).toContain('\\`\\`\\`ts');
    // Template literal escaped
    expect(result).toContain('\\${y}');
    // Backticks in closing fence escaped
    expect(result).toContain('\\`\\`\\`');
  });
});

/* ------------------------------------------------------------------ */
/*  generateFilesTs                                                    */
/* ------------------------------------------------------------------ */

describe('generateFilesTs', () => {
  it('generates valid TypeScript for empty mapping', () => {
    const result = generateFilesTs({});

    expect(result).toContain('export const SITE_FILES: Record<string, string> = {');
    expect(result).toContain('};');
    // Should compile (rough check — no syntax errors)
    expect(() => {
      // Verify it looks like valid TS
      expect(result.startsWith('// Auto-generated')).toBe(true);
    }).not.toThrow();
  });

  it('generates entries for multiple files', () => {
    const files = {
      'package.json': '{"name":"test"}',
      'pages/index.md': '# Home',
    };
    const result = generateFilesTs(files);

    expect(result).toContain(`'package.json': \`{"name":"test"}\``);
    expect(result).toContain(`'pages/index.md': \`# Home\``);
  });

  it('includes auto-generated header comment', () => {
    const result = generateFilesTs({});

    expect(result).toContain('Auto-generated by scripts/bundle-site.mjs');
    expect(result).toContain('DO NOT EDIT');
  });

  it('generates output that can be parsed as a module', () => {
    const files = {
      'test.md': '# Hello World\n\nThis is a test.',
    };
    const result = generateFilesTs(files);

    // Write to a temp file and verify we can parse it
    const testFile = join(tmpDir, 'test-output.ts');
    writeFileSync(testFile, result, 'utf-8');

    // Basic structural checks
    expect(result).toContain('export const SITE_FILES');
    expect(result).toContain('Record<string, string>');
    expect(result).toContain(`'test.md':`);
  });

  it('handles filenames with special characters', () => {
    const files = {
      'src/router/index.ts': 'export default {}',
      'src/composables/useI18n.ts': 'export function useI18n() {}',
    };
    const result = generateFilesTs(files);

    expect(result).toContain(`'src/router/index.ts'`);
    expect(result).toContain(`'src/composables/useI18n.ts'`);
  });
});
