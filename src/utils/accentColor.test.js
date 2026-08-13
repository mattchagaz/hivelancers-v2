import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CUSTOM_ACCENT,
  limitCustomAccentLightness,
} from './accentColor';

describe('limitCustomAccentLightness', () => {
  it('mantem cores dentro do limite de luminosidade', () => {
    expect(limitCustomAccentLightness('#3b82f6')).toBe('#3b82f6');
    expect(limitCustomAccentLightness('#FF0000')).toBe('#ff0000');
  });

  it('limita a luminosidade de branco e cores muito claras a 200 de 240', () => {
    expect(limitCustomAccentLightness('#ffffff')).toBe('#d5d5d5');
    expect(limitCustomAccentLightness('#f0f0f0')).toBe('#d5d5d5');
    expect(limitCustomAccentLightness('#ffcccc')).toBe('#ffaaaa');
  });

  it('usa a cor padrao quando recebe um valor invalido', () => {
    expect(limitCustomAccentLightness('white')).toBe(DEFAULT_CUSTOM_ACCENT);
  });
});
