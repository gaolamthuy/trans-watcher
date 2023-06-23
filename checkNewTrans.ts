import "dotenv/config";
import axios from "axios";
import dayjs = require("dayjs");
import customParseFormat = require("dayjs/plugin/customParseFormat");
import isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
import isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
import { sendDiscord } from "./notification";
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export function today() {
  return dayjs().format("DD/MM/YYYY");
}

export function timeStamp() {
  return dayjs().format("ddd, DD/MM/YYYY HH:mm:ss");
}

type Transaction = {
  PCTime: string;
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

// do a post axios to VCB API using async/await
// fetch the data
export async function getTodayTrans(): Promise<any> {
  try {
    const data = {
      username: process.env.VCB_USERNAME,
      password: process.env.VCB_PASSWORD,
      accountNumber: process.env.VCB_ACCOUNT_NUMBER,
      begin: today(),
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
      "An error occurred while fetching today's transactions:",
      error
    );
    // throw sendDiscord("lỗi", "lỗi", "lỗi"); // Optional: Rethrow the error to handle it in the caller function
  }
}

export async function checkNewTrans(
  secondsThreshold: number
): Promise<Transaction[]> {
  const transactions = await getTodayTrans();
  const nowMinus = getNowMinusSeconds(secondsThreshold);

  const newTransactions = transactions.filter((transaction: any) => {
    const transactionTime = formatNumberToSixDigits(transaction.PCTime);
    const transDayjsObject = getTransTimeAsDayjs(transactionTime);
    // console.log("now: ", nowMinus.format("DD/MM/YY HH:mm:ss"));
    return (
      transDayjsObject.isSameOrAfter(nowMinus) &&
      transDayjsObject.isSameOrBefore(dayjs())
    );
  });

  return newTransactions;
}

// checkNewTrans(30).then((newTransactions) => {
//   console.log("newTransactions", newTransactions);
// });
