import { Cron } from "croner";
import { checkNewTrans, getTodayTrans } from "./checkNewTrans";
import { sendDiscord } from "./notification";
import { formatNumberToSixDigits, getTransTimeAsDayjs } from "./checkNewTrans";
import dayjs from "dayjs";
import "dayjs/locale/vi";
dayjs.locale("vi");
import { timeStamp } from "./checkNewTrans";

// setup how many seconds to do the cron check
const secondsThreshold = 30;
const cronSyntax = `*/${secondsThreshold} * * * * *`;

console.log(
  `Starting cron job at ${timeStamp()} - This will run every ${secondsThreshold} seconds.`
);

// Basic: Run a function at the interval defined by a cron expression
const job = Cron(cronSyntax, () => {
  checkNewTrans(secondsThreshold)
    .then((newTransactions: any) => {
      if (newTransactions.length === 0) {
        console.log(
          timeStamp(),
          `- No new transactions in ${secondsThreshold} seconds.`
        );
        return;
      }
      {
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
          sendDiscord(amount, time, description)
            .then((response) => {
              console.log(timeStamp(), "- Notification sent to Discord");
            })
            .catch((error) => {
              console.error(
                timeStamp(),
                "- Error sending notification:",
                error
              );
            });
        }
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});
