import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import AdminModal from './AdminModal';
import AdminPagination from './AdminPagination';

describe('componentes de interface do admin', () => {
  afterEach(() => {
    cleanup();
  });

  it('fecha o editor modal com Escape', () => {
    const onClose = vi.fn();

    render(
      <AdminModal open onClose={onClose} title="Editar serviço">
        <input aria-label="Título" />
      </AdminModal>
    );

    expect(screen.getByRole('dialog', { name: 'Editar serviço' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('navega entre páginas e mantém os limites desabilitados', () => {
    const onPageChange = vi.fn();

    render(
      <AdminPagination
        currentPage={2}
        totalPages={5}
        totalItems={42}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });
});
