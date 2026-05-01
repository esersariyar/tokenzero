#!/usr/bin/env node
import { Command } from 'commander';
import { runInit } from './commands/initCommand';
import { runPack } from './commands/packCommand';
import { runCompress } from './commands/compressCommand';
import { runJson } from './commands/jsonCommand';
import { runAnalyze } from './commands/analyzeCommand';

const pkg = require('../../package.json') as { version: string };

function fail(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`tokenzero: ${message}\n`);
  if (process.env.DEBUG && process.env.DEBUG.includes('tokenzero') && err instanceof Error && err.stack) {
    process.stderr.write(err.stack + '\n');
  }
  process.exit(1);
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('tokenzero')
    .description('Local context optimizer for Claude Code and LLM workflows')
    .version(pkg.version);

  program
    .command('init')
    .description('Create .tokenzero/config.json and .tokenzeroignore (and optional Claude Code skill)')
    .option('--claude-code', 'install Claude Code skill at .claude/skills/tokenzero/SKILL.md')
    .option('-f, --force', 'overwrite existing files')
    .action(async (opts: { claudeCode?: boolean; force?: boolean }) => {
      try {
        const result = await runInit(opts);
        for (const p of result.created) process.stdout.write(`created  ${p}\n`);
        for (const p of result.skipped) process.stdout.write(`skipped  ${p} (already exists)\n`);
      } catch (err) {
        fail(err);
      }
    });

  program
    .command('pack')
    .description('Pack files and folders into a compact context file')
    .argument('<paths...>', 'paths to include')
    .option('-o, --out <path>', 'output file path')
    .option('--max-bytes <n>', 'skip files larger than n bytes')
    .option('--allow-large', 'include large files')
    .option('--no-text', 'skip markdown/text whitespace compression')
    .option('--no-json', 'skip JSON compression')
    .action(async (paths: string[], opts) => {
      try {
        await runPack(paths, opts);
      } catch (err) {
        fail(err);
      }
    });

  program
    .command('compress')
    .description('Compress a single text or markdown file')
    .argument('<file>', 'file to compress')
    .option('-o, --out <path>', 'output file path (default: stdout)')
    .action(async (file: string, opts) => {
      try {
        await runCompress(file, opts);
      } catch (err) {
        fail(err);
      }
    });

  program
    .command('json')
    .description('Compress a JSON file (uniform array becomes a compact table)')
    .argument('<file>', 'JSON file to compress')
    .option('-o, --out <path>', 'output file path (default: stdout)')
    .action(async (file: string, opts) => {
      try {
        await runJson(file, opts);
      } catch (err) {
        fail(err);
      }
    });

  program
    .command('analyze')
    .description('Analyze files and folders and print a savings report')
    .argument('<paths...>', 'paths to analyze')
    .option('--json', 'emit a JSON report instead of formatted text')
    .action(async (paths: string[], opts) => {
      try {
        await runAnalyze(paths, opts);
      } catch (err) {
        fail(err);
      }
    });

  await program.parseAsync(process.argv);
}

main().catch(fail);
