const weatherThemeMap = {
  Clear: "clear",
  Clouds: "clouds",
  Rain: "rain",
  Drizzle: "rain",
  Thunderstorm: "storm",
  Snow: "snow",
  Mist: "mist",
  Smoke: "mist",
  Haze: "mist",
  Dust: "mist",
  Fog: "mist",
  Sand: "mist",
  Ash: "mist",
  Squall: "storm",
  Tornado: "storm",
};

const airQualityMap = {
  1: "Хорошее",
  2: "Умеренное",
  3: "Среднее",
  4: "Плохое",
  5: "Очень плохое",
};

export function getWeatherTheme(main) {
  return weatherThemeMap[main] ?? "clear";
}

export function formatTemperature(value) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${Math.round(value)}°C`;
}

export function formatCityName(city) {
  if (!city) {
    return "Город не выбран";
  }

  const cityName = city.localNames?.ru ?? city.name;

  return [cityName, city.country].filter(Boolean).join(", ");
}

export function formatDateTime(date) {
  if (!date) {
    return "--";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDayLabel(timestamp) {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(timestamp * 1000));
}

export function pickDailyForecasts(list) {
  const dayMap = new Map();

  list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().slice(0, 10);
    const hour = date.getHours();
    const targetDistance = Math.abs(hour - 12);
    const currentItem = dayMap.get(dateKey);

    if (!currentItem) {
      dayMap.set(dateKey, item);
      return;
    }

    const currentHour = new Date(currentItem.dt * 1000).getHours();
    const currentDistance = Math.abs(currentHour - 12);

    if (targetDistance < currentDistance) {
      dayMap.set(dateKey, item);
    }
  });

  return Array.from(dayMap.values()).slice(0, 5);
}

export function getAirQualityLabel(index) {
  return airQualityMap[index] ?? "Нет данных";
}
