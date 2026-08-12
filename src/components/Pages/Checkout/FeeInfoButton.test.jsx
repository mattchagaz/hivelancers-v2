import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import FeeInfoButton from './FeeInfoButton';

describe('FeeInfoButton', () => {
  afterEach(cleanup);

  it('explica de forma acessível a finalidade da taxa de serviço', () => {
    render(<FeeInfoButton />);

    const button = screen.getByRole('button', {
      name: 'Saiba por que cobramos a taxa de serviço',
    });
    const tooltip = screen.getByRole('tooltip');

    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveTextContent(/manter a plataforma ativa/i);
    expect(tooltip).toHaveTextContent(/pagamentos protegidos/i);
  });
});
