#!/usr/bin/env node
/* global console, process */
/**
 * bundle-site.mjs — Build script
 *
 * Scans packages/cli/site/ and generates packages/cli/src/site/files.ts
 * as a `Record<string, string>` mapping of all template files.
 *
 * Usage: node scripts/bundle-site.mjs
 *
 * Excludes: node_modules/, topics/, dist/, package-lock.json
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ------------------------------------------------------------------ */
/*  Paths                                                             */
/* ------------------------------------------------------------------ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageDir = join(__dirname, '..');

/* ------------------------------------------------------------------ */
/*  Exclusion rules                                                   */
/* ------------------------------------------------------------------ */

const EXCLUDED = new Set(['node_modules', 'topics', 'package-lock.json', 'pnpm-lock.yaml']);

const EXCLUDED_PREFIXES = ['dist'];

/**
 * Returns true if the relative path should be excluded from bundling.
 */
function isExcluded(relPath) {
  if (EXCLUDED.has(relPath)) return true;
  for (const prefix of EXCLUDED_PREFIXES) {
    if (relPath.startsWith(prefix)) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Content transformation for deployed paths                          */
/*                                                                     */
/*  The dev project (packages/cli/site/) and the deployed site          */
/*  (.learn/site/) have different directory layouts.  When topics/      */
/*  moves from a subdirectory of site/ to a sibling under .learn/,      */
/*  relative imports in vite.config.ts and useTopicData.ts must be      */
/*  adjusted.                                                          */
/* ------------------------------------------------------------------ */

const PATH_TRANSFORMS = {
  'vite.config.ts': [
    // resolve(__dirname, 'topics') → resolve(__dirname, '../topics')
    ["resolve(__dirname, 'topics')", "resolve(__dirname, '../topics')"],
  ],
  'src/composables/useTopicData.ts': [
    // ../../topics/ → ../../../topics/  (topics is now under .learn/ not site/)
    ['../../topics/', '../../../topics/'],
  ],
};

/**
 * Applies content transformations for the deployed directory layout.
 * The dev project has topics/ inside site/; the deployed project has
 * topics/ alongside site/ under .learn/.
 *
 * @param {string} relPath  Relative file path within site/.
 * @param {string} content  Original file content.
 * @returns {string}        Transformed content (or unchanged).
 */
function transformContent(relPath, content) {
  const dirRelPath = relPath.replace(/\\/g, '/');
  const transforms = PATH_TRANSFORMS[dirRelPath];
  if (!transforms) return content;

  let result = content;
  for (const [from, to] of transforms) {
    result = result.replaceAll(from, to);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  File scanner                                                      */
/* ------------------------------------------------------------------ */

/**
 * Recursively walks `dir` and returns a flat Record<string, string>
 * mapping relative-path → file-content for every non-excluded file.
 *
 * @param {string} siteDir  Absolute path to the site/ directory.
 * @returns {Record<string, string>}
 */
export function bundleSite(siteDir) {
  /** @type {Record<string, string>} */
  const files = {};

  /**
   * @param {string} dir  Absolute directory path being walked.
   */
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      // Directory may not exist yet (e.g. site/ not created) — just return
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry);

      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue; // permission errors, symlink loops, etc.
      }

      const relPath = relative(siteDir, fullPath);

      if (isExcluded(relPath)) continue;

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        const raw = readFileSync(fullPath, 'utf-8');
        files[relPath] = transformContent(relPath, raw);
      }
    }
  }

  walk(siteDir);
  return files;
}

/* ------------------------------------------------------------------ */
/*  TypeScript string escaping                                        */
/* ------------------------------------------------------------------ */

/**
 * Escapes a string for safe inclusion inside a TypeScript backtick
 * template literal.
 *
 * @param {string} content  Raw file content.
 * @returns {string}        Escaped content.
 */
export function escapeTemplateString(content) {
  return content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/* ------------------------------------------------------------------ */
/*  Code generator                                                    */
/* ------------------------------------------------------------------ */

/**
 * Generates the full TypeScript source for `files.ts` from a file mapping.
 *
 * @param {Record<string, string>} files  Relative-path → content mapping.
 * @returns {string}                      TypeScript source code.
 */
export function generateFilesTs(files) {
  const entries = Object.entries(files).sort(([a], [b]) => a.localeCompare(b));

  let output = '// Auto-generated by scripts/bundle-site.mjs — DO NOT EDIT\n';
  output += '// This file is regenerated on every build.\n';
  output += '\n';
  output += 'export const SITE_FILES: Record<string, string> = {\n';

  for (const [path, content] of entries) {
    const escaped = escapeTemplateString(content);
    output += `  '${path}': \`${escaped}\`,\n`;
  }

  output += '};\n';
  return output;
}

/* ------------------------------------------------------------------ */
/*  CLI                                                               */
/* ------------------------------------------------------------------ */

function main() {
  const siteDir = join(packageDir, 'site');
  const outputPath = join(packageDir, 'src', 'site', 'files.ts');

  // 1. Ensure output directory exists
  const outputDir = dirname(outputPath);
  mkdirSync(outputDir, { recursive: true });

  // 2. Scan site/ directory
  console.log(`[bundle-site] Scanning: ${siteDir}`);
  const files = bundleSite(siteDir);
  const fileCount = Object.keys(files).length;

  if (fileCount === 0) {
    console.warn('[bundle-site] Warning: No files found in site/ directory.');
    console.warn('[bundle-site] Make sure packages/cli/site/ exists with template files.');
  } else {
    console.log(`[bundle-site] Found ${fileCount} files`);
    for (const f of Object.keys(files).sort()) {
      console.log(`  - ${f}`);
    }
  }

  // 3. Generate files.ts
  const tsSource = generateFilesTs(files);

  // 4. Write output
  writeFileSync(outputPath, tsSource, 'utf-8');
  console.log(`[bundle-site] Generated: ${outputPath}`);
}

const isMain = process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main();
}
