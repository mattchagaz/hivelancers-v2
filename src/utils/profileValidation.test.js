import { describe, expect, it } from 'vitest';
import {
  buildCustomizeProfileErrors,
  normalizeExternalUrl,
  validateOptionalUrl,
  validateUsername,
} from './profileValidation';

describe('profileValidation', () => {
  it('normaliza links externos sem protocolo', () => {
    expect(normalizeExternalUrl('example.com/profile')).toBe('https://example.com/profile');
    expect(normalizeExternalUrl('https://example.com')).toBe('https://example.com');
  });

  it('valida username e links', () => {
    expect(validateUsername('ab')).toBeTruthy();
    expect(validateUsername('Nome Invalido')).toBeTruthy();
    expect(validateUsername('matt.dev')).toBe('');
    expect(validateOptionalUrl('not-a-host', 'Website')).toBeTruthy();
    expect(validateOptionalUrl('hivelancers.com', 'Website')).toBe('');
  });

  it('exige titulo quando um projeto possui conteudo', () => {
    const result = buildCustomizeProfileErrors({
      profile: { firstName: 'Matt', lastName: 'Silva', username: 'matt.dev', website: '' },
      socialLinks: {},
      projects: [{ id: 'project-1', title: '', description: 'Projeto real' }],
    });

    expect(result.hasErrors).toBe(true);
    expect(result.projects['project-1'].title).toBeTruthy();
  });
});
