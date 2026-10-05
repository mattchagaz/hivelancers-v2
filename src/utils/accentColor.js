export const DEFAULT_CUSTOM_ACCENT = '#6366f1';

// A escala de luminosidade usada pelo seletor vai de 0 a 240.
export const CUSTOM_ACCENT_LIGHTNESS_SCALE = 240;
export const CUSTOM_ACCENT_MAX_LIGHTNESS = 200;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) return [0, 0, lightness];

  const delta = max - min;
  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);
  let hue;

  if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  return [hue / 6, saturation, lightness];
}

function hueToRgb(p, q, hue) {
  let value = hue;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
}

function hslToRgb(hue, saturation, lightness) {
  if (saturation === 0) {
    const channel = Math.round(lightness * 255);
    return [channel, channel, channel];
  }

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return [
    Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, hue) * 255),
    Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  ];
}

function rgbToHex(rgb) {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

export function limitCustomAccentLightness(hex) {
  const normalizedHex = typeof hex === 'string' ? hex.toLowerCase() : '';
  if (!HEX_COLOR_PATTERN.test(normalizedHex)) return DEFAULT_CUSTOM_ACCENT;

  const rgb = normalizedHex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => parseInt(channel, 16));
  const [hue, saturation, lightness] = rgbToHsl(...rgb);
  const maxLightness = CUSTOM_ACCENT_MAX_LIGHTNESS / CUSTOM_ACCENT_LIGHTNESS_SCALE;

  if (lightness <= maxLightness) return normalizedHex;
  return rgbToHex(hslToRgb(hue, saturation, maxLightness));
}
