import { dirname } from 'node:path';
import type { Command } from 'commander';
import { scanEnvironment, filterArtifacts } from '@cem/scanner';
import { analyzeSkillFile, analyzeAgentFile } from '@cem/markdown';
import type { SkillMetadata, AgentMetadata } from '@cem/core';
import { ui, printJson, formatError } from '../ui.js';

export function registerSkills(program: Command): void {
  program
    .command('skills')
    .description('List detected skills with metadata (description, version, tokens)')
    .option('--home <dir>', 'Override the home directory')
    .option('--projects', 'Include discovered project roots', false)
    .option('--json', 'Output JSON', false)
    .action(async (opts) => {
      try {
        const scan = await scanEnvironment({
          ...(opts.home ? { home: opts.home } : {}),
          discoverProjects: Boolean(opts.projects),
          computeTokens: false,
        });
        const skillFiles = filterArtifacts(scan.artifacts, { kinds: ['skill'] });
        const skillMds = skillFiles.filter((a) => /^skill\.md$/i.test(a.name));

        const skills: SkillMetadata[] = [];
        for (const md of skillMds) {
          const dir = dirname(md.path);
          const files = skillFiles.filter((a) => a.path.startsWith(dir)).map((a) => a.path);
          try {
            skills.push(await analyzeSkillFile(md.path, files, md.scope));
          } catch {
            // skip unreadable skill
          }
        }

        if (opts.json) return printJson(skills);
        if (skills.length === 0) {
          ui.info('No skills found (looking for skills/*/SKILL.md).');
          return;
        }
        ui.heading(`Skills (${skills.length})`);
        for (const s of skills) {
          ui.item(
            `${s.name}${s.version ? ui.dim(` v${s.version}`) : ''} · ${ui.num(s.tokens)} tok · ${s.files.length} file(s)`,
          );
          if (s.description) ui.kv('  description', s.description);
          if (s.author) ui.kv('  author', s.author);
          if (s.dependencies?.length) ui.kv('  dependencies', s.dependencies.join(', '));
          ui.kv('  scope', s.scope);
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}

export function registerAgents(program: Command): void {
  program
    .command('agents')
    .description('List detected agents with metadata (model, tools, enabled)')
    .option('--home <dir>', 'Override the home directory')
    .option('--projects', 'Include discovered project roots', false)
    .option('--json', 'Output JSON', false)
    .action(async (opts) => {
      try {
        const scan = await scanEnvironment({
          ...(opts.home ? { home: opts.home } : {}),
          discoverProjects: Boolean(opts.projects),
          computeTokens: false,
        });
        const agentFiles = filterArtifacts(scan.artifacts, { kinds: ['agent'] }).filter((a) =>
          /\.mdx?$/i.test(a.name),
        );

        const agents: AgentMetadata[] = [];
        for (const file of agentFiles) {
          try {
            agents.push(await analyzeAgentFile(file.path, file.scope));
          } catch {
            // skip unreadable agent
          }
        }

        if (opts.json) return printJson(agents);
        if (agents.length === 0) {
          ui.info('No agents found (looking for agents/*.md).');
          return;
        }
        ui.heading(`Agents (${agents.length})`);
        for (const a of agents) {
          const state = a.enabled ? '' : ui.dim(' [disabled]');
          ui.item(`${a.name}${a.model ? ui.dim(` · ${a.model}`) : ''} · ${ui.num(a.tokens)} tok${state}`);
          if (a.description) ui.kv('  description', a.description);
          if (a.tools?.length) ui.kv('  tools', a.tools.join(', '));
          ui.kv('  scope', a.scope);
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}
