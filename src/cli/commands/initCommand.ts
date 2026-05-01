import fsSync from 'node:fs';
import path from 'node:path';
import { writeFileSafe } from '../../fs/writeFileSafe';
import { CONFIG_PATH } from '../../config/loadConfig';
import { defaultConfig } from '../../config/defaultConfig';
import { createClaudeSkill, ensureClaudeFolderExists, SKILL_RELATIVE_PATH } from '../../claude/createClaudeSkill';

const TOKENZEROIGNORE_TEMPLATE = `# .tokenzeroignore — patterns to exclude from tokenzero pack/analyze.
# Same syntax as .gitignore.

# Examples:
# logs/
# *.snap
# secrets.env
`;

export type InitOptions = {
  cwd?: string;
  claudeCode?: boolean;
  force?: boolean;
};

export async function runInit(options: InitOptions = {}): Promise<{ created: string[]; skipped: string[] }> {
  const cwd = options.cwd ?? process.cwd();
  const created: string[] = [];
  const skipped: string[] = [];

  const configPath = path.join(cwd, CONFIG_PATH);
  if (!options.force && fsSync.existsSync(configPath)) {
    skipped.push(CONFIG_PATH);
  } else {
    await writeFileSafe(configPath, JSON.stringify(defaultConfig, null, 2) + '\n');
    created.push(CONFIG_PATH);
  }

  const ignorePath = path.join(cwd, '.tokenzeroignore');
  if (!options.force && fsSync.existsSync(ignorePath)) {
    skipped.push('.tokenzeroignore');
  } else {
    await writeFileSafe(ignorePath, TOKENZEROIGNORE_TEMPLATE);
    created.push('.tokenzeroignore');
  }

  const claudeRequested = options.claudeCode || (await ensureClaudeFolderExists(cwd));
  if (claudeRequested) {
    const result = await createClaudeSkill(cwd, { force: options.force });
    if (result.created) created.push(SKILL_RELATIVE_PATH);
    else skipped.push(SKILL_RELATIVE_PATH);
  }

  return { created, skipped };
}
