
import { useCallback } from "react";
import { SearchPanel } from "./components/SearchPanel";
import { WeatherDashboard } from "./components/WeatherDashboard";
import { WeatherParticles } from "./components/WeatherParticles";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useWeatherSearch } from "./hooks/useWeatherSearch";
import { getWeatherTheme } from "./utils/weather";
import "./styles/global.css";

function App() {
  const weatherSearch = useWeatherSearch();
  const theme = getWeatherTheme(weatherSearch.weather);
  const handleVoiceResult = useCallback(
    (city) => {
      weatherSearch.setQuery(city);
      weatherSearch.search(city);
    },
    [weatherSearch],
  );

  const handleVoiceError = useCallback(
    (message) => {
      weatherSearch.setFeedback(message, "error");
    },
    [weatherSearch],
  );

  const speechRecognition = useSpeechRecognition({
    onResult: handleVoiceResult,
    onError: handleVoiceError,
  });

  return (
    <main className={`weather-app theme-${theme}`}>
      <WeatherParticles theme={theme} />
      <div className="app-overlay" />

      <div className="app-shell">
        <SearchPanel
          activeSuggestionIndex={weatherSearch.activeSuggestionIndex}
          isListening={speechRecognition.isListening}
          isMicSupported={speechRecognition.isSupported}
          isSuggestionsOpen={weatherSearch.isSuggestionsOpen}
          message={weatherSearch.message}
          onActiveSuggestionChange={weatherSearch.setActiveSuggestionIndex}
          onQueryChange={weatherSearch.setQuery}
          onSearch={weatherSearch.search}
          onSetSuggestionsOpen={weatherSearch.setIsSuggestionsOpen}
          onStartListening={speechRecognition.startListening}
          query={weatherSearch.query}
          recentCities={weatherSearch.recentCities}
          status={weatherSearch.status}
          suggestions={weatherSearch.suggestions}
        />

        <WeatherDashboard
          status={weatherSearch.status}
          weather={weatherSearch.weather}
        />
      </div>
    </main>
  );
}

export default App;
