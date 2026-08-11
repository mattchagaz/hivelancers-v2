import { describe, expect, it } from 'vitest';
import { presentReverseGeocode } from './geolocation';

describe('presentReverseGeocode', () => {
  it('normaliza cidade, UF e arredonda coordenadas para uma localização aproximada', () => {
    expect(presentReverseGeocode({
      city: 'Porto Alegre',
      principalSubdivision: 'Rio Grande do Sul',
      principalSubdivisionCode: 'BR-RS',
      countryCode: 'br',
    }, {
      latitude: -30.0346471,
      longitude: -51.2176584,
    })).toEqual({
      city: 'Porto Alegre',
      state: 'RS',
      countryCode: 'BR',
      latitude: -30.035,
      longitude: -51.218,
      label: 'Porto Alegre - RS',
    });
  });

  it('recusa respostas que não identificam uma cidade', () => {
    expect(() => presentReverseGeocode({ countryCode: 'BR' }, {
      latitude: -30,
      longitude: -51,
    })).toThrow('Não conseguimos identificar a cidade');
  });
});
