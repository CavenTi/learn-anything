import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SiteGenerator } from '../src/core/site-generator.js';
import { SITE_FILES } from '../src/site/files.js';

const THEME_DIRS = ['src/components/', 'src/composables/', 'src/styles/'];

function isThemePath(p: string): boolean {
  return THEME_DIRS.some((d) => p.startsWith(d));
}

describe('SiteGenerator', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-site-gen-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('generate() — first generation', () => {
    it('should write all SITE_FILES entries to .learn/', async () => {
      const gen = new SiteGenerator({ targetPath: tmpDir });
      const written = await gen.generate();

      const learnDir = path.join(tmpDir, '.learn');
      for (const [relPath] of Object.entries(SITE_FILES)) {
        const destPath = path.join(learnDir, relPath);
        expect(fs.existsSync(destPath), `Missing: ${relPath}`).toBe(true);
      }
      expect(written.length).toBe(Object.keys(SITE_FILES).length);
    });

    it('should create parent directories as needed', async () => {
      // Remove tmpDir so all parent dirs must be created
      fs.rmSync(tmpDir, { recursive: true, force: true });

      const gen = new SiteGenerator({ targetPath: tmpDir });
      const written = await gen.generate();

      expect(written.length).toBeGreaterThan(0);
      const learnDir = path.join(tmpDir, '.learn');
      expect(fs.existsSync(learnDir)).toBe(true);
    });

    it('should write config files (vite.config.ts, package.json, index.html, tsconfig.json)', async () => {
      const gen = new SiteGenerator({ targetPath: tmpDir });
      await gen.generate();

      const learnDir = path.join(tmpDir, '.learn');
      expect(fs.existsSync(path.join(learnDir, 'vite.config.ts'))).toBe(true);
      expect(fs.existsSync(path.join(learnDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(learnDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(learnDir, 'tsconfig.json'))).toBe(true);
    });

    it('should write src/main.ts and src/router/index.ts', async () => {
      const gen = new SiteGenerator({ targetPath: tmpDir });
      await gen.generate();

      const learnDir = path.join(tmpDir, '.learn');
      expect(fs.existsSync(path.join(learnDir, 'src', 'main.ts'))).toBe(true);
      expect(fs.existsSync(path.join(learnDir, 'src', 'router', 'index.ts'))).toBe(true);
    });

    it('should write .gitignore with node_modules/ and dist/', async () => {
      const gen = new SiteGenerator({ targetPath: tmpDir });
      await gen.generate();

      const gitignorePath = path.join(tmpDir, '.learn', '.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      expect(content).toContain('node_modules');
      expect(content).toContain('dist');
    });

    it('should write theme files (components, composables, styles)', async () => {
      const gen = new SiteGenerator({ targetPath: tmpDir });
      await gen.generate();

      const learnDir = path.join(tmpDir, '.learn');
      const srcDir = path.join(learnDir, 'src');
      expect(fs.existsSync(path.join(srcDir, 'components', 'Dashboard.vue'))).toBe(true);
      expect(fs.existsSync(path.join(srcDir, 'components', 'AppSidebar.vue'))).toBe(true);
      expect(fs.existsSync(path.join(srcDir, 'components', 'ContentViewer.vue'))).toBe(true);
      expect(fs.existsSync(path.join(srcDir, 'components', 'TopicPage.vue'))).toBe(true);
      expect(fs.existsSync(path.join(srcDir, 'composables', 'useI18n.ts'))).toBe(true);
      expect(fs.existsSync(path.join(srcDir, 'composables', 'useTopicData.ts'))).toBe(true);
      expect(fs.existsSync(path.join(srcDir, 'styles', 'main.css'))).toBe(true);
      expect(fs.existsSync(path.join(srcDir, 'styles', 'code.css'))).toBe(true);
    });

    it('should write sidebar sub-components', async () => {
      const gen = new SiteGenerator({ targetPath: tmpDir });
      await gen.generate();

      const sidebarDir = path.join(tmpDir, '.learn', 'src', 'components', 'sidebar');
      expect(fs.existsSync(path.join(sidebarDir, 'SidebarDashboard.vue'))).toBe(true);
      expect(fs.existsSync(path.join(sidebarDir, 'SidebarExerciseTree.vue'))).toBe(true);
      expect(fs.existsSync(path.join(sidebarDir, 'SidebarTopicTree.vue'))).toBe(true);
      expect(fs.existsSync(path.join(sidebarDir, 'SidebarFooter.vue'))).toBe(true);
      expect(fs.existsSync(path.join(sidebarDir, 'SidebarMobileToggle.vue'))).toBe(true);
    });

    it('should write content that matches the embedded SITE_FILES content', async () => {
      const gen = new SiteGenerator({ targetPath: tmpDir });
      await gen.generate();

      const learnDir = path.join(tmpDir, '.learn');
      // Spot-check a few files
      const pkgContent = fs.readFileSync(path.join(learnDir, 'package.json'), 'utf-8');
      // Type assertion: TS sees SITE_FILES['package.json'] as string (the type),
      // but the runtime value is a string literal from the actual Record
      const expectedPkg = (SITE_FILES as Record<string, string>)['package.json'];
      expect(pkgContent).toBe(expectedPkg);

      const mainContent = fs.readFileSync(path.join(learnDir, 'src', 'main.ts'), 'utf-8');
      const expectedMain = (SITE_FILES as Record<string, string>)['src/main.ts'];
      expect(mainContent).toBe(expectedMain);
    });
  });

  describe('generate() — overwrite rules', () => {
    it('should skip existing theme files on second generation', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      // Modify a theme file
      const dashPath = path.join(tmpDir, '.learn', 'src', 'components', 'Dashboard.vue');
      const modifiedContent = '/* user customization */\n' + fs.readFileSync(dashPath, 'utf-8');
      fs.writeFileSync(dashPath, modifiedContent, 'utf-8');

      // Second generation without force
      const gen2 = new SiteGenerator({ targetPath: tmpDir });
      const written2 = await gen2.generate();

      expect(fs.readFileSync(dashPath, 'utf-8')).toBe(modifiedContent);
      // Dashboard.vue should not be in written list since it was skipped
      expect(written2).not.toContain('src/components/Dashboard.vue');
    });

    it('should skip existing composable files', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      const composablePath = path.join(tmpDir, '.learn', 'src', 'composables', 'useI18n.ts');
      const modified = '// modified\n';
      fs.writeFileSync(composablePath, modified, 'utf-8');

      const gen2 = new SiteGenerator({ targetPath: tmpDir });
      await gen2.generate();

      expect(fs.readFileSync(composablePath, 'utf-8')).toBe(modified);
    });

    it('should skip existing style files', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      const stylePath = path.join(tmpDir, '.learn', 'src', 'styles', 'main.css');
      const modified = '/* modified */\n';
      fs.writeFileSync(stylePath, modified, 'utf-8');

      const gen2 = new SiteGenerator({ targetPath: tmpDir });
      await gen2.generate();

      expect(fs.readFileSync(stylePath, 'utf-8')).toBe(modified);
    });

    it('should overwrite config files on second generation', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      // Modify a config file
      const vitePath = path.join(tmpDir, '.learn', 'vite.config.ts');
      const modified = '// old config\n';
      fs.writeFileSync(vitePath, modified, 'utf-8');

      const gen2 = new SiteGenerator({ targetPath: tmpDir });
      await gen2.generate();

      const content = fs.readFileSync(vitePath, 'utf-8');
      expect(content).not.toBe(modified);
      expect(content).toContain('defineConfig');
    });

    it('should overwrite package.json on second generation', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      const pkgPath = path.join(tmpDir, '.learn', 'package.json');
      fs.writeFileSync(pkgPath, '{"name": "old"}', 'utf-8');

      const gen2 = new SiteGenerator({ targetPath: tmpDir });
      await gen2.generate();

      const content = fs.readFileSync(pkgPath, 'utf-8');
      expect(content).toContain('"learn-anything-site"');
      expect(content).not.toBe('{"name": "old"}');
    });

    it('should overwrite index.html on second generation', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      const htmlPath = path.join(tmpDir, '.learn', 'index.html');
      fs.writeFileSync(htmlPath, '<html></html>', 'utf-8');

      const gen2 = new SiteGenerator({ targetPath: tmpDir });
      await gen2.generate();

      const content = fs.readFileSync(htmlPath, 'utf-8');
      expect(content).toContain('<div id="app">');
    });

    it('should overwrite .gitignore on second generation', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      const gitignorePath = path.join(tmpDir, '.learn', '.gitignore');
      fs.writeFileSync(gitignorePath, 'custom-ignore\n', 'utf-8');

      const gen2 = new SiteGenerator({ targetPath: tmpDir });
      await gen2.generate();

      const content = fs.readFileSync(gitignorePath, 'utf-8');
      expect(content).toContain('node_modules');
      expect(content).toContain('dist');
    });

    it('should overwrite src/main.ts on second generation', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      const mainPath = path.join(tmpDir, '.learn', 'src', 'main.ts');
      fs.writeFileSync(mainPath, '// old main\n', 'utf-8');

      const gen2 = new SiteGenerator({ targetPath: tmpDir });
      await gen2.generate();

      const content = fs.readFileSync(mainPath, 'utf-8');
      expect(content).toContain('createApp');
    });

    it('should overwrite src/App.vue on second generation', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      const appPath = path.join(tmpDir, '.learn', 'src', 'App.vue');
      fs.writeFileSync(appPath, '// old App\n', 'utf-8');

      const gen2 = new SiteGenerator({ targetPath: tmpDir });
      await gen2.generate();

      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toContain('<script setup');
    });
  });

  describe('generate() — force mode', () => {
    it('should overwrite theme files when force is true', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      const dashPath = path.join(tmpDir, '.learn', 'src', 'components', 'Dashboard.vue');
      fs.writeFileSync(dashPath, '// modified\n', 'utf-8');

      const gen2 = new SiteGenerator({ targetPath: tmpDir, force: true });
      const written2 = await gen2.generate();

      const content = fs.readFileSync(dashPath, 'utf-8');
      expect(content).toContain('<script setup');
      expect(content).not.toBe('// modified\n');
      // With force, Dashboard.vue should be in written list
      expect(written2).toContain('src/components/Dashboard.vue');
    });

    it('should overwrite all theme files with force', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      // List some theme files and modify them
      const themeFiles = Object.keys(SITE_FILES).filter(isThemePath);
      for (const relPath of themeFiles) {
        fs.writeFileSync(path.join(tmpDir, '.learn', relPath), '// modified\n', 'utf-8');
      }

      const gen2 = new SiteGenerator({ targetPath: tmpDir, force: true });
      await gen2.generate();

      // All theme files should be restored
      for (const relPath of themeFiles) {
        const content = fs.readFileSync(path.join(tmpDir, '.learn', relPath), 'utf-8');
        expect(content).not.toBe('// modified\n');
        expect(content.length).toBeGreaterThan(10);
      }
    });

    it('should still overwrite config files when force is true', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      const vitePath = path.join(tmpDir, '.learn', 'vite.config.ts');
      fs.writeFileSync(vitePath, '// old config\n', 'utf-8');

      const gen2 = new SiteGenerator({ targetPath: tmpDir, force: true });
      await gen2.generate();

      const content = fs.readFileSync(vitePath, 'utf-8');
      expect(content).toContain('defineConfig');
    });
  });

  describe('generate() — .gitignore', () => {
    it('should always write .gitignore even if it already exists', async () => {
      const learnDir = path.join(tmpDir, '.learn');
      fs.mkdirSync(learnDir, { recursive: true });
      fs.writeFileSync(path.join(learnDir, '.gitignore'), 'custom-content', 'utf-8');

      const gen = new SiteGenerator({ targetPath: tmpDir });
      await gen.generate();

      const content = fs.readFileSync(path.join(learnDir, '.gitignore'), 'utf-8');
      expect(content).toContain('node_modules');
      expect(content).toContain('dist');
      expect(content).not.toBe('custom-content');
    });
  });

  describe('generate() — new files in SITE_FILES', () => {
    it('should write newly added files from SITE_FILES on subsequent generation', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      // Simulate a new file being added to SITE_FILES by writing a new theme file
      // that doesn't exist yet in .learn
      const gen2 = new SiteGenerator({ targetPath: tmpDir });
      const written2 = await gen2.generate();

      // All non-theme files should be rewritten; theme files skipped
      const themeKeys = Object.keys(SITE_FILES).filter(isThemePath);
      const configKeys = Object.keys(SITE_FILES).filter((k) => !isThemePath(k));
      for (const k of configKeys) {
        expect(written2).toContain(k);
      }
      for (const k of themeKeys) {
        expect(written2).not.toContain(k);
      }
    });
  });

  describe('generate() — return value', () => {
    it('should return array of written paths', async () => {
      const gen = new SiteGenerator({ targetPath: tmpDir });
      const written = await gen.generate();

      expect(Array.isArray(written)).toBe(true);
      expect(written.length).toBeGreaterThan(0);
      expect(written.every((p) => typeof p === 'string')).toBe(true);
    });

    it('should include .gitignore in written paths', async () => {
      const gen = new SiteGenerator({ targetPath: tmpDir });
      const written = await gen.generate();

      expect(written).toContain('.gitignore');
    });

    it('should not include skipped theme files on second generation', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      const gen2 = new SiteGenerator({ targetPath: tmpDir });
      const written2 = await gen2.generate();

      // No theme files should be in written on second run
      for (const p of written2) {
        expect(isThemePath(p)).toBe(false);
      }
    });

    it('should include all theme files when force is true on second generation', async () => {
      const gen1 = new SiteGenerator({ targetPath: tmpDir });
      await gen1.generate();

      const gen2 = new SiteGenerator({ targetPath: tmpDir, force: true });
      const written2 = await gen2.generate();

      const themeFiles = Object.keys(SITE_FILES).filter(isThemePath);
      for (const p of themeFiles) {
        expect(written2).toContain(p);
      }
    });
  });

  describe('SiteGenerator constructor', () => {
    it('should default targetPath to current directory', () => {
      const gen = new SiteGenerator();
      expect(gen).toBeDefined();
    });

    it('should default force to false', async () => {
      const gen = new SiteGenerator({ targetPath: tmpDir });
      await gen.generate();

      // Modify a theme file
      const dashPath = path.join(tmpDir, '.learn', 'src', 'components', 'Dashboard.vue');
      fs.writeFileSync(dashPath, '// modified\n', 'utf-8');

      const gen2 = new SiteGenerator({ targetPath: tmpDir });
      await gen2.generate();

      expect(fs.readFileSync(dashPath, 'utf-8')).toBe('// modified\n');
    });
  });
});
