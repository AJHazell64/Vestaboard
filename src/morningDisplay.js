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

function getUkTime() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.hour}:${values.minute}`;
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

function formatTemperature(temperature) {
  if (!Number.isFinite(temperature)) {
    return "--C";
  }

  return `${Math.round(temperature)}C`
    .padEnd(3, " ")
    .slice(0, 3);
}

function formatRange(teslaRangeMiles) {
  if (!Number.isFinite(teslaRangeMiles)) {
    return "--MI".padStart(5, " ");
  }

  return `${Math.round(teslaRangeMiles)}MI`
    .padStart(5, " ")
    .slice(-5);
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

function textToCharacters(text) {
  return text
    .toUpperCase()
    .split("")
    .map((character) =>
      character === " " ? "BLANK" : character
    );
}

export function createMorningDisplay(
  weather,
  teslaRangeMiles
) {
  const dateParts = getUkDateParts();
  const weekNumber = getWeekNumber();
  const currentTime = getUkTime();

  const line1 =
    `${dateParts.weekday.toUpperCase()} ` +
    `${dateParts.day}${dateParts.month.toUpperCase()} ` +
    `WK${weekNumber}`;

  const rainBarCells =
    getRainBarCells(weather.rainProbability);

  const line2 =
    weather.rainProbability === 100
      ? "RAIN"
      : `${String(
          weather.rainProbability
        ).padStart(2, " ")}%RAIN`;

  const line3 =
    `${formatTemperature(
      weather.currentTemperature
    )} ` +
    `${formatRange(teslaRangeMiles)} ` +
    currentTime;

  const characters = [
    [
      ...textToCharacters(line1),
      weather.colour,
    ],
    Array(15).fill("BLACK"),
    textToCharacters(line3),
  ];

  const line2TextCharacters =
    textToCharacters(line2);

  characters[1].splice(
    0,
    line2TextCharacters.length,
    ...line2TextCharacters
  );

  const availableRainCells =
    15 - line2TextCharacters.length;

  const filledRainCells =
    weather.rainProbability === 100
      ? availableRainCells
      : Math.min(
          rainBarCells,
          availableRainCells
        );

  for (
    let index = 0;
    index < filledRainCells;
    index += 1
  ) {
    characters[1][
      line2TextCharacters.length + index
    ] = "BLUE";
  }

  return {
    line1,
    line2,
    line3,
    line1Colour: weather.colour,
    rainBarCells: filledRainCells,
    characters,
  };
}
