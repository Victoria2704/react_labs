import { formatCityName } from "../utils/weather";

function SearchForm({
  searchValue,
  cityOptions,
  quickCities,
  searching,
  selectedCity,
  onSearchValueChange,
  onSubmit,
  onQuickCitySelect,
  onCityOptionSelect,
}) {
  return (
    <section className="search-panel">
      <h2>Выбор города</h2>

      <form className="search-form" onSubmit={onSubmit}>
        <label className="search-label" htmlFor="city-search">
          Введите название города
        </label>

        <div className="search-row">
          <input
            id="city-search"
            className="search-input"
            type="text"
            value={searchValue}
            onChange={(event) => onSearchValueChange(event.target.value)}
            placeholder="Например, Новосибирск"
          />

          <button className="search-button" type="submit" disabled={searching}>
            {searching ? "Поиск..." : "Найти"}
          </button>
        </div>
      </form>

      <div className="quick-cities">
        {quickCities.map((cityName) => (
          <button
            key={cityName}
            className="quick-city-button"
            type="button"
            onClick={() => onQuickCitySelect(cityName)}
          >
            {cityName}
          </button>
        ))}
      </div>

      {cityOptions.length > 0 ? (
        <div className="city-options">
          {cityOptions.map((city) => {
            const isActive =
              selectedCity?.lat === city.lat && selectedCity?.lon === city.lon;

            return (
              <button
                key={`${city.lat}-${city.lon}`}
                className={`city-option-button ${
                  isActive ? "city-option-button-active" : ""
                }`}
                type="button"
                onClick={() => onCityOptionSelect(city)}
              >
                {formatCityName(city)}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default SearchForm;
