import { Icon } from "./Icons";

export function SearchPanel({
  activeSuggestionIndex,
  isListening,
  isMicSupported,
  isSuggestionsOpen,
  message,
  onActiveSuggestionChange,
  onQueryChange,
  onSearch,
  onSetSuggestionsOpen,
  onStartListening,
  query,
  recentCities,
  status,
  suggestions,
}) {
  const hasSuggestions = isSuggestionsOpen && suggestions.length > 0;
  const showRecent = isSuggestionsOpen && !query.trim() && recentCities.length > 0;

  function handleSubmit(event) {
    event.preventDefault();
    onSearch(query);
  }

  function handleKeyDown(event) {
    if (!hasSuggestions) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      onActiveSuggestionChange((activeSuggestionIndex + 1) % suggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      onActiveSuggestionChange(
        activeSuggestionIndex <= 0
          ? suggestions.length - 1
          : activeSuggestionIndex - 1,
      );
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      onSearch(suggestions[activeSuggestionIndex].label);
    }

    if (event.key === "Escape") {
      onSetSuggestionsOpen(false);
    }
  }

  return (
    <section className="search-panel glass-panel" aria-labelledby="search-title">
      <div className="section-kicker">Weather Intelligence</div>
      <div className="search-heading">
        <div>
          <h1 id="search-title">Previsão do Tempo</h1>
          <p>Dados em tempo real com leitura visual premium.</p>
        </div>
        <span className="live-badge">
          <span />
          Ao vivo
        </span>
      </div>

      <form className="search-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="city-search">
          Pesquisar cidade
        </label>
        <div className="search-input-shell">
          <Icon name="location" className="input-icon" />
          <input
            aria-autocomplete="list"
            aria-expanded={hasSuggestions}
            aria-controls="city-suggestions"
            autoComplete="off"
            id="city-search"
            onBlur={() => window.setTimeout(() => onSetSuggestionsOpen(false), 160)}
            onChange={(event) => {
              onQueryChange(event.target.value);
              onSetSuggestionsOpen(true);
            }}
            onFocus={() => onSetSuggestionsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Busque por cidade, estado ou país"
            type="search"
            value={query}
          />
          <button
            aria-label="Pesquisar cidade"
            className="icon-button search-button"
            disabled={status === "loading"}
            type="submit"
          >
            <Icon name="search" />
          </button>
          <button
            aria-label={
              isListening ? "Microfone ouvindo" : "Pesquisar cidade por voz"
            }
            className={`icon-button mic-button ${isListening ? "is-listening" : ""}`}
            disabled={!isMicSupported || status === "loading"}
            onClick={onStartListening}
            title={
              isMicSupported
                ? "Pesquisar por voz"
                : "Reconhecimento de voz indisponível"
            }
            type="button"
          >
            <Icon name="mic" />
          </button>
        </div>

        {(hasSuggestions || showRecent) && (
          <div className="suggestions-popover" id="city-suggestions" role="listbox">
            {hasSuggestions &&
              suggestions.map((suggestion, index) => (
                <button
                  aria-selected={index === activeSuggestionIndex}
                  className={
                    index === activeSuggestionIndex ? "is-active" : undefined
                  }
                  key={suggestion.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSearch(suggestion.label)}
                  role="option"
                  type="button"
                >
                  <Icon name="location" />
                  <span>{suggestion.label}</span>
                </button>
              ))}

            {showRecent && (
              <div className="recent-group">
                <span>Cidades recentes</span>
                {recentCities.map((city) => (
                  <button
                    key={city}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onSearch(city)}
                    type="button"
                  >
                    <Icon name="location" />
                    <span>{city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </form>

      <div className={`feedback-bar ${status}`} role="status" aria-live="polite">
        <span />
        {isListening ? "Ouvindo..." : message || "Digite uma cidade para começar."}
      </div>
    </section>
  );
}
