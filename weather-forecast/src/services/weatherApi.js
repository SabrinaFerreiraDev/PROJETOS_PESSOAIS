const OPEN_WEATHER_KEY = import.meta.env.VITE_API_KEY;

const OPEN_WEATHER_BASE_URL = "https://api.openweathermap.org";
const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL = 1000 * 60 * 10;

const requestCache = new Map();

function buildUrl(path, params) {
  const url = new URL(path, OPEN_WEATHER_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function getCached(cacheKey) {
  const cached = requestCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.createdAt > CACHE_TTL) {
    requestCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function setCached(cacheKey, data) {
  requestCache.set(cacheKey, {
    createdAt: Date.now(),
    data,
  });
}

async function fetchJson(url, fallbackMessage, options = {}) {
  if (!OPEN_WEATHER_KEY && url.includes("openweathermap.org")) {
    throw new Error("Configure a chave VITE_API_KEY para consultar o clima.");
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Chave da API inválida ou sem permissão.");
    }

    if (response.status === 404) {
      throw new Error("Cidade não encontrada. Confira o nome e tente novamente.");
    }

    throw new Error(fallbackMessage);
  }

  return response.json();
}

function normalizeCity(city) {
  return {
    id: `${city.lat}-${city.lon}-${city.name}`,
    name: city.local_names?.pt || city.name,
    originalName: city.name,
    state: city.state || "",
    country: city.country || "",
    lat: city.lat,
    lon: city.lon,
    label: [city.local_names?.pt || city.name, city.state, city.country]
      .filter(Boolean)
      .join(", "),
  };
}

function findNearestHourlyValue(hourlyData, key) {
  if (!hourlyData?.time?.length || !hourlyData?.[key]?.length) {
    return null;
  }

  const now = Date.now();
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  hourlyData.time.forEach((time, index) => {
    const distance = Math.abs(new Date(time).getTime() - now);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return hourlyData[key][nearestIndex] ?? null;
}

function getTimezoneDate(timestamp, timezoneOffset) {
  return new Date((timestamp + timezoneOffset) * 1000);
}

function getForecastChance(forecast) {
  const nextItem = forecast?.list?.find((item) => typeof item.pop === "number");
  return nextItem ? Math.round(nextItem.pop * 100) : null;
}

function getCurrentUv(meteoData) {
  return findNearestHourlyValue(meteoData?.hourly, "uv_index");
}

export async function searchCities(query, signal) {
  const term = query.trim();

  if (term.length < 2) {
    return [];
  }

  const cacheKey = `cities:${term.toLowerCase()}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return cached;
  }

  const url = buildUrl("/geo/1.0/direct", {
    q: term,
    limit: 6,
    appid: OPEN_WEATHER_KEY,
  });

  const data = await fetchJson(
    url,
    "Não foi possível carregar sugestões agora.",
    { signal },
  );
  const cities = data.map(normalizeCity);

  setCached(cacheKey, cities);
  return cities;
}

export async function getWeatherByCity(cityQuery) {
  const term = cityQuery.trim();

  if (!term) {
    throw new Error("Digite uma cidade para pesquisar.");
  }

  const cacheKey = `weather:${term.toLowerCase()}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return cached;
  }

  const [city] = await searchCities(term);

  if (!city) {
    throw new Error("Cidade não encontrada. Confira o nome e tente novamente.");
  }

  const weatherUrl = buildUrl("/data/2.5/weather", {
    lat: city.lat,
    lon: city.lon,
    appid: OPEN_WEATHER_KEY,
    lang: "pt_br",
    units: "metric",
  });

  const forecastUrl = buildUrl("/data/2.5/forecast", {
    lat: city.lat,
    lon: city.lon,
    appid: OPEN_WEATHER_KEY,
    lang: "pt_br",
    units: "metric",
  });

  const meteoUrl = new URL(OPEN_METEO_BASE_URL);
  meteoUrl.searchParams.set("latitude", city.lat);
  meteoUrl.searchParams.set("longitude", city.lon);
  meteoUrl.searchParams.set("hourly", "uv_index");
  meteoUrl.searchParams.set("timezone", "auto");
  meteoUrl.searchParams.set("forecast_days", "1");

  const [weather, forecast, meteo] = await Promise.all([
    fetchJson(weatherUrl, "Não foi possível buscar o clima."),
    fetchJson(forecastUrl, "Não foi possível buscar a previsão."),
    fetch(meteoUrl.toString())
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null),
  ]);

  const timezoneOffset = weather.timezone ?? 0;
  const mainWeather = weather.weather?.[0] ?? {};

  const normalizedWeather = {
    id: weather.id,
    city: weather.name || city.name,
    country: weather.sys?.country || city.country,
    coordinates: {
      lat: weather.coord?.lat ?? city.lat,
      lon: weather.coord?.lon ?? city.lon,
    },
    condition: mainWeather.main || "Clear",
    description: mainWeather.description || "tempo estável",
    icon: mainWeather.icon || "01d",
    isNight: mainWeather.icon?.endsWith("n") ?? false,
    updatedAt: getTimezoneDate(weather.dt, timezoneOffset),
    metrics: {
      temperature: Math.round(weather.main?.temp ?? 0),
      feelsLike: Math.round(weather.main?.feels_like ?? 0),
      humidity: weather.main?.humidity ?? null,
      wind: weather.wind?.speed ? Math.round(weather.wind.speed * 3.6) : null,
      pressure: weather.main?.pressure ?? null,
      visibility: weather.visibility
        ? Number((weather.visibility / 1000).toFixed(1))
        : null,
      sunrise: weather.sys?.sunrise
        ? getTimezoneDate(weather.sys.sunrise, timezoneOffset)
        : null,
      sunset: weather.sys?.sunset
        ? getTimezoneDate(weather.sys.sunset, timezoneOffset)
        : null,
      rainChance: getForecastChance(forecast),
      uvIndex: getCurrentUv(meteo),
    },
  };

  setCached(cacheKey, normalizedWeather);
  return normalizedWeather;
}
