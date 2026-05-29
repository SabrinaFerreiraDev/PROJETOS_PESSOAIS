export function WeatherParticles({ theme }) {
  const particleStyle = (index, speed = 1) => ({
    left: `${(index * 37) % 100}%`,
    animationDelay: `${-(index % 12) * 0.35}s`,
    animationDuration: `${speed + (index % 5) * 0.2}s`,
  });

  if (theme === "rain" || theme === "storm") {
    return (
      <div className="weather-particles rain-particles" aria-hidden="true">
        {Array.from({ length: 36 }).map((_, index) => (
          <span key={index} style={particleStyle(index, 0.75)} />
        ))}
      </div>
    );
  }

  if (theme === "snow") {
    return (
      <div className="weather-particles snow-particles" aria-hidden="true">
        {Array.from({ length: 42 }).map((_, index) => (
          <span key={index} style={particleStyle(index, 5.5)} />
        ))}
      </div>
    );
  }

  if (theme === "clear") {
    return <div className="sun-glow" aria-hidden="true" />;
  }

  if (theme === "clouds" || theme === "mist") {
    return (
      <div className="cloud-layer" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    );
  }

  return <div className="ambient-lines" aria-hidden="true" />;
}
