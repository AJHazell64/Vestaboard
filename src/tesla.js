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
     * Option A:
     * Only request vehicle_data when the car is already online.
     * This code never calls wake_up.
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

        dashboard.vehicle.batteryLevel = chargeState.battery_level ?? null;
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
      console.warn(`Powerwall data unavailable: ${error.message}`);
    }
  }

  return dashboard;
}
