export const WEATHER_THEME = {
  Clear: "clear",
  Clouds: "clouds",
  Rain: "rain",
  Drizzle: "rain",
  Thunderstorm: "storm",
  Snow: "snow",
  Mist: "mist",
  Smoke: "mist",
  Haze: "mist",
  Dust: "mist",
  Fog: "mist",
  Sand: "mist",
  Ash: "mist",
  Squall: "storm",
  Tornado: "storm",
};

export function getWeatherTheme(weather) {
  if (!weather) {
    return "default";
  }

  if (weather.isNight) {
    return "night";
  }

  return WEATHER_THEME[weather.condition] || "default";
}

export function formatTime(date) {
  if (!date) {
    return "N/D";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatUpdatedAt(date) {
  if (!date) {
    return "Atualizado agora";
  }

  return `Atualizado às ${formatTime(date)}`;
}

export function formatMetric(value, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/D";
  }

  return `${value}${suffix}`;
}

export function getComfortMessage(weather) {
  if (!weather) {
    return "Pesquise uma cidade para ver uma análise climática completa.";
  }

  const { temperature, rainChance, uvIndex, wind } = weather.metrics;

  if (rainChance >= 60) {
    return "Leve guarda-chuva e prefira deslocamentos com margem de tempo.";
  }

  if (uvIndex >= 7) {
    return "Índice UV alto: protetor solar e sombra fazem diferença.";
  }

  if (temperature <= 12) {
    return "Clima frio: uma camada extra deixa a saída mais confortável.";
  }

  if (temperature >= 30) {
    return "Calor forte: hidrate-se e escolha roupas leves.";
  }

  if (wind >= 35) {
    return "Vento intenso: cuidado com objetos soltos ao ar livre.";
  }

  return "Condições equilibradas para planejar o dia com tranquilidade.";
}

export function getWeatherIcon(condition, isNight) {
  if (isNight) {
    return "moon";
  }

  const iconMap = {
    Clear: "sun",
    Clouds: "cloud",
    Rain: "rain",
    Drizzle: "rain",
    Thunderstorm: "storm",
    Snow: "snow",
    Mist: "mist",
    Fog: "mist",
    Haze: "mist",
  };

  return iconMap[condition] || "sun";
}
