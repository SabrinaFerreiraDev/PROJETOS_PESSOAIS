import { useCallback, useEffect, useRef, useState } from "react";
import { getWeatherByCity, searchCities } from "../services/weatherApi";
import { getRecentCities, saveRecentCity } from "../utils/storage";
import { useDebouncedValue } from "./useDebouncedValue";

const DEFAULT_CITY = "São Paulo";

export function useWeatherSearch() {
  const [query, setQueryValue] = useState("");
  const [weather, setWeather] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [recentCities, setRecentCities] = useState(() => getRecentCities());
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const debouncedQuery = useDebouncedValue(query);
  const hasLoadedDefaultCity = useRef(false);

  const updateQuery = useCallback((value) => {
    setQueryValue(value);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      setActiveSuggestionIndex(-1);
    }
  }, []);

  const search = useCallback(async (cityName = query) => {
    const normalizedCity = cityName.trim();

    if (!normalizedCity) {
      setStatus("error");
      setMessage("Digite uma cidade para pesquisar.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("Buscando clima...");
      setIsSuggestionsOpen(false);

      const data = await getWeatherByCity(normalizedCity);

      setWeather(data);
      setQueryValue(data.city);
      setRecentCities(saveRecentCity(data.city));
      setStatus("success");
      setMessage("Clima atualizado com sucesso.");
      setActiveSuggestionIndex(-1);
    } catch (error) {
      setWeather(null);
      setStatus("error");
      setMessage(error.message || "Não foi possível buscar o clima.");
    }
  }, [query]);

  useEffect(() => {
    if (hasLoadedDefaultCity.current) {
      return;
    }

    hasLoadedDefaultCity.current = true;
    const timeoutId = window.setTimeout(() => {
      search(DEFAULT_CITY);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const term = debouncedQuery.trim();

    if (term.length < 2) {
      return () => controller.abort();
    }

    searchCities(term, controller.signal)
      .then((cities) => {
        setSuggestions(cities);
        setIsSuggestionsOpen(cities.length > 0);
        setActiveSuggestionIndex(-1);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setSuggestions([]);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const setFeedback = useCallback((feedbackMessage, nextStatus = "idle") => {
    setMessage(feedbackMessage);
    setStatus(nextStatus);
  }, []);

  return {
    query,
    setQuery: updateQuery,
    weather,
    suggestions,
    recentCities,
    status,
    message,
    isSuggestionsOpen,
    setIsSuggestionsOpen,
    activeSuggestionIndex,
    setActiveSuggestionIndex,
    search,
    setFeedback,
  };
}
