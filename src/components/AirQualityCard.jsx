import { getAirQualityLabel } from "../utils/weather";

function AirQualityCard({ airData }) {
  const airItem = airData?.list?.[0];

  if (!airItem) {
    return null;
  }

  const airLabel = getAirQualityLabel(airItem.main?.aqi);
  const components = airItem.components ?? {};

  return (
    <section className="air-panel">
      <h2>Качество воздуха</h2>

      <div className="air-quality-header">
        <div className={`aqi-badge aqi-${airItem.main?.aqi}`}>{airLabel}</div>
        <p className="air-text">Индекс AQI: {airItem.main?.aqi}</p>
      </div>

      <div className="pollution-grid">
        <div className="pollution-card">
          <strong>PM2.5</strong>
          <span>{components.pm2_5} мкг/м3</span>
        </div>

        <div className="pollution-card">
          <strong>PM10</strong>
          <span>{components.pm10} мкг/м3</span>
        </div>

        <div className="pollution-card">
          <strong>CO</strong>
          <span>{components.co} мкг/м3</span>
        </div>

        <div className="pollution-card">
          <strong>NO2</strong>
          <span>{components.no2} мкг/м3</span>
        </div>

        <div className="pollution-card">
          <strong>SO2</strong>
          <span>{components.so2} мкг/м3</span>
        </div>

        <div className="pollution-card">
          <strong>O3</strong>
          <span>{components.o3} мкг/м3</span>
        </div>
      </div>
    </section>
  );
}

export default AirQualityCard;
