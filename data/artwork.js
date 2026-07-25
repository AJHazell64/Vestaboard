import { compilePattern } from "../src/artworkCompiler.js";

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

function chooseRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function choosePalette() {
  const paletteSize = 2 + Math.floor(Math.random() * 3);

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
  const bandWidth = 1 + Math.floor(Math.random() * 3);

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

function getCurrentTimeCharacters() {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());

  return [...time];
}

function addTime(grid) {
  const result = grid.map((row) => [...row]);
  const timeCharacters = getCurrentTimeCharacters();

  result[2].splice(10, 5, ...timeCharacters);

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
  const grid = selectedGenerator(palette);

  return addTime(grid);
}

export const artwork = [
  {
    name: "Generative Colour Grid",
    category: "generated",
    characters: compilePattern(generateArtwork()),
  },
];
