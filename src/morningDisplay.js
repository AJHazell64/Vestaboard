function getUkDateParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).formatToParts(new Date());

  return Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );
}

function getWeekNumber() {
  const now = new Date();

  const ukDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Europe/London",
    })
  );

  const date = new Date(
    Date.UTC(
      ukDate.getFullYear(),
      ukDate.getMonth(),
      ukDate.getDate()
    )
  );

  const dayNumber = date.getUTCDay() || 7;

  date.setUTCDate(
    date.getUTCDate() + 4 - dayNumber
  );

  const yearStart = new Date(
    Date.UTC(date.getUTCFullYear(), 0, 1)
  );

  return Math.ceil(
    (((date - yearStart) / 86400000) + 1) / 7
  );
}

function formatRange(teslaRangeMiles) {
  if (!Number.isFinite(teslaRangeMiles)) {
    return "--MI";
  }

  return `${Math.round(teslaRangeMiles)}MI`;
}

function getRainBarCells(rainProbability) {
  if (!Number.isFinite(rainProbability)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      8,
      Math.round(rainProbability / 12.5)
    )
  );
}

export function createMorningDisplay(
  weather,
  teslaRangeMiles
) {
  const dateParts = getUkDateParts();
  const weekNumber = getWeekNumber();

  const line1 =
    `${dateParts.weekday.toUpperCase()} ` +
    `${dateParts.day}${dateParts.month.toUpperCase()} ` +
    `WK${weekNumber}`;

  const rainBarCells =
    getRainBarCells(weather.rainProbability);

  const line2 =
    weather.rainProbability === 100
      ? "RAIN"
      : `${weather.rainProbability}%RAIN`;

  const line3 =
    `${weather.currentTemperature}C ` +
    `${formatRange(teslaRangeMiles)}`;

  return {
    line1,
    line2,
    line3,
    line1Colour: weather.colour,
    rainBarCells,
  };
}
