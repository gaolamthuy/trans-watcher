import { Cron } from "croner";
import { checkNewTrans } from "./checkNewTrans";
import { sendDiscord } from "./notification";
import {
  formatNumberToSixDigits,
  getTransTimeAsDayjs,
  timeStamp,
} from "./checkNewTrans";
import dayjs from "dayjs";
import "dayjs/locale/vi";
dayjs.locale("vi");

// setup how many seconds to do the cron check
const secondsThreshold = 15;
const cronSyntax = `*/${secondsThreshold} * * * * *`;

console.log(
  `Starting cron job at ${timeStamp()} - This will run every ${secondsThreshold} seconds.`
);

// Basic: Run a function at the interval defined by a cron expression
export const job = Cron(cronSyntax, async () => {
  await checkNewTrans();
});

// function delay(ms: any) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }
