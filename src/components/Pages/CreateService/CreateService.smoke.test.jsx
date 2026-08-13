import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Smoke test: garante que a estimativa de "você recebe" aparece na tela de
// publicar serviço assim que o freelancer digita um preço, usando a taxa
// vinda de /payments/me/freelancer-fee-rate.

vi.mock('../../../services/services', () => ({
  listCategories: vi.fn(() => Promise.resolve([
    { id: 'cat-1', name: 'Design', subcategories: [] },
  ])),
  createService: vi.fn(),
  getMyService: vi.fn(),
  updateService: vi.fn(),
  archiveService: vi.fn(),
  deleteService: vi.fn(),
}));

vi.mock('../../../services/cloudinary', () => ({
  uploadImageToCloudinary: vi.fn(),
}));

vi.mock('../../../services/payments', () => ({
  getMyPixPayoutAccount: vi.fn(() => Promise.resolve({
    configured: true,
    connected: true,
    account: { keyType: 'EMAIL', maskedKey: '••••••1234' },
  })),
  getMyFreelancerFeeRate: vi.fn(() => Promise.resolve({ planId: 'essential', feePercent: 10 })),
}));

import CreateService from './CreateService';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/services/new']}>
      <CreateService />
    </MemoryRouter>
  );

describe('CreateService (smoke)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mostra o valor liquido estimado apos digitar o preco do plano', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Crio logos profissionais/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Crio logos profissionais/), {
      target: { value: 'Serviço de teste com título válido' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Descreva detalhadamente/), {
      target: { value: 'Descrição de teste com mais de trinta caracteres para passar na validação.' },
    });
    fireEvent.click(screen.getByText('Design'));

    fireEvent.click(screen.getByText('Continuar'));

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('0,00').length).toBeGreaterThan(0);
    });

    const priceInput = screen.getAllByPlaceholderText('0,00')[0];
    fireEvent.change(priceInput, { target: { value: '100' } });

    await waitFor(() => {
      expect(screen.getByText(/Você recebe aproximadamente/)).toBeInTheDocument();
      expect(screen.getByText(/R\$\s?90,00/)).toBeInTheDocument();
      expect(screen.getByText(/taxa da plataforma: 10%/)).toBeInTheDocument();
    });
  });
});
