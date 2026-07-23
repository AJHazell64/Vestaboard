const token = process.env.VESTABOARD_TOKEN;

if (!token) {
  throw new Error("VESTABOARD_TOKEN is missing");
}

function board(text) {
  return text
    .trim()
    .split("\n")
    .map(line => line.padEnd(22).substring(0, 22))
    .join("\n");
}

const now = new Date();

const time = now.toLocaleTimeString("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const message = board(`
VESTABOARD

ONLINE

${time}
`);

const response = await fetch("https://platform.vestaboard.com/subscriptions/push", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Vestaboard-Api-Key": token,
  },
  body: JSON.stringify({
    text: message,
  }),
});

const responseText = await response.text();

console.log(response.status, responseText);

if (!response.ok) {
  throw new Error(responseText);
}