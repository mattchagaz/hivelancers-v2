import { describe, expect, it } from 'vitest';
import { IBGE_CITIES_ENDPOINT, searchCities } from './ibge';

const cities = [
  { id: '1', city: 'São Paulo', state: 'SP', label: 'São Paulo - SP', search: 'sao paulo sp' },
  { id: '2', city: 'São Leopoldo', state: 'RS', label: 'São Leopoldo - RS', search: 'sao leopoldo rs' },
  { id: '3', city: 'Rio Claro', state: 'SP', label: 'Rio Claro - SP', search: 'rio claro sp' },
];

describe('searchCities', () => {
  it('usa o domínio oficial correto do serviço de localidades do IBGE', () => {
    expect(IBGE_CITIES_ENDPOINT).toBe('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
  });

  it('pesquisa sem diferenciar acentos e prioriza o começo do nome', () => {
    expect(searchCities(cities, 'sao')).toEqual([cities[0], cities[1]]);
  });

  it('não abre sugestões com menos de dois caracteres', () => {
    expect(searchCities(cities, 's')).toEqual([]);
  });
});
