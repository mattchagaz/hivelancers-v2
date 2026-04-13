import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'hivelancers:settings';

const DEFAULT_SETTINGS = {
  profile: {
    name: 'João Silva',
    username: 'joaosilva',
    headline: 'Designer de marcas e identidade visual',
    bio: 'Há 6 anos ajudando marcas a nascerem fortes e consistentes. Foco em branding, logo e sistemas visuais.',
    email: 'joao.silva@email.com',
    phone: '+55 11 98765-4321',
    location: 'São Paulo, SP',
    website: 'https://joaosilva.design',
  },
  notifications: {
    orderUpdates: true,
    messages: true,
    reviews: true,
    marketing: false,
    newsletter: true,
    pushMessages: true,
    pushOrders: true,
    pushPromos: false,
    emailDigest: 'daily',
  },
  appearance: {
    theme: 'light',
    accent: 'blue',
    density: 'comfortable',
    reducedMotion: false,
  },
  privacy: {
    profilePublic: true,
    showOnline: true,
    allowDm: 'everyone',
    searchable: true,
    showEarnings: false,
  },
  language: {
    lang: 'pt-BR',
    region: 'BR',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
  },
};

const ACCENT_COLORS = {
  blue: { primary: '62, 115, 230', secondary: '99, 147, 252' },
  purple: { primary: '124, 58, 237', secondary: '167, 139, 250' },
  green: { primary: '5, 150, 105', secondary: '52, 211, 153' },
  amber: { primary: '217, 119, 6', secondary: '251, 191, 36' },
  pink: { primary: '219, 39, 119', secondary: '244, 114, 182' },
  teal: { primary: '13, 148, 136', secondary: '45, 212, 191' },
};

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored);
    return {
      profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile || {}) },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications || {}) },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...(parsed.appearance || {}) },
      privacy: { ...DEFAULT_SETTINGS.privacy, ...(parsed.privacy || {}) },
      language: { ...DEFAULT_SETTINGS.language, ...(parsed.language || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const { theme } = settings.appearance;
    const root = document.documentElement;

    const apply = (mode) => {
      root.setAttribute('data-theme', mode);
      root.style.colorScheme = mode;
    };

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches ? 'dark' : 'light');
      const listener = (e) => apply(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }

    apply(theme);
  }, [settings.appearance.theme]);

  useEffect(() => {
    const palette = ACCENT_COLORS[settings.appearance.accent] || ACCENT_COLORS.blue;
    const root = document.documentElement;
    root.style.setProperty('--primary-color', `rgb(${palette.primary})`);
    root.style.setProperty('--primary-color-rgb', palette.primary);
    root.style.setProperty('--secondary-color', `rgb(${palette.secondary})`);
    root.style.setProperty('--secondary-color-rgb', palette.secondary);
  }, [settings.appearance.accent]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.appearance.reducedMotion) {
      root.setAttribute('data-reduced-motion', 'true');
    } else {
      root.removeAttribute('data-reduced-motion');
    }
  }, [settings.appearance.reducedMotion]);

  const updateField = useCallback((section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }, []);

  const toggleField = useCallback((section, field) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: !prev[section][field] },
    }));
  }, []);

  const updateSection = useCallback((section, updates) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
  }, []);

  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  return (
    <SettingsContext.Provider
      value={{ settings, updateField, toggleField, updateSection, resetSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
