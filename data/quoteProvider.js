import { getValidFallbackQuotes } from "./quotes.js";

function shuffleQuotes(quotes) {
  const shuffledQuotes = [...quotes];

  for (
    let index = shuffledQuotes.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(Math.random() * (index + 1));

    [
      shuffledQuotes[index],
      shuffledQuotes[randomIndex],
    ] = [
      shuffledQuotes[randomIndex],
      shuffledQuotes[index],
    ];
  }

  return shuffledQuotes;
}

export async function getQuote(savedQueue = []) {
  let quoteQueue = Array.isArray(savedQueue)
    ? [...savedQueue]
    : [];

  if (quoteQueue.length === 0) {
    quoteQueue = shuffleQuotes(
      getValidFallbackQuotes()
    );
  }

  const quote = quoteQueue.shift();

  return {
    quote,
    queue: quoteQueue,
  };
}
