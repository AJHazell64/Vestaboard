import { getFallbackQuote } from "./quotes.js";

export async function getQuote() {
  return getFallbackQuote();
}
