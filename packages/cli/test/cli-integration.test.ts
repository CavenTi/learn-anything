import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SiteGenerator } from '../src/core/site-generator.js';
import { LEARN_DIR, SITE_DIR } from '../src/core/config.js';

function siteDir(tmpDir: string) {
  return path.join(tmpDir, LEARN_DIR, SITE_DIR);
}

describe('CLI Integration — init --site', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-cli-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should generate site files alongside skill files when --site is used', async () => {
    const gen = new SiteGenerator({ targetPath: tmpDir, force: true });
    await gen.generate();

    const sd = siteDir(tmpDir);
    expect(fs.existsSync(path.join(sd, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'vite.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'src', 'main.ts'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'src', 'router', 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'src', 'components', 'Dashboard.vue'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'src', 'components', 'AppSidebar.vue'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'src', 'components', 'TopicPage.vue'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'src', 'composables', 'useI18n.ts'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'src', 'composables', 'useTopicData.ts'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'src', 'styles', 'main.css'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'src', 'styles', 'code.css'))).toBe(true);
    expect(fs.existsSync(path.join(sd, '.gitignore'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'tsconfig.json'))).toBe(true);
  });

  it('should NOT generate site files when SiteGenerator is not called (init without --site)', async () => {
    const sd = siteDir(tmpDir);
    // After init (without --site), site files should not exist
    expect(fs.existsSync(path.join(sd, 'package.json'))).toBe(false);
    expect(fs.existsSync(path.join(sd, 'vite.config.ts'))).toBe(false);
    expect(fs.existsSync(path.join(sd, 'src'))).toBe(false);
  });

  it('should write .gitignore with node_modules/ and dist/', async () => {
    const gen = new SiteGenerator({ targetPath: tmpDir, force: true });
    await gen.generate();

    const gitignorePath = path.join(siteDir(tmpDir), '.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    expect(content).toContain('node_modules');
    expect(content).toContain('dist');
  });

  it('should not interfere with .learn/ directory', async () => {
    const learnDir = path.join(tmpDir, LEARN_DIR);
    fs.mkdirSync(learnDir, { recursive: true });
    expect(fs.existsSync(learnDir)).toBe(true);
  });
});

describe('CLI Integration — update --site', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-cli-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should overwrite config files but preserve theme files on update --site', async () => {
    const gen1 = new SiteGenerator({ targetPath: tmpDir, force: true });
    await gen1.generate();

    const sd = siteDir(tmpDir);

    // Simulate user customization of a theme file
    const dashPath = path.join(sd, 'src', 'components', 'Dashboard.vue');
    const customizedContent =
      '<!-- user custom dashboard -->\n' + fs.readFileSync(dashPath, 'utf-8');
    fs.writeFileSync(dashPath, customizedContent, 'utf-8');

    // Simulate user modifying a config file
    const vitePath = path.join(sd, 'vite.config.ts');
    const oldConfig = '// old config\n';
    fs.writeFileSync(vitePath, oldConfig, 'utf-8');

    // Run update --site (no force)
    const gen2 = new SiteGenerator({ targetPath: tmpDir });
    await gen2.generate();

    // Theme file should be preserved
    expect(fs.readFileSync(dashPath, 'utf-8')).toBe(customizedContent);

    // Config file should be overwritten
    const newConfig = fs.readFileSync(vitePath, 'utf-8');
    expect(newConfig).not.toBe(oldConfig);
    expect(newConfig).toContain('defineConfig');
  });

  it('should overwrite theme files when update --site --force is used', async () => {
    const gen1 = new SiteGenerator({ targetPath: tmpDir, force: true });
    await gen1.generate();

    const sd = siteDir(tmpDir);
    const dashPath = path.join(sd, 'src', 'components', 'Dashboard.vue');
    fs.writeFileSync(dashPath, '// modified\n', 'utf-8');

    const gen2 = new SiteGenerator({ targetPath: tmpDir, force: true });
    await gen2.generate();

    const content = fs.readFileSync(dashPath, 'utf-8');
    expect(content).not.toBe('// modified\n');
    expect(content).toContain('<script setup');
  });

  it('should overwrite package.json on update --site', async () => {
    const gen1 = new SiteGenerator({ targetPath: tmpDir, force: true });
    await gen1.generate();

    const sd = siteDir(tmpDir);
    const pkgPath = path.join(sd, 'package.json');
    fs.writeFileSync(pkgPath, '{"name": "old-custom"}', 'utf-8');

    const gen2 = new SiteGenerator({ targetPath: tmpDir });
    await gen2.generate();

    const content = fs.readFileSync(pkgPath, 'utf-8');
    expect(content).toContain('"learn-anything-site"');
  });
});

