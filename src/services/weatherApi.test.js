import { describe, expect, it, vi } from "vitest";
import { loadWeatherByCity, searchCities } from "./weatherApi";

describe("weather api", () => {
  it("searches cities with mocked fetch", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          name: "Novosibirsk",
          lat: 55.0415,
          lon: 82.9346,
          country: "RU",
        },
      ],
    });

    const result = await searchCities("Новосибирск", {
      useMocks: false,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toContain("geo/1.0/direct");
    expect(result[0].name).toBe("Novosibirsk");
  });

  it("loads forecast and air quality with mocked fetch", async () => {
    const responses = [
      {
        cod: "200",
        list: [{ dt: 1 }],
        city: { name: "Новосибирск" },
      },
      {
        list: [{ main: { aqi: 2 }, components: { pm2_5: 7.2 } }],
      },
    ];

    const fetchImpl = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => responses.shift(),
    }));

    const result = await loadWeatherByCity(
      {
        lat: 55.0415,
        lon: 82.9346,
      },
      {
        useMocks: false,
        fetchImpl,
      }
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.source).toBe("api");
    expect(result.forecast.city.name).toBe("Новосибирск");
    expect(result.air.list[0].main.aqi).toBe(2);
  });
});
