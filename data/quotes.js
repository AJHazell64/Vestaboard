import { MOTIVATIONAL_QUOTES } from "./quotes-motivational.js";
import { FUNNY_QUOTES } from "./quotes-funny.js";
import { FACT_QUOTES } from "./quotes-facts.js";

export const FALLBACK_QUOTES = [
  ...MOTIVATIONAL_QUOTES,
  ...FUNNY_QUOTES,
  ...FACT_QUOTES,
];

export function cleanQuote(text) {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function canFitQuote(text) {
  const words = cleanQuote(text).split(" ");

  const rows = ["", "", ""];
  const limits = [15, 9, 9];

  let row = 0;

  for (const word of words) {
    if (row > 2) {
      return false;
    }

    const testLine =
      rows[row] === ""
        ? word
        : `${rows[row]} ${word}`;

    if (testLine.length <= limits[row]) {
      rows[row] = testLine;
    } else {
      row += 1;

      if (row > 2 || word.length > limits[row]) {
        return false;
      }

      rows[row] = word;
    }
  }

  return true;
}

export function getFallbackQuote() {
  const validQuotes = FALLBACK_QUOTES.filter((quote) =>
    canFitQuote(quote)
  );

  return validQuotes[
    Math.floor(Math.random() * validQuotes.length)
  ];
}
