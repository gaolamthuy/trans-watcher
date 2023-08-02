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

export function formatNumberToSixDigits(PCTime: string): string {
  if (PCTime) {
    return PCTime.padStart(6, "0");
  }
  return "";
}

export function getTransTimeAsDayjs(
  dateString: string,
  timeString: string
): dayjs.Dayjs {
  const formattedDateTime = `${dateString} ${timeString}`;
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

      // Check if 'response.data.results' exists
      if ("results" in response.data) {
        let transactions = response.data.results;

        if (!Array.isArray(transactions)) {
          // If transactions is not an array, wrap it in an array
          transactions = [transactions];
        }

        return transactions;
      } else {
        // If 'results' doesn't exist, return the entire 'response.data'
        // This is to handle the case for api errors:
        // "Quý khách đã nhập sai thông tin đăng nhập VCB Digibank 3 lần liên tiếp. Vui lòng nhập thông tin giấy tờ tùy thân để tiếp tục đăng nhập"
        sendDiscord("", "", JSON.stringify(response.data), "system");
        return response.data;
      }
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
}

// Store last timestamp and look for new transactions
let lastTransactions: Transaction[] | null = null;

interface Transaction {
  tranDate: string;
  TransactionDate: string;
  Reference: string;
  CD: string;
  Amount: string;
  Description: string;
  PCTime: string;
  DorCCode: string;
  EffDate: string;
  PostingDate: string;
  PostingTime: string;
  Remark: string;
  SeqNo: string;
  TnxCode: string;
  Teller: string;
}

export async function checkNewTrans() {
  try {
    const checkingTransactions = await getTodayTrans();

    if (lastTransactions === null) {
      // Initialize lastTransactions with the result of the first call to getTodayTrans()
      lastTransactions = checkingTransactions;
      logTransactionArray("Initial lastTransactions set to", lastTransactions);
      return;
    }

    if (checkingTransactions.length === 0) {
      console.log(timeStamp(), " - No transactions found.");
      return;
    }

    // Find new transactions by comparing checkingTransactions and lastTransactions
    const newTransactions = checkingTransactions.filter(
      (transaction: any) =>
        !lastTransactions!.some((t) => t.Reference === transaction.Reference)
    );

    if (newTransactions.length > 0) {
      newTransactions.forEach((newTransaction: any) => {
        const { Amount, PCTime, Remark, Reference, TransactionDate } =
          newTransaction;
        console.log(
          timeStamp(),
          " - New Transaction: ",
          JSON.stringify({ Amount, PCTime, Remark, Reference })
        );

        // Send Discord notification for the new transaction
        sendDiscord(
          Amount,
          getTransTimeAsDayjs(
            TransactionDate,
            formatNumberToSixDigits(PCTime)
          ).format("dddd, DD/MM/YYYY HH:mm:ss"),
          Remark,
          "transaction"
        );
      });

      // Update the lastTransactions array with the checkingTransactions array
      lastTransactions = checkingTransactions;
      logTransactionArray("lastTransactions updated to", lastTransactions);
    } else {
      logTransactionArray(
        "No new transactions found. Current lastTransactions",
        lastTransactions
      );
    }
  } catch (error) {
    console.error(timeStamp(), " - Error: ", JSON.stringify(error));
    await sendDiscord("", "", "", "system");
  }
}

// Function to log a transaction array
function logTransactionArray(
  message: string,
  transactions: Transaction[] | null
) {
  if (transactions) {
    console.log(
      timeStamp(),
      ` - ${message}: `,
      JSON.stringify(
        transactions.map(
          ({ Amount, TransactionDate, PCTime, Remark, Reference }) => ({
            Amount,
            Remark,
            Reference,
          })
        )
      )
    );
  } else {
    console.log(timeStamp(), ` - ${message}: null`);
  }
}

