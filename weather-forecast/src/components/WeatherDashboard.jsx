import {
  formatMetric,
  formatTime,
  formatUpdatedAt,
  getComfortMessage,
  getWeatherIcon,
} from "../utils/weather";
import { Icon } from "./Icons";
import { WeatherSkeleton } from "./WeatherSkeleton";

function MetricCard({ icon, label, value, helper }) {
  return (
    <article className="metric-card">
      <div className="metric-icon">
        <Icon name={icon} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {helper && <small>{helper}</small>}
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <section className="weather-dashboard glass-panel empty-state">
      <div className="empty-icon">
        <Icon name="spark" />
      </div>
      <h2>Pronto para consultar o clima</h2>
      <p>
        Pesquise uma cidade ou use o microfone para carregar uma previsão
        completa, com indicadores e recomendações rápidas.
      </p>
    </section>
  );
}

export function WeatherDashboard({ weather, status }) {
  if (status === "loading") {
    return (
      <section className="weather-dashboard glass-panel">
        <WeatherSkeleton />
      </section>
    );
  }

  if (!weather) {
    return <EmptyState />;
  }

  const metrics = weather.metrics;
  const weatherIcon = getWeatherIcon(weather.condition, weather.isNight);
  const heroStats = [
    {
      icon: "humidity",
      label: "Umidade",
      value: formatMetric(metrics.humidity, "%"),
    },
    {
      icon: "wind",
      label: "Vento",
      value: formatMetric(metrics.wind, " km/h"),
    },
    {
      icon: "umbrella",
      label: "Chuva",
      value: formatMetric(metrics.rainChance, "%"),
    },
  ];

  const cards = [
    {
      icon: "sun",
      label: "Sensação térmica",
      value: formatMetric(metrics.feelsLike, "°C"),
      helper: "Percepção atual",
    },
    {
      icon: "gauge",
      label: "Pressão",
      value: formatMetric(metrics.pressure, " hPa"),
      helper: "Pressão atmosférica",
    },
    {
      icon: "eye",
      label: "Visibilidade",
      value: formatMetric(metrics.visibility, " km"),
      helper: "Alcance estimado",
    },
    {
      icon: "sunrise",
      label: "Nascer do sol",
      value: formatTime(metrics.sunrise),
      helper: "Horário local",
    },
    {
      icon: "sunset",
      label: "Pôr do sol",
      value: formatTime(metrics.sunset),
      helper: "Horário local",
    },
    {
      icon: "spark",
      label: "Índice UV",
      value: formatMetric(
        metrics.uvIndex === null ? null : Number(metrics.uvIndex).toFixed(1),
      ),
      helper: "Fonte Open-Meteo",
    },
  ];

  return (
    <section className="weather-dashboard glass-panel">
      <div className="weather-hero">
        <div className="weather-copy">
          <span className="section-kicker">{formatUpdatedAt(weather.updatedAt)}</span>
          <h2>
            {weather.city}
            {weather.country ? <small>{weather.country}</small> : null}
          </h2>
          <p>{weather.description}</p>
        </div>

        <div className="temperature-orb" aria-label={`${metrics.temperature} graus`}>
          <Icon name={weatherIcon} />
          <strong>{metrics.temperature}°</strong>
        </div>
      </div>

      <div className="hero-stat-grid">
        {heroStats.map((stat) => (
          <MetricCard
            icon={stat.icon}
            key={stat.label}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      <div className="insight-card">
        <Icon name="spark" />
        <div>
          <span>Dica do dia</span>
          <p>{getComfortMessage(weather)}</p>
        </div>
      </div>

      <div className="metric-grid">
        {cards.map((card) => (
          <MetricCard
            helper={card.helper}
            icon={card.icon}
            key={card.label}
            label={card.label}
            value={card.value}
          />
        ))}
      </div>
    </section>
  );
}
