const RECENT_CITIES_KEY = "weather-app:recent-cities";
const MAX_RECENT_CITIES = 6;

export function getRecentCities() {
  try {
    const storedValue = localStorage.getItem(RECENT_CITIES_KEY);
    return storedValue ? JSON.parse(storedValue) : [];
  } catch {
    return [];
  }
}

export function saveRecentCity(city) {
  const cityName = city?.trim();

  if (!cityName) {
    return [];
  }

  const currentCities = getRecentCities();
  const nextCities = [
    cityName,
    ...currentCities.filter(
      (recentCity) => recentCity.toLowerCase() !== cityName.toLowerCase(),
    ),
  ].slice(0, MAX_RECENT_CITIES);

  localStorage.setItem(RECENT_CITIES_KEY, JSON.stringify(nextCities));
  return nextCities;
}
