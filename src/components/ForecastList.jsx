import { formatDayLabel, formatTemperature } from "../utils/weather";

function ForecastList({ forecastItems }) {
  return (
    <section className="forecast-panel">
      <h2>Прогноз на несколько дней</h2>

      <div className="forecast-grid">
        {forecastItems.map((item) => {
          const weather = item.weather?.[0] ?? {};
          const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

          return (
            <article className="forecast-card" key={item.dt}>
              <p className="forecast-day">{formatDayLabel(item.dt)}</p>
              <img
                className="forecast-icon"
                src={iconUrl}
                alt={weather.description ?? "Погода"}
              />
              <p className="forecast-temp">{formatTemperature(item.main?.temp)}</p>
              <p className="forecast-description">{weather.description}</p>
              <p className="forecast-extra">Ветер: {item.wind?.speed} м/с</p>
              <p className="forecast-extra">Влажность: {item.main?.humidity}%</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ForecastList;
