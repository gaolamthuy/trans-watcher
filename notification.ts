import axios from "axios";

export async function sendDiscord(message: string): Promise<any> {
  const webhookUrl:any = process.env.DISCORD_WEBHOOK_URL;

  const payload = {
    content: message,
  };

  return axios.post(webhookUrl, payload);
}
