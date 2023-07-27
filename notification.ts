import axios from "axios";
import { timeStamp } from "./checkNewTrans";
import "dotenv/config";

// capitalize dayjs string
const capitalize = (str: any, lower = false) =>
  (lower ? str.toLowerCase() : str).replace(
    /(?:^|\s|["'([{])+\S/g,
    (match: any) => match.toUpperCase()
  );

export async function sendDiscord(
  amount: string,
  time: string,
  description: string,
  messageType: "transaction" | "system"
): Promise<any> {
  let webhookUrl: any;

  if (messageType === "transaction") {
    webhookUrl = process.env.TRANS_WEBHOOK_URL;
  } else {
    webhookUrl = process.env.SYSTEM_WEBHOOK_URL;
  }

  let payload: any;

  if (messageType === "transaction") {
    payload = {
      username: "Nhận chuyển khoản VCB 1012.842.851",
      avatar_url:
        "https://raw.githubusercontent.com/hophamlam/vcb-trans-watchdog/main/assets/logo_vcb_1610091313.jpg",
      content: "Nhận " + amount + " VNĐ",
      embeds: [
        {
          author: {
            name: "Hồ Phạm Lâm - VCB - 1012.842.851",
            url: process.env.LSGD_URL,
            icon_url:
              "https://raw.githubusercontent.com/hophamlam/vcb-trans-watchdog/main/assets/logo_vcb_1610091313.jpg",
          },
          title: "💵 " + amount + " VNĐ",
          color: "5613637",
          fields: [
            {
              name: "⏲️ " + capitalize(time),
              value: "🗎 " + description,
            },
          ],
        },
      ],
    };
  } else {
    payload = {
      embeds: [
        {
          title: "Máy chủ VCB đang gặp sự cố",
          color: "16711680",
          fields: [
            {
              name: "Máy chủ VCB đang gặp sự cố",
              value: timeStamp(),
            },
          ],
        },
      ],
    };
  }

  console.log(
    timeStamp(),
    " - Sending message to Discord:",
    JSON.stringify(payload)
  );

  return axios.post(webhookUrl!, payload);
}

// Example usage
// sendDiscord(
//   "145,000",
//   "Thứ Năm, 27/07/2023 16:16:15",
//   "646454.270723.161615.IBFT LE NGOC KIEU MY chuyen tien",
//   "transaction"
// );
