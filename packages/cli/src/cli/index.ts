import { Command } from 'commander';
import { createRequire } from 'module';
import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import { AI_TOOLS } from '../core/config.js';
import { resolveLocale } from '../i18n/index.js';
import { getMessages } from '../i18n/index.js';

const program = new Command();
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

// Parse --lang early from process.argv so we can localize static descriptions
const langIdx = process.argv.indexOf('--lang');
const earlyLocale = langIdx !== -1 ? resolveLocale(process.argv[langIdx + 1]) : resolveLocale();
const m = getMessages(earlyLocale);

program
  .name('learn-anything')
  .description('AI-powered recursive learning system with Socratic method and TDD practice')
  .version(version);

const availableToolIds = AI_TOOLS.filter((tool) => tool.skillsDir).map((tool) => tool.value);

async function generateSite(targetPath: string, force: boolean): Promise<void> {
  const { SiteGenerator } = await import('../core/site-generator.js');
  const generator = new SiteGenerator({ targetPath, force });
  await generator.generate();
}

program
  .command('init [path]')
  .description(m.cli.initCommandDescription)
  .option('--tools <tools>', m.cli.toolsOptionDescription(availableToolIds.join(', ')))
  .option('--force', m.cli.forceOption)
  .option('--lang <locale>', m.cli.langOption)
  .option('--site', m.cli.siteOption)
  .option('--context7', 'Enable Context7 documentation verification')
  .option('--no-context7', 'Disable Context7 documentation verification')
  .action(
    async (
      targetPath = '.',
      options?: {
        tools?: string;
        force?: boolean;
        lang?: string;
        site?: boolean;
        context7?: boolean;
      },
    ) => {
      const cliLocale = resolveLocale(options?.lang);
      const localeMsgs = cliLocale !== earlyLocale ? getMessages(cliLocale) : m;
      const mc = localeMsgs.cli;
      try {
        const resolvedPath = path.resolve(targetPath);

        try {
          const stats = await fs.stat(resolvedPath);
          if (!stats.isDirectory()) {
            throw new Error(mc.notDirectory(targetPath));
          }
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            console.log(chalk.yellow(mc.dirNotExist(targetPath)));
          } else if (error.message && error.message.includes('not a directory')) {
            throw error;
          } else {
            throw new Error(mc.cannotAccess(targetPath, error.message), { cause: error });
          }
        }

        const { InitCommand } = await import('../core/init.js');
        const initCommand = new InitCommand({
          tools: options?.tools,
          force: options?.force,
          locale: cliLocale,
          context7: options?.context7,
          site: options?.site,
        });
        await initCommand.execute(targetPath);

        if (initCommand.isSiteEnabled) {
          await generateSite(resolvedPath, options?.force ?? false);
        }
      } catch (error) {
        console.log();
        console.error(chalk.red(mc.errorPrefix((error as Error).message)));
        process.exit(1);
      }
    },
  );

program
  .command('update [path]')
  .description(m.cli.updateCommandDescription)
  .option('--force', m.cli.forceOption)
  .option('--lang <locale>', m.cli.langOption)
  .option('--site', m.cli.siteOption)
  .action(
    async (targetPath = '.', options?: { force?: boolean; lang?: string; site?: boolean }) => {
      const cliLocale = resolveLocale(options?.lang);
      const localeMsgs = cliLocale !== earlyLocale ? getMessages(cliLocale) : m;
      const mc = localeMsgs.cli;
      try {
        const resolvedPath = path.resolve(targetPath);

        const { InitCommand } = await import('../core/init.js');
        const initCommand = new InitCommand({
          update: true,
          force: options?.force ?? true,
          locale: cliLocale,
          site: options?.site,
        });
        await initCommand.execute(targetPath);
        console.log(chalk.green(mc.updateComplete));

        if (initCommand.isSiteEnabled) {
          await generateSite(resolvedPath, options?.force ?? false);
        }
      } catch (error) {
        console.log();
        console.error(chalk.red(mc.errorPrefix((error as Error).message)));
        process.exit(1);
      }
    },
  );

program
  .command('serve [path]')
  .description(m.cli.serveCommandDescription)
  .option('--port <number>', m.cli.portOption, parseInt)
  .option('--no-open', m.cli.noOpenOption)
  .option('--force', m.cli.forceOption)
  .option('--lang <locale>', m.cli.langOption)
  .action(
    async (
      targetPath = '.',
      options?: { port?: number; open?: boolean; force?: boolean; lang?: string },
    ) => {
      const cliLocale = resolveLocale(options?.lang);
      const mc = cliLocale !== earlyLocale ? getMessages(cliLocale).cli : m.cli;
      try {
        const { executeServe } = await import('../core/serve.js');
        await executeServe({
          targetPath,
          port: options?.port,
          open: options?.open,
          force: options?.force,
          locale: cliLocale,
        });
      } catch (error) {
        console.log();
        console.error(chalk.red(mc.errorPrefix((error as Error).message)));
        process.exit(1);
      }
    },
  );

program.parse();
