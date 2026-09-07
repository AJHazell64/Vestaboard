import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import {
  refreshTeslaTokens,
  getTeslaDashboardData,
} from "./tesla.js";
import {
  getMorningWeather,
  getMorningWeatherColour,
} from "./weather.js";
import { createMorningDisplay } from "./morningDisplay.js";
import {
  artwork,
  addContent,
  createGrid,
  addTime,
  addDayComplete,
  getCurrentTimeCharacters,
  generateNightArtwork,
} from "../data/artwork.js";
import { compilePattern } from "./artworkCompiler.js";
import { getQuote } from "../data/quoteProvider.js";
function requireEnvironmentVariable(...names) {
  for (const name of names) {
    const value = process.env[name];

    if (value) {
      return value;
    }
  }

  throw new Error(
    `Missing required environment variable. Expected one of: ${names.join(", ")}`
  );
}

function getGitHubToken() {
  return (
    process.env.GH_PAT ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN ||
    null
  );
}

function runGitHubCommand(argumentsList) {
  const token = getGitHubToken();
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token || !repository) {
    return null;
  }

  try {
    return execFileSync(
      "gh",
      [...argumentsList, "--repo", repository],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          GH_TOKEN: token,
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    ).trim();
  } catch (error) {
    console.error(
      `GitHub command failed: ${error.stderr?.toString() || error.message}`
    );
    return null;
  }
}

function saveReplacementTeslaRefreshToken(refreshToken) {
  if (!refreshToken) {
    return;
  }

  const token = getGitHubToken();
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token || !repository) {
    console.warn(
      "Replacement Tesla refresh token was returned, but GitHub authentication is unavailable"
    );
    return;
  }

  try {
    execFileSync(
      "gh",
      [
        "secret",
        "set",
        "TESLA_REFRESH_TOKEN",
        "--body",
        refreshToken,
        "--repo",
        repository,
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          GH_TOKEN: token,
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    console.log(
      "Replacement Tesla refresh token saved securely"
    );
  } catch (error) {
    console.warn(
      `Unable to save replacement Tesla refresh token: ${error.message}`
    );
  }
}

function getSavedBettyRangeMiles() {
  const environmentValue =
    process.env.LAST_BETTY_RANGE_MILES;

  if (
    environmentValue !== undefined &&
    environmentValue !== ""
  ) {
    const range = Number(environmentValue);

    if (Number.isFinite(range) && range >= 0) {
      return range;
    }
  }

  const storedValue = runGitHubCommand([
    "variable",
    "get",
    "LAST_BETTY_RANGE_MILES",
  ]);

  if (storedValue === null || storedValue === "") {
    return null;
  }

  const range = Number(storedValue);

  if (Number.isFinite(range) && range >= 0) {
    return range;
  }

  return null;
}
const nightArtworkFile = "./data/nightArtwork.json";

function loadNightArtworkFile() {
  if (!existsSync(nightArtworkFile)) {
    return null;
  }

  return readFileSync(nightArtworkFile, "utf8");
}
function saveNightArtworkFile(artworkData) {
  writeFileSync(
    nightArtworkFile,
    artworkData,
    "utf8"
  );
}
function saveNightArtwork(artworkData) {
  saveNightArtworkFile(artworkData);

  const token = getGitHubToken();
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token || !repository) {
    return;
  }

  try {
    execFileSync(
      "gh",
      [
        "variable",
        "set",
        "LAST_NIGHT_ARTWORK",
        "--body",
        artworkData,
        "--repo",
        repository,
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          GH_TOKEN: token,
        },
      }
    );
  } catch (error) {
    console.warn(`Unable to save night artwork: ${error.message}`);
  }
}

function getSavedNightArtwork() {
  const storedValue = runGitHubCommand([
    "variable",
    "get",
    "LAST_NIGHT_ARTWORK",
  ]);

  return storedValue || null;
}

function getSavedDayArtwork() {
  const storedValue = runGitHubCommand([
    "variable",
    "get",
    "LAST_DAY_ARTWORK",
  ]);

  return storedValue || null;
}


function saveDayArtwork(artworkData) {
  const result = runGitHubCommand([
    "variable",
    "set",
    "LAST_DAY_ARTWORK",
    "--body",
    artworkData,
  ]);
}
function getSavedDayQuote() {
  const storedValue = runGitHubCommand([
    "variable",
    "get",
    "LAST_DAY_QUOTE",
  ]);

  return storedValue || null;
}

