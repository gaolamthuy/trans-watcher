import axios from "axios";
import { timeStamp } from "./checkNewTrans";
import "dotenv/config";

enum MessageTypes {
  TRANSACTION = "transaction",
  SYSTEM = "system",
}

const VCB_AVATAR_URL =
  "https://raw.githubusercontent.com/hophamlam/trans-watchdog/main/assets/logo_vcb_1610091313.jpg";

function capitalize(str: string, lower: boolean = false): string {
  return (lower ? str.toLowerCase() : str).replace(
    /(?:^|\s|["'([{])+\S/g,
    (match: string) => match.toUpperCase()
  );
}

export async function sendDiscord(
  amount: string,
  time: string,
  description: string,
  messageType: "transaction" | "system"
): Promise<any> {
  const webhookUrl =
    messageType === MessageTypes.TRANSACTION
      ? process.env.TRANS_WEBHOOK_URL
      : process.env.SYSTEM_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("Webhook URL not provided for the message type.");
  }

  const payload =
    messageType === MessageTypes.TRANSACTION
      ? {
          username: "Nhận chuyển khoản VCB 1012.842.851",
          avatar_url: VCB_AVATAR_URL,
          content: `Nhận ${amount} VNĐ`,
          embeds: [
            {
              author: {
                name: "Hồ Phạm Lâm - VCB - 1012.842.851",
                url: process.env.LSGD_URL,
                icon_url: VCB_AVATAR_URL,
              },
              title: `💵 ${amount} VNĐ`,
              color: "5613637", // Consider using named constants for colors
              fields: [
                {
                  name: `⏲️ ${capitalize(time)}`,
                  value: `🗎 ${description}`,
                },
              ],
            },
          ],
        }
      : {
          embeds: [
            {
              title: "Máy chủ VCB đang gặp sự cố",
              color: "16711680", // Consider using named constants for colors
              fields: [
                {
                  name: "Máy chủ VCB đang gặp sự cố",
                  value: timeStamp(),
                },
              ],
            },
          ],
        };

  console.log(
    timeStamp(),
    " - Sending message to Discord:",
    JSON.stringify(payload)
  );

  try {
    return await axios.post(webhookUrl, payload);
  } catch (error: any) {
    console.error("Error sending Discord notification:", error.message);
    throw error;
  }
}

function manualSendDiscord() {
  sendDiscord(
    "387,500",
    "Thứ Sáu, 28/07/2023 11:19:51",
    "351145.280723.111951.VCB;1012842851;Co Doc thanh toan gao thom thai",
    "transaction"
  );
}

// Uncomment manualSendDiscord() to manually send a test message
// manualSendDiscord();
