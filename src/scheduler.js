const LONDON_TIME_ZONE = "Europe/London";

function getLondonTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);

  return { hour, minute };
}

export function getDisplayMode(date = new Date()) {
  const { hour, minute } = getLondonTimeParts(date);

  if (hour >= 7 && hour < 9) {
    return "morning";
  }

  if (hour >= 9 && hour < 23) {
    if (minute === 0) {
      return "clock";
    }

    if (minute >= 1 && minute <= 9) {
      return "day-content";
    }

    return "artwork";
  }

  if (hour === 23 && minute < 15) {
    return "night-quote";
  }

  return "night-scene";
}