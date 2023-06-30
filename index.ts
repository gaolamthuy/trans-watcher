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
  try {
    const newTransactions: any[] = await checkNewTrans(secondsThreshold);
    if (newTransactions.length === 0) {
      console.log(
        timeStamp(),
        `- No new transactions in ${secondsThreshold} seconds.`
      );
      return;
    }

    console.log(
      timeStamp(),
      ` - There is(are) ${newTransactions.length} new transaction(s) in ${secondsThreshold} seconds.`
    );
    console.log(
      timeStamp(),
      "- New Transactions:",
      JSON.stringify(newTransactions)
    );

    // parse newTransactions to string
    for (const transaction of newTransactions) {
      const amount = transaction.Amount;
      const description = transaction.Description;
      const formattedPCTime = formatNumberToSixDigits(transaction.PCTime);
      const time = getTransTimeAsDayjs(formattedPCTime).format(
        "dddd, DD/MM/YYYY HH:mm:ss"
      );
      await sendDiscord(amount, time, description, false);
      console.log(timeStamp(), "- Notification sent to Discord");
    }
  } catch (error) {
    console.error(
      timeStamp(),
      " - Stopping cron job. Error: ",
      JSON.stringify(error)
    );
    // job.stop();
  }
});

// function delay(ms: any) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }
