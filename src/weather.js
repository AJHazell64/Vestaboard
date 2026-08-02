const WEATHER_API_URL =
  "https://api.open-meteo.com/v1/forecast";

const LATITUDE = 52.84;
const LONGITUDE = -1.55;

export async function getMorningWeather() {
  const parameters = new URLSearchParams({
    latitude: String(LATITUDE),
    longitude: String(LONGITUDE),
    current: "temperature_2m",
    daily:
      "temperature_2m_max,precipitation_probability_max,weather_code",
    timezone: "Europe/London",
    forecast_days: "1",
  });

  const response = await fetch(
    `${WEATHER_API_URL}?${parameters.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `Weather request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  const currentTemperature =
    data.current?.temperature_2m;

  const dailyHigh =
    data.daily?.temperature_2m_max?.[0];

  const rainProbability =
    data.daily?.precipitation_probability_max?.[0];

  const weatherCode =
    data.daily?.weather_code?.[0];

  if (
    !Number.isFinite(currentTemperature) ||
    !Number.isFinite(dailyHigh) ||
    !Number.isFinite(rainProbability) ||
    !Number.isFinite(weatherCode)
  ) {
    throw new Error(
      "Weather response is missing required data"
    );
  }

  return {
    currentTemperature:
      Math.round(currentTemperature),
    dailyHigh:
      Math.round(dailyHigh),
    rainProbability:
      Math.round(rainProbability),
    weatherCode,
  };
}

export function getMorningWeatherColour(
  dailyHigh,
  rainProbability,
  weatherCode
) {
  if (rainProbability >= 50) {
    return "BLUE";
  }

  if (weatherCode === 3) {
    return "WHITE";
  }

  if (dailyHigh > 25) {
    return "RED";
  }

  if (dailyHigh >= 15) {
    return "ORANGE";
  }

  return "YELLOW";
}