// Test function for checkNewTrans()
async function testCheckNewTrans() {
  try {
    lastTransactions = [
      {
        tranDate: "31/07/2023",
        TransactionDate: "31/07/2023",
        Reference: "5209 - 33719",
        CD: "+",
        Amount: "1,500,000",
        Description:
          "159505.310723.222237.HUYNH THI KIM DUNG chuyen FT23212609136793",
        PCTime: "222238",
        DorCCode: "C",
        EffDate: "2023-07-31",
        PostingDate: "2023-07-31",
        PostingTime: "222238",
        Remark:
          "159505.310723.222237.HUYNH THI KIM DUNG chuyen FT23212609136793",
        SeqNo: "33719",
        TnxCode: "34",
        Teller: "5209",
      },
      {
        tranDate: "29/07/2023",
        TransactionDate: "29/07/2023",
        Reference: "5273 - 94804",
        CD: "-",
        Amount: "44,000,000",
        Description:
          "IBVCB.3933442466.039547.HO PHAM LAM chuyen khoan.CT tu 1012842851 HO PHAM LAM toi 0938568040 HO PHAM LAM Ngan hang Tien phong (TPBANK)",
        PCTime: "092015",
        DorCCode: "D",
        EffDate: "2023-07-29",
        PostingDate: "2023-07-29",
        PostingTime: "092015",
        Remark:
          "IBVCB.3933442466.039547.HO PHAM LAM chuyen khoan.CT tu 1012842851 HO PHAM LAM toi 0938568040 HO PHAM LAM Ngan hang Tien phong (TPBANK)",
        SeqNo: "94804",
        TnxCode: "74",
        Teller: "5273",
      },
      {
        tranDate: "28/07/2023",
        TransactionDate: "28/07/2023",
        Reference: "5209 - 11614",
        CD: "+",
        Amount: "387,500",
        Description:
          "351145.280723.111951.VCB;1012842851;Co Doc thanh toan gao thom thai",
        PCTime: "111951",
        DorCCode: "C",
        EffDate: "2023-07-28",
        PostingDate: "2023-07-28",
        PostingTime: "111951",
        Remark:
          "351145.280723.111951.VCB;1012842851;Co Doc thanh toan gao thom thai",
        SeqNo: "11614",
        TnxCode: "34",
        Teller: "5209",
      },
      {
        tranDate: "28/07/2023",
        TransactionDate: "28/07/2023",
        Reference: "5209 - 9695",
        CD: "+",
        Amount: "2,363,000",
        Description: "204314.280723.095343.IBFT Tien nep ngay 28 7",
        PCTime: "095345",
        DorCCode: "C",
        EffDate: "2023-07-28",
        PostingDate: "2023-07-28",
        PostingTime: "095345",
        Remark: "204314.280723.095343.IBFT Tien nep ngay 28 7",
        SeqNo: "9695",
        TnxCode: "34",
        Teller: "5209",
      },
      {
        tranDate: "28/07/2023",
        TransactionDate: "28/07/2023",
        Reference: "5209 - 28941",
        CD: "+",
        Amount: "440,000",
        Description:
          "133275.280723.070233.VCB;1012842851;DANG THI PHUONG LAN chuyen khoan",
        PCTime: "070233",
        DorCCode: "C",
        EffDate: "2023-07-28",
        PostingDate: "2023-07-28",
        PostingTime: "070233",
        Remark:
          "133275.280723.070233.VCB;1012842851;DANG THI PHUONG LAN chuyen khoan",
        SeqNo: "28941",
        TnxCode: "34",
        Teller: "5209",
      },
      {
        tranDate: "27/07/2023",
        TransactionDate: "27/07/2023",
        Reference: "5214 - 48662",
        CD: "+",
        Amount: "145,000",
        Description: "646454.270723.161615.IBFT LE NGOC KIEU MY chuyen tien",
        PCTime: "161615",
        DorCCode: "C",
        EffDate: "2023-07-27",
        PostingDate: "2023-07-27",
        PostingTime: "161615",
        Remark: "646454.270723.161615.IBFT LE NGOC KIEU MY chuyen tien",
        SeqNo: "48662",
        TnxCode: "34",
        Teller: "5214",
      },
      {
        tranDate: "27/07/2023",
        TransactionDate: "27/07/2023",
        Reference: "5078 - 92682",
        CD: "+",
        Amount: "130,000",
        Description:
          "MBVCB.3923584464.HOANG THUY TIEN chuyen tien.CT tu 0071001012273 HOANG THUY TIEN toi1012842851 HO PHAM LAM",
        PCTime: "124653",
        DorCCode: "C",
        EffDate: "2023-07-27",
        PostingDate: "2023-07-27",
        PostingTime: "124653",
        Remark:
          "MBVCB.3923584464.HOANG THUY TIEN chuyen tien.CT tu 0071001012273 HOANG THUY TIEN toi1012842851 HO PHAM LAM",
        SeqNo: "92682",
        TnxCode: "34",
        Teller: "5078",
      },
    ];

    console.log("Running testCheckNewTrans...");

    // Simulate calling checkNewTrans() with the provided lastTransactions
    await checkNewTrans();

    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Test failed with error: ", error);
  }
}

// Run the test function
// testCheckNewTrans();
// checkNewTrans()
