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
  } catch (error) {
    console.log("Quote API unavailable");
  }

  return getFallbackQuote();
}
