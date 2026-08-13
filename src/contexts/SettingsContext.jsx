import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './authContextStore';
import { updateMySettings } from '../services/users';

const STORAGE_KEY = 'hivelancers:settings';
const PREFERENCE_SYNC_DELAY = 600;

const DEFAULT_SETTINGS = {
  notifications: {
    orderUpdates: true,
    messages: true,
    reviews: true,
    supportUpdates: true,
    securityUpdates: true,
    pushMessages: false,
    pushOrders: false,
    pushPayments: false,
    pushSupport: false,
  },
  appearance: {
    theme: 'light',
    accent: 'blue',
    customAccent: '#6366f1',
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

function hexToRgb(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!match) return null;
  return [match[1], match[2], match[3]].map((h) => parseInt(h, 16)).join(', ');
}

function lightenRgb(rgb, amount = 0.35) {
  return rgb
    .split(',')
    .map((n) => Math.round(Number(n) + (255 - Number(n)) * amount))
    .join(', ');
}

// Campos de privacidade persistem como colunas próprias do usuário no backend
// (não fazem parte do blob `preferences`), por isso ficam fora do merge de preferências.
const PRIVACY_FIELDS = ['profilePublic', 'showOnline', 'showEarnings'];

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored);
    return {
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications || {}) },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...(parsed.appearance || {}) },
      privacy: { ...DEFAULT_SETTINGS.privacy, ...(parsed.privacy || {}) },
      language: { ...DEFAULT_SETTINGS.language, ...(parsed.language || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const mergeUserIntoSettings = (prev, user) => ({
  ...prev,
  privacy: {
    ...prev.privacy,
    profilePublic: user.profilePublic ?? prev.privacy.profilePublic,
    showOnline: user.showOnline ?? prev.privacy.showOnline,
    showEarnings: user.showEarnings ?? prev.privacy.showEarnings,
  },
  ...(user.preferences && typeof user.preferences === 'object'
    ? {
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(user.preferences.notifications || {}) },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...(user.preferences.appearance || {}) },
      language: { ...DEFAULT_SETTINGS.language, ...(user.preferences.language || {}) },
    }
    : {}),
});

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { user, isAuthenticated, setUser } = useAuth();
  const [settings, setSettings] = useState(loadSettings);
  const initialSettings = useRef(settings);
  const toastTimer = useRef(null);
  const preferencesSyncTimer = useRef(null);
  const syncedUserIdRef = useRef(null);
  const shouldNotifySaveRef = useRef(false);

  // Sempre mantém uma cópia local — funciona como cache instantâneo (evita
  // flash de tema) e como fallback completo para visitantes não autenticados.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (settings === initialSettings.current) return;
    if (!shouldNotifySaveRef.current) return;
    shouldNotifySaveRef.current = false;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      toast.success('Preferências salvas.', { id: 'settings-saved', duration: 1500 });
    }, 400);
  }, [settings]);

  // Ao autenticar, o backend passa a ser a fonte de verdade: privacidade vem
  // sempre do usuário; notificações/aparência/idioma vêm de `user.preferences`
  // quando existirem (sobrescrevendo o cache local do navegador).
  useEffect(() => {
    if (!isAuthenticated || !user) {
      syncedUserIdRef.current = null;
      return;
    }
    if (syncedUserIdRef.current === user.id) return;
    syncedUserIdRef.current = user.id;
    setSettings((prev) => mergeUserIntoSettings(prev, user));
  }, [isAuthenticated, user]);

  useEffect(() => {
    const theme = settings.appearance.theme;
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
    const customRgb = settings.appearance.accent === 'custom'
      ? hexToRgb(settings.appearance.customAccent)
      : null;
    const palette = customRgb
      ? { primary: customRgb, secondary: lightenRgb(customRgb) }
      : (ACCENT_COLORS[settings.appearance.accent] || ACCENT_COLORS.blue);
    const root = document.documentElement;
    root.style.setProperty('--primary-color', `rgb(${palette.primary})`);
    root.style.setProperty('--primary-color-rgb', palette.primary);
    root.style.setProperty('--secondary-color', `rgb(${palette.secondary})`);
    root.style.setProperty('--secondary-color-rgb', palette.secondary);
  }, [settings.appearance.accent, settings.appearance.customAccent]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.appearance.reducedMotion) {
      root.setAttribute('data-reduced-motion', 'true');
    } else {
      root.removeAttribute('data-reduced-motion');
    }
  }, [settings.appearance.reducedMotion]);

  // Notificações/aparência/idioma: persistidas com debounce no blob `preferences`.
  const schedulePreferencesSync = useCallback((nextSettings) => {
    if (!isAuthenticated) return;
    if (preferencesSyncTimer.current) clearTimeout(preferencesSyncTimer.current);
    preferencesSyncTimer.current = setTimeout(() => {
      updateMySettings({
        preferences: {
          notifications: nextSettings.notifications,
          appearance: nextSettings.appearance,
          language: nextSettings.language,
        },
      }).catch(() => {
        // Falha silenciosa: o valor já está salvo localmente e será reenviado na próxima alteração.
      });
    }, PREFERENCE_SYNC_DELAY);
  }, [isAuthenticated]);

  // Privacidade: colunas próprias do usuário, sem debounce (reflete no perfil público na hora)
  // e com rollback caso a chamada falhe.
  const syncPrivacyField = useCallback(async (field, value, previousValue) => {
    if (!isAuthenticated) return;
    try {
      const updatedUser = await updateMySettings({ [field]: value });
      setUser(updatedUser);
    } catch (error) {
      toast.error(error.message || 'Não foi possível salvar a preferência de privacidade.');
      setSettings((prev) => ({ ...prev, privacy: { ...prev.privacy, [field]: previousValue } }));
    }
  }, [isAuthenticated, setUser]);

  const updateField = useCallback((section, field, value) => {
    const previousValue = settings[section][field];
    const next = { ...settings, [section]: { ...settings[section], [field]: value } };
    shouldNotifySaveRef.current = true;
    setSettings(next);

    if (section === 'privacy' && PRIVACY_FIELDS.includes(field)) {
      syncPrivacyField(field, value, previousValue);
    } else {
      schedulePreferencesSync(next);
    }
  }, [settings, syncPrivacyField, schedulePreferencesSync]);

  const toggleField = useCallback((section, field) => {
    const previousValue = settings[section][field];
    const value = !previousValue;
    const next = { ...settings, [section]: { ...settings[section], [field]: value } };
    shouldNotifySaveRef.current = true;
    setSettings(next);

    if (section === 'privacy' && PRIVACY_FIELDS.includes(field)) {
      syncPrivacyField(field, value, previousValue);
    } else {
      schedulePreferencesSync(next);
    }
  }, [settings, syncPrivacyField, schedulePreferencesSync]);

  const updateSection = useCallback((section, updates) => {
    const next = { ...settings, [section]: { ...settings[section], ...updates } };
    shouldNotifySaveRef.current = true;
    setSettings(next);

    if (section === 'privacy') {
      Object.entries(updates)
        .filter(([field]) => PRIVACY_FIELDS.includes(field))
        .forEach(([field, value]) => syncPrivacyField(field, value, settings.privacy[field]));
    } else {
      schedulePreferencesSync(next);
    }
  }, [settings, syncPrivacyField, schedulePreferencesSync]);

  const resetSettings = useCallback(() => {
    shouldNotifySaveRef.current = true;
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, updateField, toggleField, updateSection, resetSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
