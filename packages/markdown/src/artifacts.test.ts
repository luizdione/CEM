import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  fmList,
  analyzeSkillContent,
  analyzeAgentContent,
} from './index.js';

describe('parseFrontmatter', () => {
  it('parses scalars, inline lists and block lists', () => {
    const { data, body } = parseFrontmatter(
      [
        '---',
        'name: my-skill',
        'version: 1.2.0',
        'priority: 3',
        'enabled: false',
        'tags: [a, b, c]',
        'tools:',
        '  - Read',
        '  - Edit',
        '---',
        'Body starts here',
      ].join('\n'),
    );
    expect(data.name).toBe('my-skill');
    expect(data.version).toBe('1.2.0'); // multi-part versions stay strings
    expect(data.priority).toBe(3); // plain numbers are coerced
    expect(data.enabled).toBe(false);
    expect(data.tags).toEqual(['a', 'b', 'c']);
    expect(fmList(data, 'tools')).toEqual(['Read', 'Edit']);
    expect(body.trim()).toBe('Body starts here');
  });

  it('returns empty data when there is no front-matter', () => {
    const { data, body } = parseFrontmatter('# Just markdown\n');
    expect(data).toEqual({});
    expect(body).toContain('Just markdown');
  });
});

describe('analyzeSkillContent', () => {
  it('extracts skill metadata', () => {
    const content = [
      '---',
      'name: git-helper',
      'description: Clean commits',
      'author: sample',
      'version: 1.0.0',
      'dependencies: [ripgrep]',
      '---',
      'Do the thing.',
    ].join('\n');
    const skill = analyzeSkillContent(content, '/skills/git-helper/SKILL.md', [
      '/skills/git-helper/SKILL.md',
    ], 'user');
    expect(skill.name).toBe('git-helper');
    expect(skill.description).toBe('Clean commits');
    expect(skill.author).toBe('sample');
    expect(skill.version).toBe('1.0.0');
    expect(skill.dependencies).toEqual(['ripgrep']);
    expect(skill.tokens).toBeGreaterThan(0);
  });

  it('falls back to the directory name', () => {
    const skill = analyzeSkillContent('no frontmatter', '/skills/fallback/SKILL.md');
    expect(skill.name).toBe('fallback');
    expect(skill.files).toEqual(['/skills/fallback/SKILL.md']);
  });
});

describe('analyzeAgentContent', () => {
  it('extracts agent metadata and enabled state', () => {
    const content = [
      '---',
      'name: reviewer',
      'model: claude-sonnet-5',
      'tools:',
      '  - Read',
      '  - Grep',
      '---',
      'You review code.',
    ].join('\n');
    const agent = analyzeAgentContent(content, '/agents/reviewer.md', 'project');
    expect(agent.name).toBe('reviewer');
    expect(agent.model).toBe('claude-sonnet-5');
    expect(agent.tools).toEqual(['Read', 'Grep']);
    expect(agent.enabled).toBe(true);
  });

  it('treats disabled: true as not enabled', () => {
    const agent = analyzeAgentContent('---\nname: x\ndisabled: true\n---\n', '/agents/x.md');
    expect(agent.enabled).toBe(false);
  });
});