function saveDayQuote(quoteData) {
  runGitHubCommand([
    "variable",
    "set",
    "LAST_DAY_QUOTE",
    "--body",
    quoteData,
  ]);
}
function getSavedQuoteQueue() {
  const storedValue = runGitHubCommand([
    "variable",
    "get",
    "QUOTE_QUEUE",
  ]);

  return storedValue || "[]";
}

function saveQuoteQueue(queue) {
  runGitHubCommand([
    "variable",
    "set",
    "QUOTE_QUEUE",
    "--body",
    JSON.stringify(queue),
  ]);
}

function getSavedNightDate() {
  const storedValue = runGitHubCommand([
    "variable",
    "get",
    "LAST_NIGHT_DATE",
  ]);

  return storedValue || null;
}

function saveNightDate(date) {
  const token = getGitHubToken();
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token || !repository) {
    return;
  }

  runGitHubCommand([
    "variable",
    "set",
    "LAST_NIGHT_DATE",
    "--body",
    date,
    "--repo",
    repository,
  ]);
  }



function saveBettyRangeMiles(rangeMiles) {
  if (
    !Number.isFinite(rangeMiles) ||
    rangeMiles < 0
  ) {
    return;
  }

  const token = getGitHubToken();
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token || !repository) {
    console.warn(
      "Unable to save Betty's latest range"
    );
    return;
  }

  try {
    execFileSync(
      "gh",
      [
        "variable",
        "set",
        "LAST_BETTY_RANGE_MILES",
        "--body",
        String(Math.round(rangeMiles)),
        "--repo",
        repository,
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          GH_TOKEN: token,
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    console.log(
      `Saved Betty's range: ${Math.round(
        rangeMiles
      )} miles`
    );
  } catch (error) {
    console.warn(
      `Unable to save Betty's range: ${error.message}`
    );
  }
}
function getCurrentTeslaFetchHour() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}-${values.hour}`;
}

function getSavedTeslaFetchHour() {
  return (
    runGitHubCommand([
      "variable",
      "get",
      "LAST_TESLA_FETCH_HOUR",
    ]) || null
  );
}

function saveTeslaFetchHour(hour) {
  runGitHubCommand([
    "variable",
    "set",
    "LAST_TESLA_FETCH_HOUR",
    "--body",
    hour,
  ]);
}

function getSavedTeslaDashboard() {
  const storedValue = runGitHubCommand([
    "variable",
    "get",
    "LAST_TESLA_DASHBOARD",
  ]);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    console.warn(
      `Unable to read saved Tesla dashboard: ${error.message}`
    );
    return null;
  }
}

function saveTeslaDashboard(dashboard) {
  runGitHubCommand([
    "variable",
    "set",
    "LAST_TESLA_DASHBOARD",
    "--body",
    JSON.stringify(dashboard),
  ]);
}
function formatBettyRange(rangeMiles) {
  if (!Number.isFinite(rangeMiles)) {
    return "BETTY --MI";
  }

  return `BETTY ${Math.round(rangeMiles)}MI`;
}

function formatPercentage(value) {
  if (!Number.isFinite(value)) {
    return "--%";
  }

  return `${Math.round(value)}%`;
}

function formatDailyNetEnergy(netKwh) {
  if (!Number.isFinite(netKwh)) {
    return "IMPORT --KWH";
  }

  const amount = Math.abs(netKwh).toFixed(1);

  if (netKwh > 0) {
    return `EXPORT ${amount}KWH`;
  }

  return `IMPORT ${amount}KWH`;
}

async function sendToVestaboard(message) {
  const readWriteKey =
    requireEnvironmentVariable(
      "VESTABOARD_TOKEN"
    );

  const apiUrl =
    process.env.VESTABOARD_API_URL ||
    "https://rw.vestaboard.com/";

  console.log(
    "Sending dashboard to Vestaboard"
  );

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Vestaboard-Read-Write-Key":
        readWriteKey,
    },
  body: JSON.stringify(
  Array.isArray(message)
    ? { characters: message }
    : { text: message }
),
  });

  const responseText =
    await response.text();

  const duplicateMessage =
    responseText.includes(
      "FingerprintMatch"
    ) ||
    responseText.includes(
      "currently displayed"
    );

  if (!response.ok && !duplicateMessage) {
    throw new Error(
      `Vestaboard update failed: ${responseText}`
    );
  }

  if (duplicateMessage) {
    console.log(
      "Vestaboard already displays this message"
    );
    return;
  }

  console.log(
    "Vestaboard updated successfully"
  );
}

function getUkTimeParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(
    parts.find((part) => part.type === "hour")?.value
  );

  const minute = Number(
    parts.find((part) => part.type === "minute")?.value
  );

  return {
    hour,
    minute,
    totalMinutes: hour * 60 + minute,
  };
}

function getDisplayMode() {
  const { totalMinutes } = getUkTimeParts();

  // Night / quiet period: 22:30 - 08:00
  if (
    totalMinutes >= 22 * 60 + 30 ||
    totalMinutes < 8 * 60
  ) {
    return "night";
  }

  // Morning: 08:00 - 09:00
  if (totalMinutes < 9 * 60) {
    return "morning";
  }

  // Day: 09:00 - 21:00
  if (totalMinutes < 21 * 60) {
    return "day_artwork";
  }

  // Evening: 21:00 - 22:30
  return "evening";
}
function getNightDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  const date = new Date(
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day)
    )
  );

  if (Number(values.hour) < 7) {
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return date.toISOString().slice(0, 10);
}

function getDaysAlive() {
  const birth = new Date("1989-06-21T22:24:00+01:00");

  return Math.floor(
    (Date.now() - birth.getTime()) /
      (24 * 60 * 60 * 1000)
  );
}
async function main() {

let weather;

try {
  weather = await getMorningWeather();
} catch (error) {
  console.error(
    "Weather retrieval failed - using safe fallback:",
    error.message
  );

  weather = {
    currentTemperature: 0,
    dailyHigh: 0,
    rainProbability: 0,
    weatherCode: 0,
  };
}

const morningWeatherColour =
  getMorningWeatherColour(
    weather.dailyHigh,
    weather.rainProbability,
    weather.weatherCode
  );

console.log("Morning weather:", weather);
console.log(
  "Morning weather colour:",
  morningWeatherColour
);

  
let dashboard = getSavedTeslaDashboard();

const currentTeslaFetchHour =
  getCurrentTeslaFetchHour();

const lastTeslaFetchHour =
  getSavedTeslaFetchHour();

const shouldFetchTesla =
  !dashboard ||
  lastTeslaFetchHour !== currentTeslaFetchHour;

if (shouldFetchTesla) {
  console.log(
    "Tesla data is due for refresh"
  );

  try {
    console.log(
      "Refreshing Tesla access token"
    );

    const tokens =
      await refreshTeslaTokens();

    if (
      tokens.refreshToken &&
      tokens.refreshToken !==
        process.env.TESLA_REFRESH_TOKEN
    ) {
      saveReplacementTeslaRefreshToken(
        tokens.refreshToken
      );
    }

    console.log(
      "Retrieving Tesla and Powerwall data"
    );

    const liveDashboard =
      await getTeslaDashboardData(
        tokens.accessToken
      );

    dashboard = liveDashboard;

    saveTeslaDashboard(dashboard);
    saveTeslaFetchHour(
      currentTeslaFetchHour
    );

    console.log(
      "Tesla dashboard cache updated"
    );
  } catch (error) {
    console.error(
      "Tesla refresh failed - using last known dashboard:",
      error.message
    );
  }
} else {
  console.log(
    "Using cached Tesla dashboard - live Tesla fetch not required"
  );
}

if (!dashboard) {
  console.warn(
    "No cached Tesla dashboard available - using safe fallback"
  );

  dashboard = {
    vehicle: null,
    energy: null,
  };
}

const displayMode = getDisplayMode();

console.log(`Display mode: ${displayMode}`);
  const currentRange =
    dashboard.vehicle?.rangeMiles;

  let bettyRangeMiles;

  if (
    currentRange !== null &&
    currentRange !== undefined &&
    Number.isFinite(Number(currentRange))
  ) {
    bettyRangeMiles = Number(currentRange);

    saveBettyRangeMiles(
      bettyRangeMiles
    );
  } else {
    bettyRangeMiles =
      getSavedBettyRangeMiles();
  }
  const morningDisplay = createMorningDisplay(
    {
      ...weather,
      colour: morningWeatherColour,
    },
    bettyRangeMiles
  );

  console.log("Morning display:", morningDisplay);
  const monsomPercentage =
    dashboard.energy?.batteryPercent;

  const netGridTodayKwh =
    dashboard.energy?.netGridTodayKwh;

let lines;
  let characterCodes;

if (displayMode === "night") {

  const savedNightArtwork = getSavedNightArtwork();
  const savedNightDate = getSavedNightDate();
  const nightDate = getNightDate();

  let nightArtworkData = savedNightArtwork
    ? JSON.parse(savedNightArtwork)
    : null;

  if (
    !nightArtworkData ||
    savedNightDate !== nightDate ||
    !nightArtworkData.rawCharacters
  ) {
    nightArtworkData = {
      rawCharacters: generateNightArtwork(),
    };

    saveNightArtwork(
      JSON.stringify(nightArtworkData)
    );

    saveNightDate(nightDate);
  }

const nightDisplay = addDayComplete(
  nightArtworkData.rawCharacters,
  getDaysAlive()
);

  characterCodes = compilePattern(
    nightDisplay
  );
}
else if (displayMode === "morning") {
  characterCodes = compilePattern(
    morningDisplay.characters
  );
}
else if (displayMode === "day_artwork") {
  const { hour: currentHour, minute: currentMinute } =
    getUkTimeParts();

  const savedDayArtwork = getSavedDayArtwork();

  let dayArtwork = savedDayArtwork
    ? JSON.parse(savedDayArtwork)
    : null;

  if (
    !dayArtwork ||
    dayArtwork.hour !== currentHour ||
    !dayArtwork.rawCharacters
  ) {
    const selectedArtwork =
      artwork[Math.floor(Math.random() * artwork.length)];

    dayArtwork = {
      hour: currentHour,
      minute: currentMinute,
      rawCharacters: selectedArtwork.rawCharacters,
      characters: selectedArtwork.characters,
    };

    saveDayArtwork(JSON.stringify(dayArtwork));
  }

  const savedQuoteData = getSavedDayQuote();

  let quoteData = savedQuoteData
    ? JSON.parse(savedQuoteData)
    : null;

  if (
    !quoteData ||
    quoteData.hour !== currentHour
  ) {
    let quoteQueue;

    try {
      quoteQueue = JSON.parse(
        getSavedQuoteQueue()
      );
    } catch {
      quoteQueue = [];
    }

    const quoteResult =
      await getQuote(quoteQueue);

    quoteData = {
      hour: currentHour,
      quote: quoteResult.quote,
    };

    saveQuoteQueue(quoteResult.queue);
    saveDayQuote(JSON.stringify(quoteData));
  }

    characterCodes = compilePattern(
    addTime(
      addContent(
        dayArtwork.rawCharacters,
        quoteData.quote
      )
    )
  );
}

else {
  const dashboardGrid = createGrid();

  const dashboardLines = [
    formatDailyNetEnergy(
      netGridTodayKwh === null
        ? null
        : Number(netGridTodayKwh)
    ),
    `MONSOM ${formatPercentage(
      monsomPercentage === null
        ? null
        : Number(monsomPercentage)
    )}`,
    formatBettyRange(bettyRangeMiles).replace(
      "BETTY",
      "TES"
    ),
  ];

let updatedGrid = dashboardGrid;

dashboardLines.forEach((line, index) => {
const characters = line
  .toUpperCase()
  .split("")
  .map((character) =>
    character === " " ? "BLANK" : character
  );

  updatedGrid[index].splice(
    0,
    characters.length,
    ...characters
  );
});
characterCodes = compilePattern(
  addTime(updatedGrid)
);
}

const payload = characterCodes ?? lines.join("\n");

console.log("");
console.log(payload);
console.log("");

const { totalMinutes } = getUkTimeParts();

const isQuietNight =
  totalMinutes >= 22 * 60 + 35 ||
  totalMinutes < 8 * 60;

if (isQuietNight) {
  console.log(
    "Quiet night period - Vestaboard update suppressed"
  );
  return;
}

await sendToVestaboard(payload);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
