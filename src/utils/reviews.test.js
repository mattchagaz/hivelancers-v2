import { describe, expect, it } from 'vitest';
import { getReviewAuthor } from './reviews';

describe('getReviewAuthor', () => {
  it('preserva a foto de perfil enviada no autor da avaliacao', () => {
    expect(getReviewAuthor({
      client: {
        avatarUrl: 'https://res.cloudinary.com/example/avatar.jpg',
        firstName: 'Matheus',
        lastName: 'Chagas',
      },
    })).toEqual({
      avatarUrl: 'https://res.cloudinary.com/example/avatar.jpg',
      initials: 'MC',
      name: 'Matheus Chagas',
    });
  });

  it('usa as iniciais quando o autor nao possui foto', () => {
    expect(getReviewAuthor({
      client: {
        firstName: 'Ana',
        lastName: 'Silva',
      },
    })).toEqual({
      avatarUrl: null,
      initials: 'AS',
      name: 'Ana Silva',
    });
  });
});
