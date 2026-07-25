import { execFileSync } from "node:child_process";
import {
  refreshTeslaTokens,
  getTeslaDashboardData,
} from "./tesla.js";

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

function runGitHubCommand(argumentsList) {
  const token =
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN;

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

  const token =
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN;

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
      `Unable to save replacement Tesla refresh token: ${
        error.message
      }`
    );
  }
}

function getSavedBettyBatteryPercentage() {
  const environmentValue = Number(
    process.env.LAST_BETTY_BATTERY
  );

  if (
    Number.isFinite(environmentValue) &&
    environmentValue >= 0
  ) {
    return environmentValue;
  }

  const storedValue = runGitHubCommand([
    "variable",
    "get",
    "LAST_BETTY_BATTERY",
  ]);

  const percentage = Number(storedValue);

  if (
    Number.isFinite(percentage) &&
    percentage >= 0
  ) {
    return percentage;
  }

  return null;
}

function saveBettyBatteryPercentage(percentage) {
  if (
    !Number.isFinite(percentage) ||
    percentage < 0
  ) {
    return;
  }

  const token =
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN;

  const repository = process.env.GITHUB_REPOSITORY;

  if (!token || !repository) {
    console.warn(
      "Unable to save Betty's latest battery percentage"
    );
    return;
  }

  try {
    execFileSync(
      "gh",
      [
        "variable",
        "set",
        "LAST_BETTY_BATTERY",
        "--body",
        String(Math.round(percentage)),
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
      `Saved Betty's battery percentage: ${Math.round(
        percentage
      )}%`
    );
  } catch (error) {
    console.warn(
      `Unable to save Betty's battery percentage: ${
        error.message
      }`
    );
  }
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
  const readWriteKey = requireEnvironmentVariable(
    "VESTABOARD_TOKEN"
  );

  const apiUrl =
    process.env.VESTABOARD_API_URL ||
    "https://rw.vestaboard.com/";

  console.log("Sending dashboard to Vestaboard");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Vestaboard-Read-Write-Key":
        readWriteKey,
    },
    body: JSON.stringify({
      text: message,
    }),
  });

  const responseText = await response.text();

  const duplicateMessage =
    responseText.includes("FingerprintMatch") ||
    responseText.includes("currently displayed");

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

  console.log("Vestaboard updated successfully");
}

async function main() {
  console.log("Refreshing Tesla access token");

  const tokens = await refreshTeslaTokens();

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

  const currentBettyBattery =
    Number(dashboard.vehicle?.batteryLevel);

  let bettyBatteryPercentage;

  if (
    Number.isFinite(currentBettyBattery) &&
    dashboard.vehicle?.batteryLevel !== null
  ) {
    bettyBatteryPercentage =
      currentBettyBattery;

    saveBettyBatteryPercentage(
      currentBettyBattery
    );
  } else {
    bettyBatteryPercentage =
      getSavedBettyBatteryPercentage();
  }

  const monsomBatteryPercentage =
    Number(
      dashboard.energy?.batteryPercent
    );

  const netGridTodayKwh =
    Number(
      dashboard.energy?.netGridTodayKwh
    );

  const lines = [
    `BETTY ${formatPercentage(
      bettyBatteryPercentage
    )}`,
    `MONSOM ${formatPercentage(
      dashboard.energy?.batteryPercent === null
        ? null
        : monsomBatteryPercentage
    )}`,
    formatDailyNetEnergy(
      dashboard.energy?.netGridTodayKwh === null
        ? null
        : netGridTodayKwh
    ),
  ];

  const message = lines.join("\n");

  console.log("");
  console.log(message);
  console.log("");

  await sendToVestaboard(message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
