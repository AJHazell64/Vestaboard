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

  const roundedMinute =
    Math.floor(Number(values.minute) / 5) * 5;

  return `${values.hour}:${String(
    roundedMinute
  ).padStart(2, "0")}`;
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

  const roundedProbability =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(rainProbability)
      )
    );

  if (roundedProbability === 100) {
    return 11;
  }

  return Math.floor(
    roundedProbability / 10
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

  const rainProbability =
    Number.isFinite(weather.rainProbability)
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              weather.rainProbability
            )
          )
        )
      : 0;

  const line1 =
    `${dateParts.weekday.toUpperCase()} ` +
    `${dateParts.day}${dateParts.month.toUpperCase()} ` +
    `WK${weekNumber}`;

  const line2 =
    rainProbability === 100
      ? "RAIN"
      : `${rainProbability}%RAIN`;

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
    Array(15).fill(weather.colour),
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

  const rainBarCells =
    rainProbability === 100
      ? availableRainCells
      : Math.min(
          getRainBarCells(
            rainProbability
          ),
          availableRainCells
        );

  for (
    let index = 0;
    index < rainBarCells;
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
    rainBarCells,
    characters,
  };
}
