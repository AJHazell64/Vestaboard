const CHARACTER_CODES = {
  ".": 0,
  Y: 65,
  G: 66,
};

function compilePattern(pattern) {
  if (pattern.length !== 3) {
    throw new Error("Artwork must contain exactly 3 rows");
  }

  return pattern.map((row) => {
    if (row.length !== 15) {
      throw new Error("Each artwork row must contain exactly 15 characters");
    }

    return [...row].map((character) => {
      const code = CHARACTER_CODES[character];

      if (code === undefined) {
        throw new Error(`Unknown artwork character: ${character}`);
      }

      return code;
    });
  });
}

export const artwork = [
  {
    name: "Sunrise",
    category: "nature",
    characters: compilePattern([
      ".....YYYY......",
      "...YYYYYYYY....",
      "GGGGGGGGGGGGGGG",
    ]),
  },
];
