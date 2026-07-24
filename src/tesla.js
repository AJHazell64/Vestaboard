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

function getLondonDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function getTodayEnergyHistory(accessToken, siteId) {
  const londonDate = getLondonDate();

  const parameters = new URLSearchParams({
    kind: "energy",
    start_date: `${londonDate}T00:00:00`,
    end_date: `${londonDate}T23:59:59`,
    period: "day",
    time_zone: "Europe/London",
  });

  return teslaGet(
    accessToken,
    `/api/1/energy_sites/${encodeURIComponent(
      siteId
    )}/calendar_history?${parameters.toString()}`
  );
}

export async function getTeslaDashboardData(accessToken) {
  const productsData = await teslaGet(accessToken, "/api/1/products");
  const products = productsData.response ?? [];

  const vehicleProduct = products.find((product) => product.vin);

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

    /*
     * Only request vehicle_data when the car is already online.
     * This code never wakes the car.
     */
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
          chargeState.battery_range == null
            ? null
            : Math.round(chargeState.battery_range);
      } catch (error) {
        console.warn(`Vehicle data unavailable: ${error.message}`);
        dashboard.vehicle.sleeping = true;
      }
    }
  }

  if (energyProduct?.energy_site_id) {
    const siteId = energyProduct.energy_site_id;

    try {
      const liveStatusData = await teslaGet(
        accessToken,
        `/api/1/energy_sites/${encodeURIComponent(siteId)}/live_status`
      );

      const status = liveStatusData.response ?? {};

      dashboard.energy = {
        siteId,
        batteryPercent:
          status.percentage_charged == null
            ? null
            : Math.round(status.percentage_charged),
        batteryPowerWatts: status.battery_power ?? null,
        solarPowerWatts: status.solar_power ?? null,
        homePowerWatts: status.load_power ?? null,
        gridPowerWatts: status.grid_power ?? null,
        gridStatus: status.grid_status ?? null,
      };
    } catch (error) {
      console.warn(`Powerwall live data unavailable: ${error.message}`);
    }

    /*
     * Temporary diagnostic request.
     * This prints the exact energy-history fields returned by your Powerwall.
     */
    try {
      const energyHistory = await getTodayEnergyHistory(
        accessToken,
        siteId
      );

      console.log("TESLA ENERGY HISTORY START");
      console.log(JSON.stringify(energyHistory, null, 2));
      console.log("TESLA ENERGY HISTORY END");
    } catch (error) {
      console.warn(`Energy history unavailable: ${error.message}`);
    }
  }

  return dashboard;
}
