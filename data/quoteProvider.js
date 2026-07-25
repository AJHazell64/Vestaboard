import {
  canFitQuote,
  cleanQuote,
  getFallbackQuote,
} from "./quotes.js";

export async function getQuote() {
  try {
    const response = await fetch(
      "https://api.quotable.io/random"
    );

    const data = await response.json();

    const quote = cleanQuote(data.content);

    if (canFitQuote(quote)) {
      return quote;
    }

    console.log("Live quote rejected - too long");

  } catch (error) {
    console.log("Quote API unavailable");
  }

  // Keep trying fallback quotes until one fits
  for (let attempt = 0; attempt < 20; attempt++) {
    const fallback = getFallbackQuote();

    if (canFitQuote(fallback)) {
      return fallback;
    }
  }

  return "KEEP MOVING FORWARD";
}
