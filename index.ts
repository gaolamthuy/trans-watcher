import { Cron } from "croner";
import { checkNewTrans, getTodayTrans } from "./checkNewTrans";

// setup how many seconds to do the cron check
export const secondsThreshold = 60;
const cronSyntax = `*/${secondsThreshold} * * * * *`;

// Basic: Run a function at the interval defined by a cron expression
const job = Cron(cronSyntax, () => {
  console.log("This will run every fifth second");
  checkNewTrans(getTodayTrans, secondsThreshold)
    .then((newTransactions) => {
      if (newTransactions.length === 0) {
        console.log("No new transactions.");
        return;
      }
      console.log(`There are ${newTransactions.length} new transactions.`);
      console.log("New Transactions:", JSON.stringify(newTransactions));
      // sendDiscord("hi test");
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}).trigger();
