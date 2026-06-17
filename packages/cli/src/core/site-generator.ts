import path from 'path';
import { SITE_FILES } from '../site/files.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { LEARN_DIR, SITE_DIR } from './config.js';

const THEME_DIRS = ['src/components/', 'src/composables/', 'src/styles/'];

export interface SiteGeneratorOptions {
  targetPath?: string;
  force?: boolean;
}

export class SiteGenerator {
  private readonly targetPath: string;
  private readonly force: boolean;

  constructor(options: SiteGeneratorOptions = {}) {
    this.targetPath = path.resolve(options.targetPath ?? '.');
    this.force = options.force ?? false;
  }

  async generate(): Promise<string[]> {
    const siteDir = path.join(this.targetPath, LEARN_DIR, SITE_DIR);
    const written: string[] = [];

    for (const [relativePath, content] of Object.entries(SITE_FILES)) {
      const destPath = path.join(siteDir, relativePath);

      if (this.isThemeFile(relativePath) && !this.force) {
        const exists = await FileSystemUtils.fileExists(destPath);
        if (exists) continue;
      }

      await FileSystemUtils.writeFile(destPath, content);
      written.push(relativePath);
    }

    return written;
  }

  private isThemeFile(relativePath: string): boolean {
    return THEME_DIRS.some((dir) => relativePath.startsWith(dir));
  }
}
