import axios from "axios";
import { formatNumberToSixDigits } from "./checkNewTrans";
import dayjs from "dayjs";

export async function sendDiscord(
  amount: string,
  time: string,
  description: string
): Promise<any> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  const payload = {
    username: "Nhận chuyển khoản VCB",
    content: "Báo nhận chuyển khoản Vietcombank Hồ Phạm Lâm 1012 842 851",
    embeds: [
      {
        title: "Nhận " + amount + " VNĐ",
        description: description,
        color: "0a9400",
        fields: [
          {
            name: "Time",
            value: time,
            inline: true,
          },
        ],
      },
    ],
  };

  console.log("- Sending message to Discord:", payload);
  return axios.post(webhookUrl!, payload);
}

// Example usage
const newTransactions: any = [
  {
    Amount: "10.5",
    Description: "New purchase",
    PCTime: "12:34:56",
    tranDate: "01/01/2021",
  },
  {
    Amount: "20.0",
    Description: "Payment received",
    PCTime: "23:45:00",
    tranDate: "01/01/2021",
  },
];
