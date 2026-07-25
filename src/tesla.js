const TESLA_AUTH_URL =
  "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";

const TESLA_API_URL =
  "https://fleet-api.prd.eu.vn.cloud.tesla.com";

function requireEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing`);
  }

  return value;
}

async function readJson(response, description) {
  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${description} returned invalid JSON: ${text}`);
  }

  if (!response.ok) {
    const message =
      data.error_description ||
      data.error ||
      `${response.status} ${response.statusText}`;

    throw new Error(`${description} failed: ${message}`);
  }

  return data;
}

export async function refreshTeslaTokens() {
  const clientId = requireEnvironmentVariable("TESLA_CLIENT_ID");
  const refreshToken = requireEnvironmentVariable("TESLA_REFRESH_TOKEN");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });

  const response = await fetch(TESLA_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await readJson(response, "Tesla token refresh");

  if (!data.access_token) {
    throw new Error("Tesla did not return an access token");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

async function teslaGet(accessToken, path) {
  const response = await fetch(`${TESLA_API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return readJson(response, `Tesla request to ${path}`);
}

function getLondonDateParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
  };
}

function getLondonUtcOffset() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    timeZoneName: "longOffset",
  }).formatToParts(new Date());

  const timeZoneName =
    parts.find((part) => part.type === "timeZoneName")?.value || "GMT";

  if (timeZoneName === "GMT") {
    return "+00:00";
  }

  const match = timeZoneName.match(
    /GMT([+-])(\d{1,2})(?::(\d{2}))?/
  );

  if (!match) {
    throw new Error(
      `Unable to determine Europe/London UTC offset: ${timeZoneName}`
    );
  }

  const sign = match[1];
  const hours = match[2].padStart(2, "0");
  const minutes = (match[3] || "00").padStart(2, "0");

  return `${sign}${hours}:${minutes}`;
}

function getTodayEnergyHistoryPath(siteId) {
  const { year, month, day } = getLondonDateParts();
  const offset = getLondonUtcOffset();
  const date = `${year}-${month}-${day}`;

  const parameters = new URLSearchParams({
    kind: "energy",
    start_date: `${date}T00:00:00${offset}`,
    end_date: `${date}T23:59:59${offset}`,
    period: "day",
    time_zone: "Europe/London",
  });

  return `/api/1/energy_sites/${encodeURIComponent(
    siteId
  )}/calendar_history?${parameters.toString()}`;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function calculateTodayGridEnergy(historyData) {
  const timeSeries = historyData?.response?.time_series;

  if (!Array.isArray(timeSeries) || timeSeries.length === 0) {
    return {
      importedKwh: null,
      exportedKwh: null,
      netKwh: null,
    };
  }

  let importedWh = 0;
  let exportedWh = 0;

  for (const entry of timeSeries) {
    importedWh += numberOrZero(entry.grid_energy_imported);

    exportedWh +=
      numberOrZero(entry.grid_energy_exported_from_solar) +
      numberOrZero(entry.grid_energy_exported_from_generator) +
      numberOrZero(entry.grid_energy_exported_from_battery) +
      numberOrZero(entry.grid_services_energy_exported);
  }

  const importedKwh = importedWh / 1000;
  const exportedKwh = exportedWh / 1000;

  return {
    importedKwh,
    exportedKwh,
    netKwh: exportedKwh - importedKwh,
  };
}

export async function getTeslaDashboardData(accessToken) {
  const productsData = await teslaGet(
    accessToken,
    "/api/1/products"
  );

  const products = productsData.response ?? [];

  const vehicleProduct = products.find(
    (product) => product.vin
  );

  const energyProduct = products.find(
    (product) => product.resource_type === "battery"
  );

  const dashboard = {
    vehicle: null,
    energy: null,
  };

  if (vehicleProduct) {
    dashboard.vehicle = {
      id: vehicleProduct.id,
      vin: vehicleProduct.vin,
      name: vehicleProduct.display_name || "TESLA",
      state: vehicleProduct.state || "unknown",
      sleeping: vehicleProduct.state !== "online",
      batteryLevel: null,
      chargingState: null,
      rangeMiles: null,
    };

    if (vehicleProduct.state === "online") {
      try {
        const vehicleData = await teslaGet(
          accessToken,
          `/api/1/vehicles/${encodeURIComponent(
            vehicleProduct.id
          )}/vehicle_data`
        );

        const vehicle = vehicleData.response ?? {};
        const chargeState = vehicle.charge_state ?? {};

        dashboard.vehicle.batteryLevel =
          chargeState.battery_level ?? null;

        dashboard.vehicle.chargingState =
          chargeState.charging_state ?? "Unknown";

dashboard.vehicle.rangeMiles =
  chargeState.est_battery_range == null
    ? null
    : Math.round(chargeState.est_battery_range);
      } catch (error) {
        console.warn(
          `Vehicle data unavailable: ${error.message}`
        );

        dashboard.vehicle.sleeping = true;
      }
    }
  }

  if (energyProduct?.energy_site_id) {
    const siteId = energyProduct.energy_site_id;

    dashboard.energy = {
      siteId,
      batteryPercent: null,
      batteryPowerWatts: null,
      solarPowerWatts: null,
      homePowerWatts: null,
      gridPowerWatts: null,
      gridStatus: null,
      gridImportedTodayKwh: null,
      gridExportedTodayKwh: null,
      netGridTodayKwh: null,
    };

    try {
      const liveStatusData = await teslaGet(
        accessToken,
        `/api/1/energy_sites/${encodeURIComponent(
          siteId
        )}/live_status`
      );

      const status = liveStatusData.response ?? {};

      dashboard.energy.batteryPercent =
        status.percentage_charged == null
          ? null
          : Math.round(status.percentage_charged);

      dashboard.energy.batteryPowerWatts =
        status.battery_power ?? null;

      dashboard.energy.solarPowerWatts =
        status.solar_power ?? null;

      dashboard.energy.homePowerWatts =
        status.load_power ?? null;

      dashboard.energy.gridPowerWatts =
        status.grid_power ?? null;

      dashboard.energy.gridStatus =
        status.grid_status ?? null;
    } catch (error) {
      console.warn(
        `Powerwall live data unavailable: ${error.message}`
      );
    }

    try {
      const energyHistory = await teslaGet(
        accessToken,
        getTodayEnergyHistoryPath(siteId)
      );

      const totals =
        calculateTodayGridEnergy(energyHistory);

      dashboard.energy.gridImportedTodayKwh =
        totals.importedKwh;

      dashboard.energy.gridExportedTodayKwh =
        totals.exportedKwh;

      dashboard.energy.netGridTodayKwh =
        totals.netKwh;

      console.log(
        `Today: imported ${totals.importedKwh?.toFixed(
          3
        )} kWh, exported ${totals.exportedKwh?.toFixed(
          3
        )} kWh, net ${totals.netKwh?.toFixed(3)} kWh`
      );
    } catch (error) {
      console.warn(
        `Energy history unavailable: ${error.message}`
      );
    }
  }

  return dashboard;
}
