const token = process.env.VESTABOARD_TOKEN;

if (!token) {
  throw new Error("VESTABOARD_TOKEN is missing");
}

export async function sendToVestaboard(text) {
  const response = await fetch("https://cloud.vestaboard.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Vestaboard-Token": token,
    },
    body: JSON.stringify({
      text,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText);
  }

  console.log("Vestaboard updated");
}