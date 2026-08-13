import { describe, expect, it } from 'vitest';
import { formatPersonName } from './formatters';

describe('formatPersonName', () => {
  it('capitaliza cada parte do nome sem quebrar letras acentuadas', () => {
    expect(formatPersonName('joão da silva')).toBe('João Da Silva');
    expect(formatPersonName('josé augusto')).toBe('José Augusto');
    expect(formatPersonName('joãO')).toBe('João');
  });

  it('aceita nomes com hífen, apóstrofo e acentos combinados', () => {
    expect(formatPersonName('ana-clara d\'ávila')).toBe("Ana-Clara D'Ávila");
    expect(formatPersonName('jose\u0301')).toBe('José');
  });

  it('remove caracteres que não pertencem a nomes', () => {
    expect(formatPersonName('maria123 @silva')).toBe('Maria Silva');
  });
});
