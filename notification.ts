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
    username: "Nhận chuyển khoản VCB 1012.842.851",
    avatar_url:
      "https://raw.githubusercontent.com/hophamlam/vcb-trans-watchdog/main/assets/logo_vcb_1610091313.jpg",
    content: "VCB-1012.842.851 nhận " + amount + " VNĐ",
    color: "46848",
    embeds: [
      {
        author: {
          name: "Hồ Phạm Lâm - VCB - 1012.842.851",
          url: "https://lsgd.gaolamthuy.vn",
          icon_url:
            "https://raw.githubusercontent.com/hophamlam/vcb-trans-watchdog/main/assets/logo_vcb_1610091313.jpg",
        },
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

  console.log(
    timeStamp(),
    " - Sending message to Discord:",
    JSON.stringify(payload)
  );
  return axios.post(webhookUrl!, payload);
}

// Example usage
// sendDiscord("1000000", "2021-01-01 120000", "Test message");
// sendDiscord();
