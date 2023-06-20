import { Cron } from "croner";
import { checkNewTrans, getTodayTrans } from "./checkNewTrans";
import { sendDiscord } from "./notification";
import { formatNumberToSixDigits, getTransTimeAsDayjs } from "./checkNewTrans";
import dayjs from "dayjs";
import "dayjs/locale/vi";
dayjs.locale("vi");

export const timeStamp = dayjs().format("ddd, DD/MM/YYYY HH:mm:ss");

// setup how many seconds to do the cron check
const secondsThreshold = 60;
const cronSyntax = `*/${secondsThreshold} * * * * *`;

console.log(
  `Starting cron job at ${timeStamp} - This will run every ${secondsThreshold} seconds.`
);

// Basic: Run a function at the interval defined by a cron expression
const job = Cron(cronSyntax, () => {
  checkNewTrans(getTodayTrans, secondsThreshold)
    .then((newTransactions: any) => {
      if (newTransactions.length === 0) {
        console.log(
          timeStamp,
          `- No new transactions in ${secondsThreshold} seconds.`
        );
        return;
      }
      {
        console.log(
          timeStamp,
          ` - There is(are) ${newTransactions.length} new transactions in ${secondsThreshold} seconds.`
        );
        console.log(
          timeStamp,
          "- New Transactions:",
          JSON.stringify(newTransactions)
        );
        // parse newTransactions to string
        // sendDiscord(
        //   JSON.stringify(newTransactions.Amount),
        //   JSON.stringify(newTransactions.Description),
        //   JSON.stringify(newTransactions.PCTime)
        // );

        for (const transaction of newTransactions) {
          const amount = transaction.Amount;
          const description = transaction.Description;
          const formattedPCTime = formatNumberToSixDigits(transaction.PCTime);
          const tranDate = transaction.tranDate;
          const time = getTransTimeAsDayjs(tranDate, formattedPCTime).format(
            "DD/MM/YYYY HH:mm:ss"
          );
          sendDiscord(amount, time, description)
            .then((response) => {
              console.log("Notification sent to Discord");
            })
            .catch((error) => {
              console.error("Error sending notification:", error);
            });
        }
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}).trigger();
