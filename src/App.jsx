import { useEffect, useRef, useState } from "react";
import SearchForm from "./components/SearchForm";
import CurrentWeatherCard from "./components/CurrentWeatherCard";
import ForecastList from "./components/ForecastList";
import AirQualityCard from "./components/AirQualityCard";
import { loadWeatherByCity, searchCities } from "./services/weatherApi";
import { getWeatherTheme, pickDailyForecasts } from "./utils/weather";
import "./App.css";

const DEFAULT_CITY_QUERY = "Новосибирск";
const QUICK_CITIES = [
  "Новосибирск",
  "Москва",
  "Санкт-Петербург",
  "Казань",
];
const REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000;

function App() {
  const [searchValue, setSearchValue] = useState(DEFAULT_CITY_QUERY);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityOptions, setCityOptions] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [airData, setAirData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const lastLoadedCityKey = useRef("");

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    async function loadInitialCity() {
      try {
        const cities = await searchCities(DEFAULT_CITY_QUERY, {
          signal: controller.signal,
        });

        if (!isActive) {
          return;
        }

        if (cities.length === 0) {
          throw new Error("Город не найден");
        }

        setCityOptions(cities);
        setSelectedCity(cities[0]);
        setErrorMessage("");
      } catch (error) {
        if (error.name !== "AbortError" && isActive) {
          setErrorMessage("Не удалось получить данные о городе.");
          setLoading(false);
        }
      }
    }

    loadInitialCity();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!selectedCity) {
      return undefined;
    }

    let isActive = true;
    const controller = new AbortController();
    const cityKey = `${selectedCity.lat}-${selectedCity.lon}`;
    const isFirstLoad = lastLoadedCityKey.current !== cityKey;

    async function loadWeather() {
      try {
        if (isFirstLoad) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setErrorMessage("");

        const data = await loadWeatherByCity(selectedCity, {
          signal: controller.signal,
        });

        if (!isActive) {
          return;
        }

        setForecastData(data.forecast);
        setAirData(data.air);
        setLastUpdated(new Date());
        lastLoadedCityKey.current = cityKey;
      } catch (error) {
        if (error.name !== "AbortError" && isActive) {
          setErrorMessage("Не удалось загрузить прогноз погоды.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadWeather();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [selectedCity, reloadToken]);

  useEffect(() => {
    if (!selectedCity) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setReloadToken((currentValue) => currentValue + 1);
    }, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedCity]);

  async function findCities(query) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setErrorMessage("Введите название города.");
      return;
    }

    try {
      setSearching(true);
      setErrorMessage("");

      const cities = await searchCities(trimmedQuery);

      if (cities.length === 0) {
        setCityOptions([]);
        setErrorMessage("Город не найден.");
        return;
      }

      setCityOptions(cities);
      setSelectedCity(cities[0]);
    } catch {
      setErrorMessage("Не удалось выполнить поиск города.");
    } finally {
      setSearching(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    void findCities(searchValue);
  }

  function handleQuickCitySelect(cityName) {
    setSearchValue(cityName);
    void findCities(cityName);
  }

  function handleCityOptionSelect(city) {
    setSelectedCity(city);
    setSearchValue(city.localNames?.ru ?? city.name);
  }

  function handleManualRefresh() {
    setReloadToken((currentValue) => currentValue + 1);
  }

  const currentWeather = forecastData?.list?.[0] ?? null;
  const dailyForecast = pickDailyForecasts(forecastData?.list ?? []);
  const theme = getWeatherTheme(currentWeather?.weather?.[0]?.main);

  return (
    <main className={`page theme-${theme}`}>
      <div className="app">
        <header className="page-header">
          <h1>Прогноз погоды</h1>
        </header>

        <SearchForm
          searchValue={searchValue}
          cityOptions={cityOptions}
          quickCities={QUICK_CITIES}
          searching={searching}
          selectedCity={selectedCity}
          onSearchValueChange={setSearchValue}
          onSubmit={handleSubmit}
          onQuickCitySelect={handleQuickCitySelect}
          onCityOptionSelect={handleCityOptionSelect}
        />

        {errorMessage ? <p className="status status-error">{errorMessage}</p> : null}

        {loading ? (
          <p className="status">Загрузка данных о погоде...</p>
        ) : null}

        {!loading && currentWeather ? (
          <section className="content">
            <CurrentWeatherCard
              city={selectedCity}
              currentWeather={currentWeather}
              lastUpdated={lastUpdated}
              refreshing={refreshing}
              onRefresh={handleManualRefresh}
            />

            <div className="details-grid">
              <ForecastList forecastItems={dailyForecast} />
              <AirQualityCard airData={airData} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default App;
