import { readFileSync } from "node:fs";

export const FALLBACK_QUOTES = [
  "YOU LIVE ONCE MAKE IT ENOUGH",
  "WISE WARRIORS AVOID BATTLE",
  "DANCE LIKE NO ONE IS WATCHING",
  "CHOICES DEFINE US, NOT ABILITY",
  "A DAY WITHOUT SUNSHINE IS NIGHT",
  "IMAGINATION GETS YOU ANYWHERE",
  "BALANCE IS KEPT WHEN MOVING",
  "MAKE PEOPLE LAUGH",
  "IF IT SCARES YOU, CONTINUE",
  "IN THAT MOMENT, INFINITE",
  "SEEK RESPECT, NOT ATTENTION",
  "DREAMS NEED ACTION",
  "CHATTER IN THE SKULL",
  "THE RIGHT PATH IS RARELY EASY",
  "NEVER WEAKEN",
  "CREATE YOUR OWN MIRACLES",
  "CONTROL YOUR EGO",
  "MEMORISE WHAT YOU CAN'T RESEARCH",
  "IS THE JUICE WORTH THE SQUEEZE?",
  "YOU LEARN THROUGH FAILURE",
  "LIKE A FAT KID LOVES CAKE",
  "YOU CAN DO IT BRUCE",
  "Drugs are bad, mmkay?",
  "not fat, festively plump",
  "It's all about moderation",
  "I'm in a glass case of emotion",
  "Well, that escalated quickly",
  "you can do it",
  "high quality H2O",
  "ben franklin is the devil!",
  "Captain Insano shows no mercy",
  "Water sucks",
  "Life is like a box of chocolate",
  "May the Force be with you",
  "Hasta la vista, baby",
  "Nobody hits as hard as life",
  "Everybody dies, not every one lives",
  "Carpe diem",
  "where's the goat?",
  "say hello to my little friend",
  "i am your father",
  "just keep swimming",
  "why so serious",
  "it's just a flesh wound",
  "he's a very naughty boy",
  "here's johnny!",
  "so you're telling me there's a chance?",
  "This one time, at band camp",
  "that'll do pig. that'll do",
  "you do not talk about fight club",
  "you shall not pass",
  "to infinity... and beyond",
  "get rich or die trying",
  "he is the one",
  "i see dead people",
  "the real life? just fantasy?",
  "sweet dreams are made of this",
  "ground control to major tom",
  "Jolene, Jolene, Jolene, Jolene!",
  "Hey Jude, don't make it bad",
  "I took my love, took it down...",
  "one week since you looked at me",
  "wake up, well I know I'm gonna be",
  "Back in the summer of 69",
  "whole lotta love",
  "ice ice baby",
  "don't stop me now",
  "born to be wild",
  "I'm blue da ba dee da ba di",
  "one more time",
  "We like to watch you laughing",
  "can you dig it, yes you can",
  "it's the final countdown",
  "another one bites the dust",
  "highway to hell",
  "an encore? Do you want more?",
  "with or without you",
  "kids with the pumped up kicks",
  "shooting stars break the mould",
  "dream of californication",
  "eye of the tiger",
  "thrill of the fight",
  "something so pleasant",
  "you can't touch this",
  "cover another perfect wonder",
  "Choose not a life of imitation",
  "when nothing else compares",
  "Take me to the place i love",
  "somewhere only we know",
  "i want to break free",
  "A sky full of stars",
  "Let me entertain you",
  "mischief managed",
  "timmy!",
  "hadouken!",
  "i drink and i know things",
  "yippee-ki-yay",
  "all roads lead to here",
  "Adho Mukha Svanasana",
  "Guten Tag",
  "Space may be the final frontier",
  "Soft spoken with a broken jaw",
  "Tell me when it kicks in",
  "gonna be the one who saves me",
  "no place i'd rather be",
  "i won't be ignored",
  "mo money, mo problems",
  "left to my own devices",
  "i want you to be happier",
  "we all know what's going down",
  "gone and sank th worlds wolf",
  "of dentists and the dark",
  "hakuna matata",
  "expecto patronum",
  "finish him",
  "eat my shorts",
  "greed is good",
  "aint nobody got time fo that",
  "ridiculously good looking",
  "that'll do donkey",
  "computer says no",
  "completed it mate",
  "feisty one you are",
  "He's not the Messiah",
  "You've got red on you",
  "Bittersweet symphony",
  "Oh, hamburgers!",
  "King in the castle!",
  "stay classy, san diego",
  "THIS RAIL IS VERY DIRTY",
  "east side love living on west end",
  "screw you guys",
  "i'm super cereal",
  "o my god, they killed kenny",
  "everything is legal in mexico",
  "i love lamp",
  "boats and hoes",
  "i pity the fool",
  "nobody calls me chicken",
  "i know kung fu",
  "we're going to need a bigger boat",
  "pivot",
  "who you gonna call?",
  "joey doesn't share food!",
  "live long and prosper",
  "clever girl",
  "nothing to see here",
  "pow, right in the kisser",
  "stoner bashin time!",
  "they took our jobs!",
  "about tree fiddy",
  "cool hwhip",
  "shut up, meg",
  "bird is the word",
  "what the deuce?",
  "there is no spoon",
  "run, forrest, run!",
  "houston, we have a problem",
  "did you touch my drumset?",
  "this is sparta!",
  "prestige worldwide",
  "beefcake!",
  "hooch is crazy",
  "dude, where's my car?",
  "and then?",
  "take my strong hand",
  "paper! snow! a ghost!",
  "miss chanandler bong",
  "holy inferiority complex",
  "one million dollars!",
  "i am mclovin",
  "just tap it in",
  "b-e-a-utiful",
  "be the miracle",
  "all i wanna do is do it",
  "mranderson, welcome back",
  "you will never get this",
  "welcome to jurassic park",
  "five minutes, turkish",
  "periwinkle blue",
  "medulla oblongata",
  "it's been emotional",
  "austin, massachusetts",
  "do ya like dags?",
  "because he dodges bullets",
  "before ze germans get here",
  "it was at a funny angle",
  "Drop the gun, fat boy",
  "That's a flash car mister",
  "He's a natural, ain't you Tyrone",
  "We've lost Gorgeous George.",
  "Durka Durka",
  "Not my circus not my monkeys",
  "Not in the blood sir",
  "Stay curious",
  "pets or drones in the car mate?",
  "Eagle!!!",
  "How you doing?!?",
  "Be valuable not available",
  "Always take the stairs",
  "Fall 7 times, get up 8",
  "Stay hungry",
  "Stay foolish",
  "Knowing your past is power",
  "Touch grass. It’s good for you",
  "Bravery feels like fear",
  "Beginning is always today",
  "But not yet, not yet",
  "Dare to dream",
  "Failure is not trying",
  "Share light, it grows",
  "You haven’t met all of you, yet",
  "Create what you wish existed",
  "Not too old, not too late",
  "Quality has no fear of time",
  "You only go around once",
  "Be strong enough to be gentle",
  "I’m going to see you there",
  "Practice creates luck",
  "All knowledge is yours to take",
  "Everything is possible",
  "People’s Front of Judea",
  "Your mother was a hamster",
  "you suggesting coconuts migrate?",
  "I am Jill’s nipples",
  "Who would you fight?",
  "Be player one, always.",
  "Lifestyles, rich and the famous",
  "Get stupid on a Sunday",
  "I only smoke when I drink",
  "I’ve moved your chair",
  "I only drink when I overthink",
  "Bloodstream",
  "Reckless serenade",
  "Goosebumps every time",
  "My life be life, ooo aaa",
  "Sipping on nostalgia",
  "The lights burn dimmer",
  "Heart quickens south of the river",
  "Dancing baby, under open sky",
  "Pretty like the sun",
  "Will you meet me by the sea?",
  "You overdid it doll",
  "I got sinning on my mind",
  "Sipping on red wine",
  "How’d I get so faded?",
  "Sitting here for ages",
  "I am the walrus",
  "Look at me, know what you see",
  "1, 2, get down!",
  "It’s only just begun",
  "Let go of what I’ve done",
  "Drunk and incapable",
  "Seidenschnabel",
  "Avada kedavra!",
  "Blow the bloody doors off",
  "A wise saying proves nothing",
  "No wasp inside figs",
  "We used to be giants",
  "Just another brick in the wall",
  "Will you keep going?",
  "Everyone is your role model",
  "Take extreme ownership",
  "Remember but don’t dwell",
  "The walls?… Don’t hit them",
  "We’re gonna need a montage",
  "Even rocky had a montage",
  "All cost is measured in time",
  "Tomorrow never arrives",
  "You must enjoy your life",
  "CHASE PURPOSE NOT EMPTY PLEASURES",
  "Run rabbit run",
  "Be somebody",
  "This what free travel costs?",
  "We won’t admit it to ourselves",
  "Everybody gets high sometimes",
  "Piece of mind, a piece of mine",
  "These streets are yours",
  "City where the sun don’t set",
  "Train, study, work, practice.",
  "Communication is respect",
  "My name is Jeff",
  "All just part of your story",
  "Only have power over your mind",
  "High, low, buffalo!",
  "Learn how to play the music",
  "Meet people where they are",
  "Shoulders, down and back",
  "This is not the whole story"
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

function getTelegramQuotes() {
  try {
    const fileContents = readFileSync(
      new URL(
        "./telegram-quotes.json",
        import.meta.url
      ),
      "utf8"
    );

    const quotes = JSON.parse(fileContents);

    return Array.isArray(quotes)
      ? quotes
      : [];
  } catch (error) {
    console.warn(
      `Unable to read Telegram quotes: ${error.message}`
    );

    return [];
  }
}

export function getValidFallbackQuotes() {
  const seenQuotes = new Set();

 const allQuotes = [
  ...FALLBACK_QUOTES,
  ...getTelegramQuotes(),
];

console.log(
  `Loaded ${allQuotes.length} total quotes (${getTelegramQuotes().length} from Telegram)`
);

  return allQuotes.filter((quote) => {
    if (!canFitQuote(quote)) {
      return false;
    }

    const cleanedQuote = cleanQuote(quote);

    if (seenQuotes.has(cleanedQuote)) {
      return false;
    }

    seenQuotes.add(cleanedQuote);
    return true;
  });
}

export function getFallbackQuote() {
  const validQuotes = getValidFallbackQuotes();

  return validQuotes[
    Math.floor(Math.random() * validQuotes.length)
  ];
}
