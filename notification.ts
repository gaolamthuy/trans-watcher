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
  description: string
): Promise<any> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  const payload = {
    username: "Nhận chuyển khoản VCB 1012.842.851",
    avatar_url:
      "https://raw.githubusercontent.com/hophamlam/vcb-trans-watchdog/main/assets/logo_vcb_1610091313.jpg",
    content: "Nhận " + amount + " VNĐ",
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
            name: capitalize(time),
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
// sendDiscord("1000000", "thứ tư, 21/06/2023 13:02:40", "Test message");
// sendDiscord();
