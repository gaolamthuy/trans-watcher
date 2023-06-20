import "dotenv/config";
import axios from "axios";
import dayjs = require("dayjs");
import customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const secondsThreshold = 1000000;

function formatNumberToSixDigits(PCTime: string): string {
  if (PCTime) {
    return PCTime.padStart(6, "0");
  }
  return "";
}

function getTransTimeAsDayjs(timeString: string): dayjs.Dayjs {
  const today = dayjs().format("YYYY-MM-DD");
  const formattedDateTime = `${today} ${timeString}`;
  const dayjsObject = dayjs(formattedDateTime, "YYYY-MM-DD HHmmss");
  return dayjsObject;
}

function getNowMinusSeconds(seconds: number): dayjs.Dayjs {
  const now = dayjs();
  const subtractedTime = now.subtract(seconds, "second");
  return subtractedTime;
}

async function checkNewTrans(
  transactionTime: string,
  secondsThreshold: number
): boolean {
  let todayTrans = await getTodayTrans();

  const newTransactions = todayTrans.filter((transaction: any) => {
    const transactionTime = formatNumberToSixDigits(transaction.PCTime); // Assuming the transaction time property is "time"
    return checkNewTrans(transactionTime, secondsThreshold);
  });

  const transTime = getTransTimeAsDayjs(transactionTime);
  const thresholdTime = getNowMinusSeconds(secondsThreshold);

  return transTime.isAfter(thresholdTime);

  return newTransactions;
}

checkNewTrans()
  .then((newTransactions) => {
    console.log("New Transactions:", newTransactions);
  })
  .catch((error) => {
    console.error("Error:", error);
  });

// Example usage

// do a post axios to VCB API using async/await
// fetch the data
async function getTodayTrans(): Promise<any> {
  const data = {
    username: process.env.VCB_USERNAME,
    password: process.env.VCB_PASSWORD,
    accountNumber: process.env.VCB_ACCOUNT_NUMBER,
    begin: "19/06/2023",
    end: "19/06/2023",
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

getTodayTrans()
  .then((newTransactions) => {
    console.log("New Transactions:", newTransactions);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
