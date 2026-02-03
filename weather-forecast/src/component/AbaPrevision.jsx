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
  let ChaveIa = import.meta.env.VITE_API_KEY_IA;

  async function fetchWeather(cityName) {
    let chave = import.meta.env.VITE_API_KEY;

    let url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${chave}&lang=pt_br&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Cidade não encontrada");
    }

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
      const textoTranscricao = evento.results[0][0].transcript
        .replace(/\.$/, "")
        .trim();

      setCity(textoTranscricao);
      handleSearch(textoTranscricao);
    };
  }

  function handleCityChange(event) {
    setCity(event.target.value);
  }

  async function handleSuggestion() {
    let temperatura = weather.main.temp;
    let Umidade = weather.main.humidity;
    let cidade = weather.name;

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
              content: `Me dê uma sugestão de roupa para ${cidade} com temperatura de ${temperatura}°C e umidade de ${Umidade}%. Responda em no máximo 2 frases curtas.`,
            },
          ],
        }),
      },
    );

    const data = await response.json();

    const texto =
      data.choices?.[0]?.message?.content || "Não consegui gerar sugestão.";

    setSuggestion(texto);
  }

  return (
    <div className="flex justify-center items-center min-h-screen w-full flex-col gap-5 px-2">
      {/* Header */}
      <div className="flex bg-linear-to-r justify-center items-center h-15 w-full max-w-sm md:max-w-md from-black/70 via-black/60 to-black/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 px-6 mx-4">
        <h1 className="text-center text-2xl md:text-3xl font-bold font-serif text-white tracking-wider drop-shadow-md">
          Previsão do Tempo
        </h1>
      </div>

      <div className="bg-black-opacity h-auto w-full max-w-xl mt-10 px-4">
        <div className="flex justify-center items-center flex-col gap-6">
          {/* Busca */}
          <div className="flex justify-center items-center bg-linear-to-r from-black/70 to-black/50 h-auto w-full rounded-2xl shadow-2xl border border-white/10">
            <div className="flex flex-col md:flex-row justify-center items-center bg-black/40 h-auto w-full rounded-2xl px-4 py-4 gap-4 backdrop-blur-xl">
              <input
                type="text"
                placeholder="Digite a cidade"
                className="outline-none h-12 w-full md:w-80 text-white bg-transparent placeholder-white/40 tracking-wide border-b border-white/20 focus:border-white/60 transition-all duration-300"
                value={city}
                onChange={handleCityChange}
              />

              <div className="flex justify-center items-center gap-5">
                <button
                  className="text-white hover:translate-y-0.5 transition-all duration-200 rounded-full hover:scale-110 hover:bg-white/10 p-2"
                  onClick={handleMic}
                >
                  <img src={Micro} alt="Microfone" />
                </button>

                <button
                  className="text-white hover:translate-y-0.5 transition-all duration-200 rounded-full hover:scale-110 hover:bg-white/10 p-2"
                  onClick={handleSearch}
                >
                  <img src={lupa} alt="lupa" className="h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className="flex flex-col bg-linear-to-r from-black/60 via-black/40 to-black/60 backdrop-blur-lg w-full rounded-b-2xl py-6 gap-3 shadow-xl border border-white/10">
            {loading && (
              <p className="text-white text-center animate-pulse">
                Carregando...
              </p>
            )}

            {error && <p className="text-red-400 text-center">{error}</p>}

            {weather && !loading && (
              <div className="flex flex-col items-center gap-4 py-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-widest font-mono">
                  {weather.name}
                </h2>

                <div className="flex items-center gap-4">
                  <p className="text-4xl md:text-5xl font-semibold text-white">
                    {Math.round(weather.main.temp)}°
                  </p>

                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                    alt="Ícone"
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
                  <div className="flex flex-col items-center gap-2 w-full">
                    <p
                      onClick={handleSuggestion}
                      className="text-white font-semibold bg-linear-to-r from-sky-400/20 w-full max-w-xs h-9 via-cyan-300/10 to-sky-400/20 px-6 py-4 rounded-2xl border border-white/20 shadow-xl backdrop-blur-lg cursor-pointer transition-all hover:scale-105 active:scale-95 text-center"
                    >
                      Sugestão de Roupa
                    </p>

                    {suggestion && (
                      <div className="mt-5 max-w-md bg-linear-to-br from-white/15 via-white/5 to-white/15 border border-white/20 rounded-2xl p-5 text-white shadow-xl shadow-black/40 backdrop-blur-xl animate-fade-in flex flex-col items-center gap-3">
                        <span className="text-xs tracking-widest text-cyan-300">
                          🤖 RECOMENDAÇÃO INTELIGENTE
                        </span>

                        <p className="text-sm opacity-80">
                          {weather.name} • {Math.round(weather.main.temp)}°C
                        </p>

                        <p className="text-base font-semibold text-center leading-relaxed">
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
    </div>
  );
};

export default AbaPrevision;
