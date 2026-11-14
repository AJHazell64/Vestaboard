import {
  getValidFallbackQuotes,
  cleanQuote,
} from "./quotes.js";



export async function getQuote(
  savedState = [],
  excludedQuotes = [],
  appQuotes = []
) {

  // Reload quotes, excluding permanently removed entries.
  const excluded = new Set(
    excludedQuotes.map((quote) => cleanQuote(quote))
  );


const allQuotes = [
  ...getValidFallbackQuotes(),
  ...appQuotes,
];

const seen = new Set();

const quotes = allQuotes.filter((quote) => {
  const cleaned = cleanQuote(quote);

  if (
    !cleaned ||
    excluded.has(cleaned) ||
    seen.has(cleaned)
  ) {
    return false;
  }

  seen.add(cleaned);
  return true;
});



  if (quotes.length === 0) {
    throw new Error("No valid quotes available");
  }

  // Older queue format starts a fresh tracking cycle.
  const shown = new Set(
    savedState?.version === 2 &&
    Array.isArray(savedState.shown)
      ? savedState.shown
      : []
  );

  let remaining = quotes.filter(
    (quote) => !shown.has(cleanQuote(quote))
  );

  // Start again once every available quote has been shown.
  if (remaining.length === 0) {
    shown.clear();
    remaining = quotes;
  }

  // Randomly select one of the unseen quotes.
  const quote =
    remaining[Math.floor(Math.random() * remaining.length)];

  shown.add(cleanQuote(quote));

  return {
    quote,
    queue: {
      version: 2,
      shown: [...shown],
    },
  };
}
