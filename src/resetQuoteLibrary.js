
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { canFitQuote, cleanQuote } from "../data/quotes.js";

const repo = process.env.GITHUB_REPOSITORY;

if (!repo || !process.env.GH_TOKEN) {
  throw new Error("GitHub authentication is unavailable");
}

function gh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function git(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}



function getVariable(name) {
  try {
    return gh([
      "api",
      `repos/${repo}/actions/variables/${name}`,
      "--jq",
      ".value",
    ]);
  } catch (error) {
    const stderr = error.stderr?.toString() || "";

    if (stderr.includes("404")) {
      return null;
    }

    throw error;
  }
}

function getList(name) {
  const value = getVariable(name);

  if (value === null) return [];

  const parsed = JSON.parse(value);

  if (
    !Array.isArray(parsed) ||
    !parsed.every(item => typeof item === "string")
  ) {
    throw new Error(`Invalid ${name}`);
  }

  return parsed;
}

function setVariable(name, value) {
  gh([
    "variable",
    "set",
    name,
    "--body",
    value,
    "--repo",
    repo,
  ]);
}

const resetRequested =
  getVariable("RESET_QUOTES_REQUESTED") === "true";

if (!resetRequested) {
  console.log("No quote library reset requested");
  process.exit(0);
}

console.log("Processing quote library reset");

const excluded = getList("EXCLUDED_QUOTES");
const appQuotes = getList("APP_QUOTES");
const pendingQuotes = getList("PENDING_APP_QUOTES");

const excludedKeys = new Set(
  excluded.map(cleanQuote)
);

const isRetained = quote =>
  !excludedKeys.has(cleanQuote(quote));

const unique = quotes => {
  const seen = new Set();

  return quotes.filter(quote => {
    if (
      typeof quote !== "string" ||
      !canFitQuote(quote)
    ) {
      return false;
    }

    const key = cleanQuote(quote);

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

// READ BUILT-IN QUOTES

const quotesPath = "data/quotes.js";
const quotesSource = readFileSync(
  quotesPath,
  "utf8"
);

const match = quotesSource.match(
  /export const FALLBACK_QUOTES\s*=\s*(\[[\s\S]*?\]);/
);

if (!match) {
  throw new Error("Built-in quote array not found");
}

const builtInQuotes = JSON.parse(match[1]);

if (!Array.isArray(builtInQuotes)) {
  throw new Error("Invalid built-in quote library");
}

// READ TELEGRAM QUOTES

const telegramPath = "data/telegram-quotes.json";

const telegramQuotes = JSON.parse(
  readFileSync(telegramPath, "utf8")
);

if (!Array.isArray(telegramQuotes)) {
  throw new Error("Invalid Telegram quote library");
}

// REMOVE EXCLUDED QUOTES FROM EVERY SOURCE

const keptBuiltIn = unique(
  builtInQuotes.filter(isRetained)
);

const keptTelegram = unique(
  telegramQuotes.filter(isRetained)
);

// APP QUOTES AND PENDING QUOTES BECOME ONE LIBRARY

const existingKeys = new Set(
  [...keptBuiltIn, ...keptTelegram].map(cleanQuote)
);

const keptApp = unique([
  ...appQuotes,
  ...pendingQuotes,
].filter(isRetained)).filter(
  quote => !existingKeys.has(cleanQuote(quote))
);

const total =
  keptBuiltIn.length +
  keptTelegram.length +
  keptApp.length;

if (total === 0) {
  throw new Error(
    "Reset aborted: no valid quotes would remain"
  );
}

// PREPARE SOURCE FILE CHANGES

const updatedQuotesSource = quotesSource.replace(
  match[0],
  `export const FALLBACK_QUOTES = ${JSON.stringify(
    keptBuiltIn,
    null,
    2
  )};`
);

writeFileSync(
  quotesPath,
  updatedQuotesSource,
  "utf8"
);

writeFileSync(
  telegramPath,
  JSON.stringify(keptTelegram, null, 2) + "\n",
  "utf8"
);

// SAVE THE PHYSICAL DELETIONS FIRST

gh([
  "config",
  "user.name",
  "github-actions[bot]",
]);

gh([
  "config",
  "user.email",
  "41898282+github-actions[bot]@users.noreply.github.com",
]);

gh([
  "add",
  quotesPath,
  telegramPath,
]);

const changed = gh([
  "diff",
  "--cached",
  "--name-only",
]);

if (changed) {
  gh([
    "commit",
    "-m",
    "Permanently remove excluded quotes",
  ]);

  gh(["push"]);
}

// PRESERVE ALL NON-EXCLUDED PENDING QUOTES

setVariable(
  "APP_QUOTES",
  JSON.stringify(keptApp)
);

// CLEAR PRIORITY AND ROTATION HISTORY

setVariable("PENDING_APP_QUOTES", "[]");

setVariable(
  "QUOTE_QUEUE",
  JSON.stringify({
    version: 2,
    shown: [],
  })
);

// ONLY CLEAR EXCLUSIONS AFTER SOURCES ARE SAVED

setVariable("EXCLUDED_QUOTES", "[]");

// REQUEST ONE NEW RANDOM QUOTE

setVariable("NEXT_QUOTE_REQUESTED", "true");

// MARK RESET COMPLETE

setVariable("RESET_QUOTES_REQUESTED", "false");

console.log(
  `Reset complete. ${total} retained quotes.`
);
console.log(
  `${excludedKeys.size} excluded quote entries processed.`
);
