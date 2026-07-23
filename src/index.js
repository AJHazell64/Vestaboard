const token = process.env.VESTABOARD_TOKEN;

if (!token) {
  throw new Error("VESTABOARD_TOKEN is missing");
}

const now = new Date();

const time = now.toLocaleTimeString("en-GB", {
  timeZone: "Europe/London",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// Temporary values
const day = now.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
const soc = 82;

const message = `${day}

SOC ${soc}%

${time}`;

const response = await fetch("https://cloud.vestaboard.com/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Vestaboard-Token": token,
  },
  body: JSON.stringify({
    text: message,
  }),
});

const responseText = await response.text();

if (!response.ok) {
  throw new Error(responseText);
}

console.log("Vestaboard updated");