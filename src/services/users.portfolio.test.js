import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiDelete: vi.fn(),
}));

vi.mock('./api', () => ({
  api: {
    delete: mocks.apiDelete,
  },
}));

import { removeMyPortfolioProjectImage } from './users';

describe('removeMyPortfolioProjectImage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('remove a imagem usando os identificadores protegidos na URL', async () => {
    const customization = { portfolioProjects: [] };
    mocks.apiDelete.mockResolvedValue({ data: customization });

    await expect(removeMyPortfolioProjectImage('project/1', 'image/1')).resolves.toBe(customization);
    expect(mocks.apiDelete).toHaveBeenCalledWith(
      '/users/me/profile-customization/projects/project%2F1/images/image%2F1'
    );
  });

  it('preserva o status da API para permitir compatibilidade com backends antigos', async () => {
    mocks.apiDelete.mockRejectedValue({
      response: { status: 404, data: { code: 'NOT_FOUND' } },
    });

    await expect(removeMyPortfolioProjectImage('project-1', 'image-1')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });
});
