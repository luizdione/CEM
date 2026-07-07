import type { CreateProfileInput } from './manager.js';

/**
 * Example profile templates the user can instantiate. Each profile activates a
 * subset of configuration and documentation for a given workflow.
 */
export const PROFILE_TEMPLATES: readonly CreateProfileInput[] = [
  {
    name: 'Development',
    description: 'General software development artifacts.',
    include: { kinds: ['skill', 'agent', 'command', 'memory', 'setting'] },
    tags: ['dev'],
  },
  {
    name: 'Research',
    description: 'Research prompts, notes and reference material.',
    include: { kinds: ['markdown', 'prompt', 'memory'], paths: ['research'] },
    tags: ['research'],
  },
  {
    name: 'Bioinformatics',
    description: 'Bioinformatics pipelines and domain notes.',
    include: { paths: ['bioinformatics', 'bio', 'genom'] },
    tags: ['science'],
  },
  {
    name: 'Python',
    description: 'Python-focused skills, agents and memory.',
    include: { paths: ['python', 'py'] },
    tags: ['language'],
  },
  {
    name: 'Next.js',
    description: 'Next.js / React web development.',
    include: { paths: ['next', 'react', 'web'] },
    tags: ['web'],
  },
  {
    name: 'React',
    description: 'React component work.',
    include: { paths: ['react', 'component'] },
    tags: ['web'],
  },
  {
    name: 'Docker',
    description: 'Container and infrastructure workflows.',
    include: { paths: ['docker', 'compose', 'k8s', 'infra'] },
    tags: ['infra'],
  },
  {
    name: 'Farm',
    description: 'Agriculture / farm management (Fazenda).',
    include: { paths: ['fazenda', 'farm', 'agro'] },
    tags: ['domain'],
  },
  {
    name: 'Company',
    description: 'Company-wide standards and processes (Empresa).',
    include: { scopes: ['user'], paths: ['company', 'empresa', 'org'] },
    tags: ['org'],
  },
];

/** Look up a template by (case-insensitive) name. */
export function findTemplate(name: string): CreateProfileInput | undefined {
  return PROFILE_TEMPLATES.find((t) => t.name.toLowerCase() === name.toLowerCase());
}
