import { writeFileSync } from "node:fs";
import {
  refreshTeslaTokens,
  getTeslaDashboardData,
} from "./tesla.js";

const vestaboardToken = process.env.VESTABOARD_TOKEN;

if (!vestaboardToken) {
  throw new Error("VESTABOARD_TOKEN is missing");
}

function formatPower(watts) {
  if (watts == null || Number.isNaN(Number(watts))) {
    return "--";
  }

  return `${Math.abs(Number(watts) / 1000).toFixed(1)}KW`;
}

function fitLine(text) {
  return String(text).toUpperCase().slice(0, 22);
}

const now = new Date();

const day = now
  .toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
  })
  .toUpperCase();

const time = now.toLocaleTimeString("en-GB", {
  timeZone: "Europe/London",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

console.log("Refreshing Tesla access token");

const tokens = await refreshTeslaTokens();

/*
 * Tesla may return a replacement refresh token.
 * Save it temporarily so the GitHub workflow can update
 * the TESLA_REFRESH_TOKEN repository secret.
 */
if (tokens.refreshToken) {
  writeFileSync("tesla-refresh-token.txt", tokens.refreshToken, {
    encoding: "utf8",
    mode: 0o600,
  });

  console.log("Replacement Tesla refresh token saved securely");
}

console.log("Retrieving Tesla and Powerwall data");

const dashboard = await getTeslaDashboardData(tokens.accessToken);

const lines = [];

if (!dashboard.vehicle) {
  lines.push("TESLA UNAVAILABLE");
} else if (dashboard.vehicle.sleeping) {
  lines.push(`${dashboard.vehicle.name} SLEEPING`);
} else {
  const battery =
    dashboard.vehicle.batteryLevel == null
      ? "--"
      : `${dashboard.vehicle.batteryLevel}%`;

  lines.push(`${dashboard.vehicle.name} ${battery}`);

  if (dashboard.vehicle.chargingState === "Charging") {
    lines.push("CAR CHARGING");
  } else if (dashboard.vehicle.rangeMiles != null) {
    lines.push(`RANGE ${dashboard.vehicle.rangeMiles} MI`);
  }
}

if (dashboard.energy) {
  const powerwall =
    dashboard.energy.batteryPercent == null
      ? "--"
      : `${dashboard.energy.batteryPercent}%`;

  lines.push(`POWERWALL ${powerwall}`);
  lines.push(`HOME ${formatPower(dashboard.energy.homePowerWatts)}`);
  lines.push(`SOLAR ${formatPower(dashboard.energy.solarPowerWatts)}`);

  const gridPower = Number(dashboard.energy.gridPowerWatts);

  if (Number.isFinite(gridPower)) {
    const direction = gridPower >= 0 ? "GRID IN" : "GRID OUT";
    lines.push(`${direction} ${formatPower(gridPower)}`);
  } else {
    lines.push("GRID --");
  }
} else {
  lines.push("POWERWALL OFFLINE");
}

lines.push(`${day} ${time}`);

/*
 * Vestaboard has six rows.
 * Keep the most useful six lines and limit each to 22 characters.
 */
const message = lines
  .slice(0, 6)
  .map(fitLine)
  .join("\n");

console.log("Sending dashboard to Vestaboard");

const response = await fetch("https://cloud.vestaboard.com/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Vestaboard-Token": vestaboardToken,
  },
  body: JSON.stringify({
    text: message,
  }),
});

const responseText = await response.text();

if (!response.ok) {
  throw new Error(`Vestaboard update failed: ${responseText}`);
}

console.log("Vestaboard updated successfully");
