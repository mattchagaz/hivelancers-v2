import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  detectCurrentCity: vi.fn(),
  loadCities: vi.fn(),
}));

vi.mock('../../services/ibge', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, loadCities: mocks.loadCities };
});

vi.mock('../../services/geolocation', () => ({
  detectCurrentCity: mocks.detectCurrentCity,
}));

import CityAutocomplete from './CityAutocomplete';

const portoAlegre = {
  id: '4314902',
  city: 'Porto Alegre',
  state: 'RS',
  countryCode: 'BR',
  label: 'Porto Alegre - RS',
  search: 'porto alegre rs',
};

describe('CityAutocomplete', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('confirma uma cidade escolhida na lista do IBGE', async () => {
    mocks.loadCities.mockResolvedValue([portoAlegre]);
    const onChange = vi.fn();

    render(<CityAutocomplete value="" onChange={onChange} />);
    await waitFor(() => expect(mocks.loadCities).toHaveBeenCalled());

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'porto' } });
    fireEvent.mouseDown(await screen.findByText('Porto Alegre'));

    expect(onChange).toHaveBeenLastCalledWith('Porto Alegre - RS', {
      city: 'Porto Alegre',
      state: 'RS',
      countryCode: 'BR',
      latitude: null,
      longitude: null,
    });
  });

  it('preenche a cidade somente após a ação explícita de usar a localização', async () => {
    mocks.loadCities.mockResolvedValue([portoAlegre]);
    mocks.detectCurrentCity.mockResolvedValue({
      city: 'Porto Alegre',
      state: 'RS',
      countryCode: 'BR',
      latitude: -30.035,
      longitude: -51.218,
      label: 'Porto Alegre - RS',
    });
    const onChange = vi.fn();

    render(<CityAutocomplete value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Usar minha localização' }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(
      'Porto Alegre - RS',
      expect.objectContaining({ latitude: -30.035, longitude: -51.218 })
    ));
    expect(screen.getByText(/Coordenadas não aparecem no perfil público/)).toBeInTheDocument();
  });

  it('atualiza as sugestões quando o IBGE termina de carregar após a digitação', async () => {
    let resolveCities;
    mocks.loadCities.mockReturnValue(new Promise((resolve) => { resolveCities = resolve; }));

    function Harness() {
      const [value, setValue] = useState('');
      return <CityAutocomplete value={value} onChange={setValue} />;
    }

    render(<Harness />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'porto' } });
    resolveCities([portoAlegre]);

    expect(await screen.findByText('Porto Alegre')).toBeInTheDocument();
  });
});
