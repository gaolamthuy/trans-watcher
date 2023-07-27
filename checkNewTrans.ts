import "dotenv/config";
import axios from "axios";
import dayjs = require("dayjs");
import customParseFormat = require("dayjs/plugin/customParseFormat");
import { sendDiscord } from "./notification";
dayjs.extend(customParseFormat);

export function today() {
  return dayjs().format("DD/MM/YYYY");
}

function getThirtyDaysAgoDate() {
  return dayjs().subtract(29, "day").format("DD/MM/YYYY");
}

export function timeStamp(): string {
  return dayjs().format("ddd, DD/MM/YYYY HH:mm:ss");
}

type Transaction = {
  PCTime: string;
  tranDate: string;
  // Add other properties relevant to your transactions
};

export function formatNumberToSixDigits(PCTime: string): string {
  if (PCTime) {
    return PCTime.padStart(6, "0");
  }
  return "";
}

export function getTransTimeAsDayjs(timeString: string): dayjs.Dayjs {
  const formattedDateTime = `${today()} ${timeString}`;
  const transDayjsObject = dayjs(formattedDateTime, "DD/MM/YYYY HHmmss");
  // console.log(
  //   "transDayjsObject: ",
  //   transDayjsObject.format("DD/MM/YYYY HH:mm:ss")
  // );
  return transDayjsObject;
}

function getNowMinusSeconds(seconds: number): dayjs.Dayjs {
  let minusNow = dayjs().subtract(seconds, "second");
  // console.log("minusNow: ", minusNow.format("DD/MM/YYYY HH:mm:ss"));
  return minusNow;
}

// do a post axios to VCB API using async/await, return last 10 transactions in JSON
export async function getTodayTrans(): Promise<any> {
  const maxRetryCount = 4;
  const retryDelayMs = 1000; // 1 second
  let retryCount = 0;

  while (retryCount < maxRetryCount) {
    try {
      const data = {
        username: process.env.VCB_USERNAME,
        password: process.env.VCB_PASSWORD,
        accountNumber: process.env.VCB_ACCOUNT_NUMBER,
        begin: getThirtyDaysAgoDate(),
        end: today(),
      };
      const config = {
        method: "post",
        url: process.env.VCB_API_URL,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(data),
      };

      const response = await axios(config);
      let transactions = response.data.results;

      if (!Array.isArray(transactions)) {
        // If transactions is not an array, wrap it in an array
        transactions = [transactions];
      }

      return transactions;
    } catch (error) {
      console.error(
        timeStamp(),
        "\nAn error occurred while fetching today's transactions:",
        JSON.stringify(error)
      );
      retryCount++;

      if (retryCount === maxRetryCount) {
        sendDiscord("", "", "", "system");
      } else {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  // If all retries fail, you may want to return an empty array or throw an error
  // job.stop();
}

// Store last timestamp and look for new transactions
let latestTransaction = JSON.stringify({
  reference: "",
  remark: "",
  amount: "",
  // Additional variables can be added here
});

export async function checkNewTrans() {
  try {
    const transactions = await getTodayTrans();

    if (transactions.length === 0) {
      console.log(timeStamp(), "- No transactions found.");
      return;
    }

    const currentLatestTransaction = transactions[0];
    const parsedLatestTransaction = JSON.parse(latestTransaction);

    if (parsedLatestTransaction.reference === "") {
      parsedLatestTransaction.reference = currentLatestTransaction.Reference;
      parsedLatestTransaction.remark = currentLatestTransaction.Remark;
      parsedLatestTransaction.amount = currentLatestTransaction.Amount;

      latestTransaction = JSON.stringify(parsedLatestTransaction);

      console.log(
        timeStamp(),
        "- Initial latestReference set to:",
        parsedLatestTransaction.reference,
        "- latestRemark:",
        parsedLatestTransaction.remark,
        "- latestAmount:",
        parsedLatestTransaction.amount
      );

      return;
    }

    const index = transactions.findIndex(
      (trans: { Reference: string }) =>
        trans.Reference === parsedLatestTransaction.reference
    );

    if (index === -1) {
      console.log(
        timeStamp(),
        "- Latest reference not found in new transactions:",
        parsedLatestTransaction.reference,
        "- latestRemark:",
        parsedLatestTransaction.remark,
        "- latestAmount:",
        parsedLatestTransaction.amount
      );

      return;
    }

    const newTransactions = transactions.slice(0, index);

    if (newTransactions.length === 0) {
      // console.log(timeStamp(), "- No new transactions found.");
    } else {
      console.log(timeStamp(), "- New transactions found:");
      newTransactions.forEach(
        ({
          Amount,
          PCTime,
          Remark,
        }: {
          Amount: string;
          PCTime: string;
          Remark: string;
        }) => {
          console.log(
            timeStamp(),
            "- Transaction:",
            JSON.stringify({ Amount, PCTime, Remark })
          );
          sendDiscord(
            Amount,
            getTransTimeAsDayjs(formatNumberToSixDigits(PCTime)).format(
              "dddd, DD/MM/YYYY HH:mm:ss"
            ),
            Remark,
            "transaction"
          );

          // Update latestTransaction information
          parsedLatestTransaction.reference =
            currentLatestTransaction.Reference;
          parsedLatestTransaction.remark = currentLatestTransaction.Remark;
          parsedLatestTransaction.amount = currentLatestTransaction.Amount;

          latestTransaction = JSON.stringify(parsedLatestTransaction);

          console.log(
            timeStamp(),
            "- latestReference updated to:",
            parsedLatestTransaction.reference,
            "- latestRemark:",
            parsedLatestTransaction.remark,
            "- latestAmount:",
            parsedLatestTransaction.amount
          );
        }
      );
    }
    // Log latestTransaction
    console.log(
      timeStamp(),
      "- Current latestReference:",
      parsedLatestTransaction.reference,
      "- latestRemark:",
      parsedLatestTransaction.remark,
      "- latestAmount:",
      parsedLatestTransaction.amount
    );
  } catch (error) {
    console.error(timeStamp(), "- Error: ", JSON.stringify(error));
    await sendDiscord("", "", "", "system");
  }
}

async function testCheckNewTrans() {
  console.log("=== Testing checkNewTrans ===");

  // First call to checkNewTrans
  console.log("First checkNewTrans call:");
  await checkNewTrans();

  // Simulating some delay before the second call
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Second call to checkNewTrans
  console.log("Second checkNewTrans call:");
  await checkNewTrans();

  console.log("=== End of test ===");
}

// Run the test function
// testCheckNewTrans();

// Compare PCTime with now
// export async function checkNewTrans(
//   secondsThreshold: number
// ): Promise<Transaction[]> {
//   // logic: parse PCTime to number and compare with now
//   const transactions = await getTodayTrans();
//   const nowMinus = getNowMinusSeconds(secondsThreshold);
//   const nowMinusFormatted = parseInt(nowMinus.format("HHmmss"));
//   const nowFormateted = parseInt(dayjs().format("HHmmss"));
//   const newTransactions = transactions.filter((transaction: any) => {
//     const pcTimeFormatted = parseInt(transaction.PCTime);
//     // console.log("now: ", nowMinus.format("DD/MM/YY HH:mm:ss"));
//     return (
//       // (now-crontime) <= transactionPCTime < now
//       pcTimeFormatted >= nowMinusFormatted && pcTimeFormatted < nowFormateted
//     );
//   });
//   return newTransactions;
// }
