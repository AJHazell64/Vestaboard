import { compilePattern } from "../src/artworkCompiler.js";
import { FALLBACK_QUOTES } from "./quotes.js";

const COLOURS = [
  "RED",
  "ORANGE",
  "YELLOW",
  "GREEN",
  "BLUE",
  "VIOLET",
  "WHITE",
  "BLACK",
];



function getLondonTimeParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  return Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );
}

function createQuoteSeed() {
  const values = getLondonTimeParts();

  return Number(
    `${values.year}${values.month}${values.day}${values.hour}${Math.floor(Number(values.minute) / 15)}`
  );
}

function createSeededRandom(seed) {
  let state = seed >>> 0;

  return function random() {
    state += 0x6d2b79f5;

    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);

    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createSeededRandom(createQuoteSeed());

function chooseRandom(items) {
  return items[Math.floor(random() * items.length)];
}

function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));

    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

function choosePalette() {
  const paletteSize = 2 + Math.floor(random() * 3);

  return shuffle(COLOURS).slice(0, paletteSize);
}

function createGrid(fillValue = "BLANK") {
  return Array.from(
    { length: 3 },
    () => Array(15).fill(fillValue)
  );
}

function generateMirroredMosaic(palette) {
  return Array.from({ length: 3 }, () => {
    const leftSide = Array.from(
      { length: 7 },
      () => chooseRandom(palette)
    );

    return [
      ...leftSide,
      chooseRandom(palette),
      ...leftSide.slice().reverse(),
    ];
  });
}

function generateHorizontalBands(palette) {
  return Array.from(
    { length: 3 },
    (_, row) => Array(15).fill(palette[row % palette.length])
  );
}

function generateVerticalBands(palette) {
  const grid = createGrid();
  const bandWidth = 1 + Math.floor(random() * 3);

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 15; column += 1) {
      const band = Math.floor(column / bandWidth);
      grid[row][column] = palette[band % palette.length];
    }
  }

  return grid;
}

function generateCheckerboard(palette) {
  const grid = createGrid();
  const firstColour = palette[0];
  const secondColour = palette[1];

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 15; column += 1) {
      grid[row][column] =
        (row + column) % 2 === 0
          ? firstColour
          : secondColour;
    }
  }

  return grid;
}

function generateDiagonalBands(palette) {
  const grid = createGrid();

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 15; column += 1) {
      grid[row][column] =
        palette[(column + row * 2) % palette.length];
    }
  }

  return grid;
}

function generateCentreGlow(palette) {
  const grid = createGrid();
  const centreColumn = 7;

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 15; column += 1) {
      const distance = Math.abs(column - centreColumn);

      if (distance <= 2) {
        grid[row][column] = palette[0];
      } else if (distance <= 5) {
        grid[row][column] = palette[1];
      } else {
        grid[row][column] =
          palette[2] ?? palette[palette.length - 1];
      }
    }
  }

  return grid;
}

function generateConfetti(palette) {
  return Array.from(
    { length: 3 },
    () =>
      Array.from(
        { length: 15 },
        () => chooseRandom(palette)
      )
  );
}

function generateNightArtwork() {
  const grid = createGrid("BLACK");

  const palette = [
    "BLACK",
    "BLACK",
    "BLACK",
    "BLUE",
    "VIOLET",
    "WHITE",
  ];

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 15; column += 1) {
      grid[row][column] =
        palette[Math.floor(Math.random() * palette.length)];
    }
  }

  return grid;
}

function getCurrentTimeCharacters() {
  const values = getLondonTimeParts();

  const roundedMinute =
    Math.floor(Number(values.minute) / 5) * 5;

  const time =
    `${values.hour}:${String(roundedMinute).padStart(2, "0")}`;

  return [...time];
}

function isFirstFifteenMinutes() {
  const values = getLondonTimeParts();

  return Number(values.minute) < 15;
}
function convertTextToCharacters(text) {
  return [...text.toUpperCase()].map(
    (character) => character === " " ? "BLANK" : character
  );
}

function addContent(grid, content) {
  const result = grid.map((row) => [...row]);

  const words = content.toUpperCase().split(" ");
  const rows = ["", "", ""];
  let row = 0;

  for (const word of words) {
    const testLine =
      rows[row] === ""
        ? word
        : `${rows[row]} ${word}`;

    const limit = row === 0 ? 15 : 9;

    if (testLine.length <= limit) {
      rows[row] = testLine;
    } else {
      row += 1;

      if (row > 2) {
        break;
      }

      rows[row] = word;
    }
  }

  rows.forEach((line, index) => {
    const maxCharacters = index === 0 ? 15 : 9;

    const characters = convertTextToCharacters(line)
      .slice(0, maxCharacters);

    result[index].splice(
      0,
      characters.length,
      ...characters
    );
  });

  return result;
}
function addTime(grid) {
  const result = grid.map((row) => [...row]);

  result[2].splice(
    10,
    5,
    ...getCurrentTimeCharacters()
  );

  return result;
}
function generateArtwork() {
  const palette = choosePalette();

  const generators = [
    generateMirroredMosaic,
    generateHorizontalBands,
    generateVerticalBands,
    generateCheckerboard,
    generateDiagonalBands,
    generateCentreGlow,
    generateConfetti,
  ];

  const selectedGenerator = chooseRandom(generators);
const background = selectedGenerator(palette);

console.log("Artwork generated with clock protection");
return addTime(background);
}

export {
  addContent,
  createGrid,
  getCurrentTimeCharacters,
  addTime,
  generateNightArtwork,
};

const generatedArtwork = generateArtwork();

export const artwork = [
  {
    name: "Hourly Generative Colour Grid",
    category: "generated",
    rawCharacters: generatedArtwork,
    characters: compilePattern(generatedArtwork),
  },
];
