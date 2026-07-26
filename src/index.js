import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import {
  refreshTeslaTokens,
  getTeslaDashboardData,
} from "./tesla.js";
import {
  artwork,
  addContent,
  createGrid,
  addTime,
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
  } catch {
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
  runGitHubCommand([
    "variable",
    "set",
    "LAST_DAY_ARTWORK",
    "--body",
    artworkData,
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

  // Night: 23:30 - 07:00
  if (totalMinutes >= 23 * 60 + 30 || totalMinutes < 7 * 60) {
    return "night";
  }

  // Morning: 07:00 - 09:00
  if (totalMinutes < 9 * 60) {
    return "morning";
  }

  // Day: 09:00 - 21:00
  if (totalMinutes < 21 * 60) {
    return "day_artwork";
  }

  // Evening: 21:00 - 23:30
  return "evening";
}
async function main() {
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

  const dashboard =
    await getTeslaDashboardData(
      tokens.accessToken
    );
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

  const monsomPercentage =
    dashboard.energy?.batteryPercent;

  const netGridTodayKwh =
    dashboard.energy?.netGridTodayKwh;

let lines;
  let characterCodes;

if (displayMode === "night") {
  const savedNightArtwork = getSavedNightArtwork();
  const savedNightDate = getSavedNightDate();

  const today = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("/")
    .reverse()
    .join("-");

if (savedNightArtwork && savedNightDate === today) {
  characterCodes = JSON.parse(savedNightArtwork);
} else {
  const nightArtwork = addTime(
    generateNightArtwork()
  );
  characterCodes = compilePattern(nightArtwork);
  saveNightArtwork(JSON.stringify(characterCodes));
  saveNightDate(today);
}
}
else if (displayMode === "day_artwork") {

const savedDayArtwork = getSavedDayArtwork();

let dayArtwork = savedDayArtwork
  ? JSON.parse(savedDayArtwork)
  : null;

const currentHour = new Date().getHours();
const currentMinute = new Date().getMinutes();
  

if (
  !dayArtwork ||
  dayArtwork.hour !== currentHour ||
 currentMinute < 15 && (!dayArtwork || dayArtwork.hour !== currentHour)
) {
  const selectedArtwork =
    artwork[Math.floor(Math.random() * artwork.length)];

dayArtwork = {
  hour: currentHour,
  minute: currentMinute,
  characters: selectedArtwork.characters,
};

saveDayArtwork(JSON.stringify(dayArtwork));
}

characterCodes = compilePattern(addTime(dayArtwork.characters));

} else {
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

await sendToVestaboard(payload);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
