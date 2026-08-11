const REVERSE_GEOCODE_ENDPOINT = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

const roundCoordinate = (value) => Math.round(value * 1000) / 1000;

const stateFromResponse = (data) => {
  const subdivisionCode = data.principalSubdivisionCode?.split('-').pop()?.trim();
  if (data.countryCode?.toUpperCase() === 'BR' && subdivisionCode?.length === 2) {
    return subdivisionCode.toUpperCase();
  }
  return data.principalSubdivision?.trim() || subdivisionCode || '';
};

export const presentReverseGeocode = (data, coordinates) => {
  const city = data.city?.trim() || data.locality?.trim() || '';
  const state = stateFromResponse(data);
  const countryCode = data.countryCode?.trim().toUpperCase() || '';

  if (!city) {
    throw new Error('Não conseguimos identificar a cidade desta localização.');
  }

  return {
    city,
    state,
    countryCode,
    latitude: roundCoordinate(coordinates.latitude),
    longitude: roundCoordinate(coordinates.longitude),
    label: state ? `${city} - ${state}` : city,
  };
};

export const reverseGeocodeCurrentPosition = async ({ latitude, longitude }) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: 'pt',
  });
  const response = await fetch(`${REVERSE_GEOCODE_ENDPOINT}?${params}`);
  if (!response.ok) {
    throw new Error('Não foi possível consultar sua cidade agora.');
  }
  return presentReverseGeocode(await response.json(), { latitude, longitude });
};

export const getBrowserPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Seu navegador não oferece localização automática.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        reject(new Error('Permita o acesso à localização no navegador para continuar.'));
        return;
      }
      if (error.code === error.TIMEOUT) {
        reject(new Error('A localização demorou demais. Tente novamente.'));
        return;
      }
      reject(new Error('Não foi possível detectar sua localização.'));
    },
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
  );
});

export const detectCurrentCity = async () => {
  const coordinates = await getBrowserPosition();
  return reverseGeocodeCurrentPosition(coordinates);
};
