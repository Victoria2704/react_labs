import { describe, expect, it } from "vitest";
import {
  formatCityName,
  getAirQualityLabel,
  getWeatherTheme,
  pickDailyForecasts,
} from "./weather";

describe("weather utils", () => {
  it("returns weather theme by condition", () => {
    expect(getWeatherTheme("Rain")).toBe("rain");
    expect(getWeatherTheme("Snow")).toBe("snow");
    expect(getWeatherTheme("Unknown")).toBe("clear");
  });

  it("returns readable air quality label", () => {
    expect(getAirQualityLabel(1)).toBe("Хорошее");
    expect(getAirQualityLabel(5)).toBe("Очень плохое");
  });

  it("formats city name for buttons", () => {
    expect(
      formatCityName({
        name: "Moscow",
        localNames: { ru: "Москва" },
        country: "RU",
      })
    ).toBe("Москва, RU");
  });

  it("picks one forecast item for each day", () => {
    const list = [
      { dt: 1715076000 },
      { dt: 1715086800 },
      { dt: 1715162400 },
      { dt: 1715173200 },
      { dt: 1715248800 },
      { dt: 1715259600 },
    ];

    expect(pickDailyForecasts(list)).toHaveLength(3);
  });
});
