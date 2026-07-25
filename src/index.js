import * as teslaModule from "./tesla.js";

function getRequiredEnvironmentVariable(...names) {
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

function firstValidNumber(...values) {
  for (const value of values) {
    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}

function findTeslaFunction() {
  const teslaFunction =
    teslaModule.getTeslaData ??
    teslaModule.getTeslaAndPowerwallData ??
    teslaModule.fetchTeslaData ??
    teslaModule.default;

  if (typeof teslaFunction !== "function") {
    throw new Error(
      "Could not find the Tesla data function exported by tesla.js."
    );
  }

  return teslaFunction;
}

function formatPercentage(value) {
  if (value === null) {
    return "--%";
  }

  return `${Math.round(value)}%`;
}

function getBettyBatteryPercentage(data) {
  return firstValidNumber(
    data.lastRecordedVehicleBatteryPercentage,
    data.lastKnownVehicleBatteryPercentage,
    data.vehicleBatteryPercentage,
    data.vehicleBatteryLevel,
    data.carBatteryPercentage,
    data.carBatteryLevel,
    data.teslaBatteryPercentage,
    data.teslaBatteryLevel,
    data.batteryLevel,
    data.vehicle?.batteryPercentage,
    data.vehicle?.batteryLevel,
    data.vehicle?.chargeState?.battery_level,
    data.vehicle?.charge_state?.battery_level
  );
}

function getPowerwallPercentage(data) {
  return firstValidNumber(
    data.powerwallPercentage,
    data.powerwallBatteryPercentage,
    data.powerwallBatteryLevel,
    data.energySiteBatteryPercentage,
    data.energy?.percentageCharged,
    data.energy?.percentage_charged,
    data.liveStatus?.percentageCharged,
    data.liveStatus?.percentage_charged
  );
}

function getNetGridToday(data) {
  const existingNetValue = firstValidNumber(data.netGridTodayKwh);

  if (existingNetValue !== null) {
    return existingNetValue;
  }

  const imported = firstValidNumber(data.gridImportedTodayKwh) ?? 0;
  const exported = firstValidNumber(data.gridExportedTodayKwh) ?? 0;

  /*
   * Negative means net import.
   * Positive means net export.
   */
  return exported - imported;
}

function formatDayEnergy(netGridTodayKwh) {
  const roundedValue = Math.abs(netGridTodayKwh).toFixed(1);

  if (netGridTodayKwh > 0) {
    return `EXPORT ${roundedValue}KWH`;
  }

  return `IMPORT ${roundedValue}KWH`;
}

async function sendToVestaboard(message) {
  const readWriteKey = getRequiredEnvironmentVariable(
    "VESTABOARD_READ_WRITE_KEY",
    "VESTABOARD_API_KEY"
  );

  const apiUrl =
    process.env.VESTABOARD_API_URL ?? "https://rw.vestaboard.com/";

  console.log("Sending dashboard to Vestaboard");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Vestaboard-Read-Write-Key": readWriteKey,
    },
    body: JSON.stringify({
      text: message,
    }),
  });

  const responseText = await response.text();

  let responseData = null;

  try {
    responseData = JSON.parse(responseText);
  } catch {
    // The response was not JSON.
  }

  const isDuplicateMessage =
    responseData?.type === "FingerprintMatch" ||
    responseText.includes("FingerprintMatch") ||
    responseText.includes("currently displayed");

  if (!response.ok && !isDuplicateMessage) {
    throw new Error(`Vestaboard update failed: ${responseText}`);
  }

  if (isDuplicateMessage) {
    console.log("Vestaboard already displays this message");
    return;
  }

  console.log("Vestaboard updated successfully");
}

async function main() {
  const getTeslaData = findTeslaFunction();

  console.log("Retrieving Tesla and Powerwall data");

  const data = await getTeslaData();

  const bettyBatteryPercentage = getBettyBatteryPercentage(data);
  const powerwallPercentage = getPowerwallPercentage(data);
  const netGridTodayKwh = getNetGridToday(data);

  const lines = [
    `BETTY ${formatPercentage(bettyBatteryPercentage)}`,
    `MONSOM ${formatPercentage(powerwallPercentage)}`,
    formatDayEnergy(netGridTodayKwh),
  ];

  const dashboard = lines.join("\n");

  console.log("");
  console.log(dashboard);
  console.log("");

  await sendToVestaboard(dashboard);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
