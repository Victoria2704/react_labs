import {
  getMockAirPollution,
  getMockForecast,
  searchMockCities,
} from "../data/mockWeather";

const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const AIR_URL = "https://api.openweathermap.org/data/2.5/air_pollution";
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const FORCE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

function shouldUseMocks(options = {}) {
  if (typeof options.useMocks === "boolean") {
    return options.useMocks;
  }

  return FORCE_MOCKS || !API_KEY;
}

async function requestJson(url, options = {}) {
  const response = await (options.fetchImpl ?? fetch)(url, {
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Ошибка запроса: ${response.status}`);
  }

  return response.json();
}

export async function searchCities(query, options = {}) {
  if (shouldUseMocks(options)) {
    return searchMockCities(query);
  }

  const params = new URLSearchParams({
    q: query,
    limit: "5",
    appid: API_KEY,
  });

  return requestJson(`${GEO_URL}?${params}`, options);
}

export async function loadWeatherByCity(city, options = {}) {
  if (shouldUseMocks(options)) {
    return {
      forecast: getMockForecast(city),
      air: getMockAirPollution(city),
      source: "mock",
    };
  }

  const forecastParams = new URLSearchParams({
    lat: String(city.lat),
    lon: String(city.lon),
    appid: API_KEY,
    units: "metric",
    lang: "ru",
  });

  const airParams = new URLSearchParams({
    lat: String(city.lat),
    lon: String(city.lon),
    appid: API_KEY,
  });

  const [forecast, air] = await Promise.all([
    requestJson(`${FORECAST_URL}?${forecastParams}`, options),
    requestJson(`${AIR_URL}?${airParams}`, options),
  ]);

  return {
    forecast,
    air,
    source: "api",
  };
}
