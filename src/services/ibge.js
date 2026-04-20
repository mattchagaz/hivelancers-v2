const CACHE_KEY = 'ibge_municipios_v1';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const ENDPOINT = 'https://servicodosdados.ibge.gov.br/api/v1/localidades/municipios';

let memoryCache = null;
let inFlight = null;

const normalize = (str) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.savedAt || Date.now() - parsed.savedAt > CACHE_TTL) return null;
    return parsed.items;
  } catch {
    return null;
  }
};

const writeCache = (items) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), items }));
  } catch {
    /* quota or privacy mode — safe to ignore, memoryCache still works */
  }
};

const fetchFromIbge = async () => {
  const res = await fetch(ENDPOINT);
  if (!res.ok) throw new Error('IBGE indisponível');
  const data = await res.json();
  return data.map((m) => {
    const name = m.nome;
    const uf = m.microrregiao?.mesorregiao?.UF?.sigla || '';
    const label = uf ? `${name} - ${uf}` : name;
    return { label, search: normalize(label) };
  });
};

export const loadCities = async () => {
  if (memoryCache) return memoryCache;
  const cached = readCache();
  if (cached) {
    memoryCache = cached;
    return cached;
  }
  if (inFlight) return inFlight;
  inFlight = fetchFromIbge()
    .then((items) => {
      memoryCache = items;
      writeCache(items);
      inFlight = null;
      return items;
    })
    .catch((err) => {
      inFlight = null;
      throw err;
    });
  return inFlight;
};

export const searchCities = (cities, query, limit = 8) => {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  const startsWith = [];
  const contains = [];
  for (const c of cities) {
    if (c.search.startsWith(q)) startsWith.push(c);
    else if (c.search.includes(q)) contains.push(c);
    if (startsWith.length >= limit) break;
  }
  return [...startsWith, ...contains].slice(0, limit);
};
