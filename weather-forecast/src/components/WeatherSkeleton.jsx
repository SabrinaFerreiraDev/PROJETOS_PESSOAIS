export function WeatherSkeleton() {
  return (
    <div className="weather-skeleton" aria-label="Carregando previsão">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-temp" />
      <div className="skeleton-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="skeleton skeleton-card" key={index} />
        ))}
      </div>
    </div>
  );
}
