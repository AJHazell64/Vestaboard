export const FALLBACK_QUOTES = [
  "THIS QUOTE IS DEFINITELY TOO LONG TO FIT",
  "DO IT NOW",
  "KEEP MOVING FORWARD",
  "SMALL STEPS COUNT",
  "YOU HAVE GOT THIS",
  "STAY CURIOUS ALWAYS",
  "MAKE IT HAPPEN",
  "BE KIND TODAY",
  "REST IS PRODUCTIVE",
  "YOU ARE DOING GREAT",
  "BANANAS ARE BERRIES",
  "OCTOPUSES HAVE 3 HEARTS",
  "SHARKS ARE OLDER THAN TREES",
  "HONEY NEVER SPOILS",
  "I NEED SPACE SAID THE STAR",
  "A GROUP OF CROWS IS MURDER",
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
  const limits = [15, 9, 5];

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
