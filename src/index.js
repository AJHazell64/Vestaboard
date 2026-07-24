import { getDisplayMode } from "./scheduler.js";
import { createClockDisplay } from "./clock.js";
import { sendToVestaboard } from "./vestaboard.js";

const now = new Date();
const mode = getDisplayMode(now);

let message;

if (mode === "clock") {
  message = createClockDisplay(now);
} else if (mode === "morning") {
  const { createMorningDisplay } = await import("./morning.js");
  message = await createMorningDisplay();
} else {
  message = await createMorningDisplay();
}
await sendToVestaboard(message);