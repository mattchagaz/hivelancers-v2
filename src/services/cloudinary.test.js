import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
}));

vi.mock('./api', () => ({
  api: { post: mocks.apiPost },
}));

import { uploadImageToCloudinary } from './cloudinary';

const imageFile = (size = 3) => new File([new Uint8Array(size)], 'avatar.jpg', {
  type: 'image/jpeg',
});

describe('moderated image upload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('envia a imagem autenticada ao backend em vez do Cloudinary publico', async () => {
    const image = {
      url: 'https://res.cloudinary.com/official/image/upload/avatar.jpg',
      publicId: 'avatar',
      resourceType: 'image',
    };
    mocks.apiPost.mockResolvedValue({ data: { image } });

    await expect(uploadImageToCloudinary(imageFile())).resolves.toEqual(image);
    expect(mocks.apiPost).toHaveBeenCalledWith('/uploads/images', expect.any(FormData));
    expect(mocks.apiPost.mock.calls[0][1].get('file')).toBeInstanceOf(File);
  });

  it('bloqueia formatos e tamanhos que nao podem ser moderados', async () => {
    const gif = new File(['gif'], 'animated.gif', { type: 'image/gif' });
    await expect(uploadImageToCloudinary(gif)).rejects.toThrow('JPEG, PNG ou WebP');
    await expect(uploadImageToCloudinary(imageFile(4 * 1024 * 1024 + 1)))
      .rejects.toThrow('máximo 4 MB');
    expect(mocks.apiPost).not.toHaveBeenCalled();
  });

  it('mostra a mensagem segura devolvida pelo backend', async () => {
    mocks.apiPost.mockRejectedValue({
      response: { data: { message: 'A imagem foi recusada por conter conteúdo impróprio.' } },
    });

    await expect(uploadImageToCloudinary(imageFile()))
      .rejects.toThrow('A imagem foi recusada por conter conteúdo impróprio.');
  });
});

