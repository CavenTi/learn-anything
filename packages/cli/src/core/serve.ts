import path from 'path';
import { spawn, execSync } from 'child_process';
import chalk from 'chalk';
import * as fs from 'fs';
import { SiteGenerator } from '../core/site-generator.js';
import { LEARN_DIR, SITE_DIR } from '../core/config.js';
import { getMessages } from '../i18n/index.js';
import type { SupportedLocale } from '../i18n/types.js';

export interface ServeOptions {
  targetPath?: string;
  port?: number;
  open?: boolean;
  force?: boolean;
  locale?: SupportedLocale;
}

function runCommand(
  cmd: string,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: 'pipe' });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString();
    });
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else
        reject(new Error(`Command "${cmd} ${args.join(' ')}" exited with code ${code}: ${stderr}`));
    });
    child.on('error', (err) => reject(err));
  });
}

export async function executeServe(options: ServeOptions): Promise<void> {
  const locale = options.locale ?? 'en';
  const msg = getMessages(locale);
  const m = msg.serve;
  const cli = msg.cli;

  const resolvedPath = path.resolve(options.targetPath ?? '.');
  const topicsDir = path.join(resolvedPath, LEARN_DIR, 'topics');

  // Check npm is available
  try {
    execSync('npm --version', { stdio: 'pipe' });
  } catch {
    console.error(chalk.red(m.npmNotFound));
    process.exit(1);
  }

  // Ensure .learn/topics/ exists
  if (!fs.existsSync(topicsDir)) {
    fs.mkdirSync(topicsDir, { recursive: true });
  }

  // Step 1: Generate site files
  console.log(chalk.cyan(m.generatingSiteFiles));
  const generator = new SiteGenerator({ targetPath: resolvedPath, force: options.force });
  await generator.generate();

  // Check if topics directory is empty
  try {
    const entries = fs.readdirSync(topicsDir);
    if (entries.length === 0) {
      console.log(chalk.yellow(m.emptyTopics));
    }
  } catch {
    // topicsDir already ensured above
  }

  // Step 2: Install dependencies
  console.log(chalk.cyan(m.installingDependencies));
  const sitePrefix = path.join(LEARN_DIR, SITE_DIR);
  try {
    await runCommand('npm', ['install', '--prefix', sitePrefix], resolvedPath);
  } catch (err: any) {
    console.error(chalk.red(m.installFailed(err.message)));
    process.exit(1);
  }

  // Step 3: Start Vite dev server
  console.log(chalk.cyan(m.startingDevServer));

  const viteArgs: string[] = ['--prefix', sitePrefix, 'vite', sitePrefix];
  if (options.port) {
    viteArgs.push('--port', String(options.port));
  }
  if (options.open === false) {
    viteArgs.push('--no-open');
  }

  const server = spawn('npx', viteArgs, { cwd: resolvedPath, stdio: 'inherit' });

  const cleanup = () => {
    if (server.exitCode === null) {
      server.kill('SIGTERM');
    }
    console.log(chalk.dim(`\n${m.serverStopped}`));
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  server.on('close', (code) => {
    process.removeListener('SIGINT', cleanup);
    process.removeListener('SIGTERM', cleanup);
    if (code !== 0 && code !== null) {
      console.error(chalk.red(`Vite exited with code ${code}`));
      process.exit(code);
    }
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE' && options.port) {
      console.error(chalk.red(m.portInUse(options.port)));
    } else {
      console.error(chalk.red(`${cli.errorPrefix(err.message)}`));
    }
    process.exit(1);
  });
}
