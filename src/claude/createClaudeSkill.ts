import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { writeFileSafe } from '../fs/writeFileSafe';

export const SKILL_RELATIVE_PATH = path.join('.claude', 'skills', 'tokenzero', 'SKILL.md');

const SKILL_CONTENT = `---
name: tokenzero
description: Use TokenZero to compress local context before referencing it in this conversation.
---

# TokenZero

TokenZero is a local context optimizer. It compresses files, JSON, and markdown so that you spend fewer tokens when sharing project context.

## Pack the project

\`\`\`bash
npx tokenzero pack . --out .tokenzero/context.md
\`\`\`

Then reference the packed file in this conversation:

\`\`\`txt
Use @.tokenzero/context.md and help me with this project.
\`\`\`

## Compress a single file

\`\`\`bash
npx tokenzero compress prompt.md --out prompt.min.md
\`\`\`

## Tabularize a JSON dataset

\`\`\`bash
npx tokenzero json data.json
\`\`\`

## Analyze before packing

\`\`\`bash
npx tokenzero analyze .
\`\`\`

TokenZero never calls external LLM APIs. All transformations are local.
`;

export type CreateSkillOptions = {
  force?: boolean;
};

export async function createClaudeSkill(rootDir: string, options: CreateSkillOptions = {}): Promise<{ path: string; created: boolean }> {
  const target = path.join(rootDir, SKILL_RELATIVE_PATH);
  if (!options.force && fsSync.existsSync(target)) {
    return { path: target, created: false };
  }
  await writeFileSafe(target, SKILL_CONTENT);
  return { path: target, created: true };
}

export async function ensureClaudeFolderExists(rootDir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path.join(rootDir, '.claude'));
    return stat.isDirectory();
  } catch {
    return false;
  }
}
