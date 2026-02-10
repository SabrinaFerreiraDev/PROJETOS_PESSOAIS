import Micro from "../assets/microfone.svg";
import { useState } from "react";
import lupa from "../assets/lupa.png";

const AbaPrevision = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  const ChaveIa = import.meta.env.VITE_API_KEY_IA;

  async function fetchWeather(cityName) {
    const chave = import.meta.env.VITE_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${chave}&lang=pt_br&units=metric`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Cidade não encontrada");

    return response.json();
  }

  async function handleSearch(searchCity = city) {
    if (!searchCity.trim()) return;

    try {
      setLoading(true);
      setError("");
      setShowSuggestion(false);
      setSuggestion("");

      const data = await fetchWeather(searchCity);
      setWeather(data);
      setShowSuggestion(true);
    } catch (err) {
      setWeather(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleMic() {
    const Voz = new window.webkitSpeechRecognition();
    Voz.lang = "pt-BR";
    Voz.start();

    Voz.onresult = (evento) => {
      const texto = evento.results[0][0].transcript.replace(/\.$/, "").trim();
      setCity(texto);
      handleSearch(texto);
    };
  }

  function handleCityChange(event) {
    setCity(event.target.value);
  }

  async function handleSuggestion() {
    const temperatura = weather.main.temp;
    const umidade = weather.main.humidity;
    const cidade = weather.name;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ChaveIa}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "user",
              content: `Me dê uma sugestão de roupa para ${cidade} com temperatura de ${temperatura}°C e umidade de ${umidade}%. Responda em no máximo 2 frases curtas.`,
            },
          ],
        }),
      },
    );

    const data = await response.json();
    setSuggestion(
      data.choices?.[0]?.message?.content || "Não consegui gerar sugestão.",
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6 px-4">
      {/* HEADER */}
      <div className="w-full max-w-sm mx-auto bg-linear-to-r from-black/70 via-black/60 to-black/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 px-4 py-3">
        <h1 className="text-center text-2xl font-bold font-serif text-white tracking-wider">
          Previsão do Tempo
        </h1>
      </div>

      {/* CONTAINER PRINCIPAL */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
        {/* BUSCA */}
        <div className="w-full bg-linear-to-r from-black/70 to-black/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
          <div className="flex flex-col md:flex-row items-center gap-4 px-4 py-4 bg-black/40 rounded-2xl">
            <input
              type="text"
              placeholder="Digite a cidade"
              className="w-full md:w-80 h-12 bg-transparent text-white placeholder-white/40 border-b border-white/20 focus:border-white/60 outline-none transition-all"
              value={city}
              onChange={handleCityChange}
            />

            <div className="flex items-center gap-4">
              <button
                onClick={handleMic}
                className="p-2 rounded-full hover:bg-white/10 transition"
              >
                <img src={Micro} alt="Microfone" />
              </button>

              <button
                onClick={handleSearch}
                className="p-2 rounded-full hover:bg-white/10 transition"
              >
                <img src={lupa} alt="Buscar" className="h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* RESULTADO */}
        <div className="w-full bg-linear-to-r from-black/60 via-black/40 to-black/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10">
          {loading && (
            <p className="text-white text-center animate-pulse">
              Carregando...
            </p>
          )}

          {error && <p className="text-red-400 text-center">{error}</p>}

          {weather && !loading && (
            <div className="flex flex-col items-center gap-5">
              <h2 className="text-2xl font-bold text-white tracking-widest">
                {weather.name}
              </h2>

              <div className="flex items-center gap-3">
                <p className="text-4xl font-semibold text-white">
                  {Math.round(weather.main.temp)}°
                </p>

                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                  alt="Ícone do clima"
                  className="h-16 w-16"
                />
              </div>

              <p className="text-lg text-white capitalize opacity-90">
                {weather.weather[0].description}
              </p>

              <p className="text-sm text-white opacity-80">
                Umidade: {weather.main.humidity}%
              </p>

              {showSuggestion && (
                <div className="flex flex-col items-center gap-5 w-full">
                  <button
                    onClick={handleSuggestion}
                    className="w-full max-w-xs text-white font-semibold bg-linear-to-r from-sky-400/20 via-cyan-300/10 to-sky-400/20 py-2 rounded-2xl border border-white/20 shadow-xl backdrop-blur-lg transition hover:scale-105"
                  >
                    Sugestão de Roupa
                  </button>

                  {suggestion && (
                    <div className="w-full bg-linear-to-br from-white/15 via-white/5 to-white/15 border border-white/20 rounded-2xl p-5 text-white shadow-xl backdrop-blur-xl flex flex-col items-center gap-4">
                      <span className="text-xs tracking-widest text-cyan-300">
                        🤖 RECOMENDAÇÃO INTELIGENTE
                      </span>

                      <p className="text-sm opacity-80">
                        {weather.name} • {Math.round(weather.main.temp)}°C
                      </p>

                      <p className="text-base font-semibold text-center">
                        {suggestion}
                      </p>

                      <span className="text-[10px] text-white/40 tracking-widest">
                        POWERED BY AI
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AbaPrevision;
