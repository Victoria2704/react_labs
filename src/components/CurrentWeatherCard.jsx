import {
  formatCityName,
  formatDateTime,
  formatTemperature,
} from "../utils/weather";

function CurrentWeatherCard({
  city,
  currentWeather,
  lastUpdated,
  refreshing,
  onRefresh,
}) {
  const weather = currentWeather.weather?.[0] ?? {};
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;

  return (
    <article className="current-card">
      <div className="current-header">
        <div>
          <h2 className="city-name">{formatCityName(city)}</h2>
          <p className="current-description">{weather.description}</p>
          <p className="current-meta">Обновлено: {formatDateTime(lastUpdated)}</p>
        </div>

        <button className="refresh-button" type="button" onClick={onRefresh}>
          {refreshing ? "Обновление..." : "Обновить"}
        </button>
      </div>

      <div className="current-body">
        <div className="temperature-block">
          <img
            className="current-icon"
            src={iconUrl}
            alt={weather.description ?? "Погода"}
          />
          <p className="temperature-value">
            {formatTemperature(currentWeather.main?.temp)}
          </p>
          <p className="temperature-feels-like">
            Ощущается как {formatTemperature(currentWeather.main?.feels_like)}
          </p>
        </div>

        <div className="current-stats">
          <div className="stat-card">
            <p className="stat-label">Влажность</p>
            <p className="stat-value">{currentWeather.main?.humidity}%</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Скорость ветра</p>
            <p className="stat-value">{currentWeather.wind?.speed} м/с</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Давление</p>
            <p className="stat-value">{currentWeather.main?.pressure} гПа</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Видимость</p>
            <p className="stat-value">
              {Math.round((currentWeather.visibility ?? 0) / 1000)} км
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default CurrentWeatherCard;
