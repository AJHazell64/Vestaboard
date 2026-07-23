const token = process.env.VESTABOARD_TOKEN;

if (!token) {
  throw new Error("VESTABOARD_TOKEN is missing");
}

const response = await fetch("https://cloud.vestaboard.com/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Vestaboard-Token": token,
  },
  body: JSON.stringify({
    text: "VESTABOARD\n\nCONNECTED",
    forced: true,
  }),
});

const result = await response.json();

if (!response.ok) {
  throw new Error(`Vestaboard error: ${response.status} ${JSON.stringify(result)}`);
}

console.log("Message sent successfully:", result);
