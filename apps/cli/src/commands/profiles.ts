import type { Command } from 'commander';
import {
  createProfile,
  saveProfile,
  loadProfiles,
  deleteProfile,
  PROFILE_TEMPLATES,
  findTemplate,
} from '@cem/profiles';
import type { ArtifactKind } from '@cem/core';
import { ui, printJson, formatError } from '../ui.js';

export function registerProfiles(program: Command): void {
  const profiles = program.command('profiles').description('Manage activation profiles');

  profiles
    .command('list')
    .description('List saved profiles')
    .option('--json', 'Output JSON', false)
    .action(async (opts: { json?: boolean }) => {
      try {
        const all = await loadProfiles();
        if (opts.json) return printJson(all);
        if (all.length === 0) {
          ui.info('No profiles yet. Create one with "cem profiles create" or "--from-template".');
          return;
        }
        ui.heading('Profiles');
        for (const p of all) {
          ui.item(`${p.name} ${ui.dim(`(${p.id.slice(0, 8)})`)} — ${p.description ?? ''}`);
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });

  profiles
    .command('templates')
    .description('List example profile templates')
    .action(() => {
      ui.heading('Profile templates');
      for (const t of PROFILE_TEMPLATES) {
        ui.item(`${t.name} — ${ui.dim(t.description ?? '')}`);
      }
      console.log();
      ui.info('Create one with: cem profiles create <Name> --from-template <Template>');
    });

  profiles
    .command('create')
    .description('Create and save a new profile')
    .argument('<name>', 'Profile name')
    .option('--from-template <template>', 'Base the profile on a named template')
    .option('--kinds <list>', 'Comma-separated artifact kinds')
    .option('--paths <list>', 'Comma-separated path fragments')
    .option('--description <text>', 'Profile description')
    .action(
      async (
        name: string,
        opts: { fromTemplate?: string; kinds?: string; paths?: string; description?: string },
      ) => {
        try {
          const template = opts.fromTemplate ? findTemplate(opts.fromTemplate) : undefined;
          if (opts.fromTemplate && !template) {
            ui.error(`Template "${opts.fromTemplate}" not found. See "cem profiles templates".`);
            process.exitCode = 1;
            return;
          }
          const kinds = opts.kinds
            ? (opts.kinds.split(',').map((k) => k.trim()) as ArtifactKind[])
            : template?.include.kinds;
          const paths = opts.paths
            ? opts.paths.split(',').map((p) => p.trim())
            : template?.include.paths;

          const profile = createProfile({
            name,
            ...(opts.description ?? template?.description
              ? { description: opts.description ?? template?.description }
              : {}),
            include: {
              ...(kinds ? { kinds } : {}),
              ...(paths ? { paths } : {}),
              ...(template?.include.scopes ? { scopes: template.include.scopes } : {}),
            },
          });
          const file = await saveProfile(profile);
          ui.success(`Created profile "${profile.name}" (${profile.id.slice(0, 8)}).`);
          ui.kv('Saved to', file);
        } catch (error) {
          ui.error(formatError(error));
          process.exitCode = 1;
        }
      },
    );

  profiles
    .command('delete')
    .description('Delete a profile by id')
    .argument('<id>', 'Profile id')
    .action(async (id: string) => {
      try {
        const removed = await deleteProfile(id);
        if (removed) ui.success(`Deleted profile ${id}.`);
        else {
          ui.warn(`No profile with id ${id}.`);
          process.exitCode = 1;
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}