describe('CLI Integration — serve flow (pre-vite stages)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-cli-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should generate files without existing site directory', async () => {
    const gen = new SiteGenerator({ targetPath: tmpDir, force: true });
    await gen.generate();

    const sd = siteDir(tmpDir);
    expect(fs.existsSync(path.join(sd, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'vite.config.ts'))).toBe(true);
  });

  it('should generate files into existing .learn/ directory', async () => {
    const learnDir = path.join(tmpDir, LEARN_DIR);
    fs.mkdirSync(learnDir, { recursive: true });

    const gen = new SiteGenerator({ targetPath: tmpDir, force: true });
    await gen.generate();

    const sd = siteDir(tmpDir);
    expect(fs.existsSync(path.join(sd, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(sd, 'vite.config.ts'))).toBe(true);
  });

  it('should generate files when .learn/topics/ exists (with data)', async () => {
    const topicsDir = path.join(tmpDir, LEARN_DIR, 'topics', 'javascript');
    fs.mkdirSync(topicsDir, { recursive: true });
    fs.writeFileSync(path.join(topicsDir, 'state.json'), '{"slug":"javascript"}', 'utf-8');

    const gen = new SiteGenerator({ targetPath: tmpDir, force: true });
    await gen.generate();

    // Site files should be generated in site/ alongside existing data
    const sd = siteDir(tmpDir);
    expect(fs.existsSync(path.join(sd, 'package.json'))).toBe(true);
    // Existing data should not be affected
    expect(fs.readFileSync(path.join(topicsDir, 'state.json'), 'utf-8')).toBe(
      '{"slug":"javascript"}',
    );
  });

  it('should handle empty topics directory gracefully', async () => {
    const topicsDir = path.join(tmpDir, LEARN_DIR, 'topics');
    fs.mkdirSync(topicsDir, { recursive: true });

    const gen = new SiteGenerator({ targetPath: tmpDir, force: true });
    await gen.generate();

    // Generation should succeed even with empty topics
    const sd = siteDir(tmpDir);
    expect(fs.existsSync(path.join(sd, 'package.json'))).toBe(true);
  });

  it('should set --force flag correctly in serve flow', async () => {
    const gen1 = new SiteGenerator({ targetPath: tmpDir, force: true });
    await gen1.generate();

    const sd = siteDir(tmpDir);
    const dashPath = path.join(sd, 'src', 'components', 'Dashboard.vue');
    fs.writeFileSync(dashPath, '// custom\n', 'utf-8');

    // serve --force should overwrite theme files
    const gen2 = new SiteGenerator({ targetPath: tmpDir, force: true });
    await gen2.generate();

    expect(fs.readFileSync(dashPath, 'utf-8')).not.toBe('// custom\n');
  });
});

describe('CLI Integration — regression: init without --site', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-cli-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should not create site files when --site is not used', async () => {
    const learnDir = path.join(tmpDir, LEARN_DIR);
    fs.mkdirSync(learnDir, { recursive: true });
    const topicsDir = path.join(learnDir, 'topics');
    fs.mkdirSync(topicsDir, { recursive: true });

    expect(fs.existsSync(learnDir)).toBe(true);
    expect(fs.existsSync(topicsDir)).toBe(true);

    // Site-specific files should NOT exist (they go under .learn/site/)
    const sd = siteDir(tmpDir);
    expect(fs.existsSync(path.join(sd, 'package.json'))).toBe(false);
    expect(fs.existsSync(path.join(sd, 'vite.config.ts'))).toBe(false);
    expect(fs.existsSync(path.join(sd, 'src'))).toBe(false);
    expect(fs.existsSync(path.join(sd, 'index.html'))).toBe(false);
  });

  it('should not affect existing .learn/ data when --site is not used', async () => {
    const topicsDir = path.join(tmpDir, LEARN_DIR, 'topics', 'python');
    fs.mkdirSync(topicsDir, { recursive: true });
    const statePath = path.join(topicsDir, 'state.json');
    fs.writeFileSync(statePath, '{"slug":"python","domains":{}}', 'utf-8');

    // Existing data intact (no SiteGenerator called)
    expect(fs.readFileSync(statePath, 'utf-8')).toBe('{"slug":"python","domains":{}}');
    const sd = siteDir(tmpDir);
    expect(fs.existsSync(path.join(sd, 'package.json'))).toBe(false);
  });
});
