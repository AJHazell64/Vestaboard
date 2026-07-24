const BOARD_WIDTH = 22;
const BOARD_HEIGHT = 6;

const DIGITS = {
  "0": [
    "111",
    "101",
    "101",
    "101",
    "101",
    "111",
  ],
  "1": [
    "010",
    "110",
    "010",
    "010",
    "010",
    "111",
  ],
  "2": [
    "111",
    "001",
    "111",
    "100",
    "100",
    "111",
  ],
  "3": [
    "111",
    "001",
    "111",
    "001",
    "001",
    "111",
  ],
  "4": [
    "101",
    "101",
    "111",
    "001",
    "001",
    "001",
  ],
  "5": [
    "111",
    "100",
    "111",
    "001",
    "001",
    "111",
  ],
  "6": [
    "111",
    "100",
    "111",
    "101",
    "101",
    "111",
  ],
  "7": [
    "111",
    "001",
    "001",
    "001",
    "001",
    "001",
  ],
  "8": [
    "111",
    "101",
    "111",
    "101",
    "101",
    "111",
  ],
  "9": [
    "111",
    "101",
    "111",
    "001",
    "001",
    "111",
  ],
};

function getLondonTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  return {
    hour: parts.find((part) => part.type === "hour")?.value ?? "00",
    minute: parts.find((part) => part.type === "minute")?.value ?? "00",
  };
}

export function createClockDisplay(date = new Date()) {
  const { hour, minute } = getLondonTime(date);
  const characters = `${hour}${minute}`;

  const rows = Array.from({ length: BOARD_HEIGHT }, () =>
    Array(BOARD_WIDTH).fill(" ")
  );

  let x = 2;

  for (let index = 0; index < characters.length; index += 1) {
    if (index === 2) {
      rows[1][x] = "●";
      rows[4][x] = "●";
      x += 2;
    }

    const digit = DIGITS[characters[index]];

    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      for (let digitX = 0; digitX < 3; digitX += 1) {
        if (digit[y][digitX] === "1") {
          rows[y][x + digitX] = "█";
        }
      }
    }

    x += 4;
  }

  return rows.map((row) => row.join("")).join("\n");
}