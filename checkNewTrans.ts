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
  return dayjs().subtract(1, "month").format("DD/MM/YYYY");
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
let lastReference = "5189 - 4171";
let newTransactions = [];

async function checkNewTrans() {
  const transactions = await getTodayTrans();

  if (transactions.length === 0) {
    console.log("No transactions found.");
    return;
  }

  const latestTransaction = transactions[0]; // Assuming the latest transaction is at index 0

  if (lastReference === "") {
    lastReference = latestTransaction.Reference;
    console.log("Initial lastReference set to:", lastReference);
    return;
  }

  const index = transactions.findIndex(
    (trans: any) => trans.Reference === lastReference
  );
  if (index === -1) {
    console.log("Last reference not found in new transactions:", lastReference);
    return;
  }

  newTransactions = transactions.slice(0, index);

  console.log("New transactions found:");
  newTransactions.forEach((transaction: any) => {
    console.log("Transaction:", transaction);
    // Perform desired actions with the new transaction
  });

  // Update lastReference to the latest transaction's Reference
  lastReference = latestTransaction.Reference;
  console.log("lastReference updated to:", lastReference);
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
