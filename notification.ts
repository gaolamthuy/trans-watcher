import axios from "axios";
import { formatNumberToSixDigits, timeStamp } from "./checkNewTrans";
import dayjs from "dayjs";
import "dotenv/config";

export async function sendDiscord(
  amount: string,
  time: string,
  description: string
): Promise<any> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  const payload = {
    username: "Nhận chuyển khoản VCB",
    avatar_url:
      "https://raw.githubusercontent.com/hophamlam/vcb-trans-watchdog/main/assets/logo_vcb_1610091313.jpg",
    content: "Báo nhận chuyển khoản Vietcombank Hồ Phạm Lâm 1012 842 851",
    color: "108500",
    embeds: [
      {
        title: "Nhận " + amount + " VNĐ",
        fields: [
          {
            name: time,
            value: description,
          },
        ],
      },
    ],
  };

  console.log(timeStamp(), " - Sending message to Discord:", payload);
  return axios.post(webhookUrl!, payload);
}

// Example usage
// sendDiscord("1000000", "2021-01-01 120000", "Test message");
// sendDiscord();
