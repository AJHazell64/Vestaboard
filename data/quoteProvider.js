import {
  canFitQuote,
  cleanQuote,
  getFallbackQuote,
} from "./quotes.js";

export async function getQuote() {

  // Try live quotes 3 times
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(
        "https://zenquotes.io/api/random"
      );

      const data = await response.json();

      const quote = cleanQuote(data[0].q);

      if (canFitQuote(quote)) {
        return quote;
      }

      console.log(
        `Live quote rejected - too long (attempt ${attempt + 1})`
      );

    } catch (error) {
      console.log(
        `Live quote unavailable (attempt ${attempt + 1})`
      );
    }
  }

  // Only use fallback if all live attempts fail
  console.log("Using fallback quote");

  return getFallbackQuote();
}
