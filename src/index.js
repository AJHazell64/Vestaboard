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
  }),
});

const responseText = await response.text();

console.log("Vestaboard response:", response.status, responseText);

if (!response.ok) {
  throw new Error(
    `Vestaboard request failed: ${response.status} ${responseText}`
  );
}

console.log("Message sent successfully");
