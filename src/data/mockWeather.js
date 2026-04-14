const mockCities = [
  {
    name: "Novosibirsk",
    localNames: { ru: "Новосибирск" },
    lat: 55.0415,
    lon: 82.9346,
    country: "RU",
    state: "Новосибирская область",
  },
  {
    name: "Moscow",
    localNames: { ru: "Москва" },
    lat: 55.7558,
    lon: 37.6176,
    country: "RU",
    state: "Москва",
  },
  {
    name: "Saint Petersburg",
    localNames: { ru: "Санкт-Петербург" },
    lat: 59.9386,
    lon: 30.3141,
    country: "RU",
    state: "Санкт-Петербург",
  },
  {
    name: "Kazan",
    localNames: { ru: "Казань" },
    lat: 55.7961,
    lon: 49.1064,
    country: "RU",
    state: "Татарстан",
  },
  {
    name: "Omsk",
    localNames: { ru: "Омск" },
    lat: 54.9914,
    lon: 73.3645,
    country: "RU",
    state: "Омская область",
  },
];

const weatherPatterns = [
  { main: "Clouds", description: "облачно с прояснениями", icon: "03d" },
  { main: "Rain", description: "небольшой дождь", icon: "10d" },
  { main: "Clouds", description: "пасмурно", icon: "04d" },
  { main: "Clear", description: "ясно", icon: "01d" },
  { main: "Clear", description: "солнечно", icon: "02d" },
  { main: "Rain", description: "дождь", icon: "10d" },
  { main: "Mist", description: "туман", icon: "50d" },
  { main: "Snow", description: "небольшой снег", icon: "13d" },
];

function normalizeText(value) {
  return value.toLowerCase().replaceAll("ё", "е").trim();
}

function createRoundedStartDate() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() - (date.getHours() % 3));
  return date;
}

function getIconByHour(icon, hour) {
  if (icon.endsWith("d") && (hour >= 18 || hour < 6)) {
    return `${icon.slice(0, -1)}n`;
  }

  return icon;
}

function createForecastItem(city, date, index) {
  const pattern = weatherPatterns[index % weatherPatterns.length];
  const tempShift = Math.sin(index / 3) * 4;
  const cityShift = (city.lat % 5) - 1;
  const hour = date.getHours();
  const temp = Number((8 + tempShift + cityShift).toFixed(1));
  const feelsLike = Number((temp - 1.6).toFixed(1));
  const humidity = 48 + ((index * 7) % 38);
  const windSpeed = Number((2.1 + (index % 5) * 0.9).toFixed(1));

  return {
    dt: Math.floor(date.getTime() / 1000),
    main: {
      temp,
      feels_like: feelsLike,
      pressure: 1008 + (index % 10),
      humidity,
    },
    weather: [
      {
        main: pattern.main,
        description: pattern.description,
        icon: getIconByHour(pattern.icon, hour),
      },
    ],
    clouds: {
      all: 20 + ((index * 9) % 80),
    },
    wind: {
      speed: windSpeed,
    },
    visibility: 7000 + ((index * 300) % 2500),
    pop: Number(((index % 4) * 0.2).toFixed(1)),
    dt_txt: date.toISOString().replace("T", " ").slice(0, 19),
  };
}

export function searchMockCities(query) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return mockCities.slice(0, 5);
  }

  return mockCities.filter((city) => {
    const values = [city.name, city.localNames?.ru, city.state].filter(Boolean);

    return values.some((value) => normalizeText(value).includes(normalizedQuery));
  });
}

export function getMockForecast(city) {
  const startDate = createRoundedStartDate();
  const list = Array.from({ length: 40 }, (_, index) => {
    const date = new Date(startDate.getTime() + index * 3 * 60 * 60 * 1000);
    return createForecastItem(city, date, index);
  });

  return {
    cod: "200",
    message: 0,
    cnt: list.length,
    list,
    city: {
      id: Math.round((city.lat + city.lon) * 1000),
      name: city.localNames?.ru ?? city.name,
      country: city.country,
      sunrise: Math.floor(startDate.getTime() / 1000),
      sunset: Math.floor(startDate.getTime() / 1000) + 12 * 60 * 60,
    },
  };
}

export function getMockAirPollution(city) {
  const cityFactor = Math.abs(Math.round(city.lon)) % 5;

  return {
    list: [
      {
        main: {
          aqi: cityFactor + 1,
        },
        components: {
          co: 210 + cityFactor * 28,
          no: 0.5 + cityFactor * 0.2,
          no2: 7.4 + cityFactor * 2.8,
          o3: 48 + cityFactor * 10,
          so2: 1.8 + cityFactor * 0.9,
          pm2_5: 6.3 + cityFactor * 3.2,
          pm10: 10.8 + cityFactor * 4.7,
          nh3: 1.1 + cityFactor * 0.6,
        },
        dt: Math.floor(Date.now() / 1000),
      },
    ],
  };
}
