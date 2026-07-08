import { basename, dirname } from 'node:path';
import { readText } from '@cem/shared';
import {
  type AgentMetadata,
  type ArtifactScope,
  type SkillMetadata,
  estimateTokens,
} from '@cem/core';
import { parseFrontmatter, fmString, fmList } from './frontmatter.js';

/** Parse a skill's `SKILL.md` content into structured metadata. */
export function analyzeSkillContent(
  content: string,
  skillMdPath: string,
  files: readonly string[] = [],
  scope: ArtifactScope = 'unknown',
): SkillMetadata {
  const { data } = parseFrontmatter(content);
  const name = fmString(data, 'name') ?? basename(dirname(skillMdPath));
  const dependencies = fmList(data, 'dependencies');

  return {
    name,
    ...(fmString(data, 'description') ? { description: fmString(data, 'description') } : {}),
    ...(fmString(data, 'author') ? { author: fmString(data, 'author') } : {}),
    ...(fmString(data, 'version') ? { version: fmString(data, 'version') } : {}),
    path: skillMdPath,
    scope,
    files: files.length > 0 ? [...files] : [skillMdPath],
    tokens: estimateTokens(content),
    ...(dependencies.length > 0 ? { dependencies } : {}),
  };
}

/** Read and analyze a skill from its `SKILL.md` file. */
export async function analyzeSkillFile(
  skillMdPath: string,
  files: readonly string[] = [],
  scope: ArtifactScope = 'unknown',
): Promise<SkillMetadata> {
  const content = await readText(skillMdPath);
  return analyzeSkillContent(content, skillMdPath, files, scope);
}

/** Parse an agent definition's content into structured metadata. */
export function analyzeAgentContent(
  content: string,
  agentPath: string,
  scope: ArtifactScope = 'unknown',
): AgentMetadata {
  const { data } = parseFrontmatter(content);
  const name = fmString(data, 'name') ?? basename(agentPath).replace(/\.mdx?$/i, '');
  const tools = fmList(data, 'tools');
  const disabled = data.disabled === true || data.enabled === false;

  return {
    name,
    ...(fmString(data, 'description') ? { description: fmString(data, 'description') } : {}),
    ...(fmString(data, 'model') ? { model: fmString(data, 'model') } : {}),
    ...(tools.length > 0 ? { tools } : {}),
    path: agentPath,
    scope,
    tokens: estimateTokens(content),
    enabled: !disabled,
  };
}

/** Read and analyze an agent definition file. */
export async function analyzeAgentFile(
  agentPath: string,
  scope: ArtifactScope = 'unknown',
): Promise<AgentMetadata> {
  const content = await readText(agentPath);
  return analyzeAgentContent(content, agentPath, scope);
}
