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

type Transaction = {
  PCTime: string;
  tranDate: string;
  // Add other properties relevant to your transactions
};

const secondsThreshold = 300;

function formatNumberToSixDigits(PCTime: string): string {
  if (PCTime) {
    return PCTime.padStart(6, "0");
  }
  return "";
}

function getTransTimeAsDayjs(
  dateString: string,
  timeString: string
): dayjs.Dayjs {
  const formattedDateTime = `${dateString} ${timeString}`;
  const dayjsObject = dayjs(formattedDateTime, "DD/MM/YYYY HHmmss");
  return dayjsObject;
}

function getNowMinusSeconds(seconds: number): dayjs.Dayjs {
  const now = dayjs();
  const subtractedTime = now.subtract(seconds, "second");
  return subtractedTime;
}

// do a post axios to VCB API using async/await
// fetch the data
async function getTodayTrans(): Promise<any> {
  const data = {
    username: process.env.VCB_USERNAME,
    password: process.env.VCB_PASSWORD,
    accountNumber: process.env.VCB_ACCOUNT_NUMBER,
    begin: "20/06/2023",
    end: "20/06/2023",
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
}

async function checkNewTrans(
  getTransactions: () => Promise<Transaction[]>,
  secondsThreshold: number
): Promise<Transaction[]> {
  const transactions = await getTransactions();
  const nowMinus = getNowMinusSeconds(secondsThreshold);

  const newTransactions = transactions.filter((transaction) => {
    const transactionDate = transaction.tranDate;
    const transactionTime = formatNumberToSixDigits(transaction.PCTime);
    const transTime = getTransTimeAsDayjs(transactionDate, transactionTime);
    // console.log("transTime: ", transTime.format("DD/MM/YY HH:mm:ss"));
    // console.log("now: ", nowMinus.format("DD/MM/YY HH:mm:ss"));
    return (
      transTime.isSameOrAfter(nowMinus) && transTime.isSameOrBefore(dayjs())
    );
  });

  return newTransactions;
}

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
