import { Cron } from "croner";
import { checkNewTrans } from "./checkNewTrans";
import { sendDiscord } from "./notification";
import { formatNumberToSixDigits, getTransTimeAsDayjs } from "./checkNewTrans";
import dayjs from "dayjs";
import "dayjs/locale/vi";
dayjs.locale("vi");
import { timeStamp } from "./checkNewTrans";

// setup how many seconds to do the cron check
const secondsThreshold = 15;
const cronSyntax = `*/${secondsThreshold} * * * * *`;

console.log(
  `Starting cron job at ${timeStamp()} - This will run every ${secondsThreshold} seconds.`
);

// Basic: Run a function at the interval defined by a cron expression
const job = Cron(cronSyntax, async () => {
  try {
    for (let i = 0; i < 5; i++) {
      const newTransactions: any = await checkNewTrans(secondsThreshold);
      if (newTransactions.length === 0) {
        console.log(
          timeStamp(),
          `- No new transactions in ${secondsThreshold} seconds.`
        );
        return;
      }

      console.log(
        timeStamp(),
        ` - There is(are) ${newTransactions.length} new transactions in ${secondsThreshold} seconds.`
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

        await delay(2000); // Delay for 2 seconds
      }
    }
    // Stop the job after executing 5 times
    job.stop();
  } catch (error) {
    console.error(timeStamp(), " stopping cron job.");
    sendDiscord("", "", "", true);
    job.stop();
  }
});

function delay(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
