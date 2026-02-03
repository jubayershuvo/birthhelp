import { File } from "formdata-node";
const api = process.env.WHATSAPP_API;
const api_key = process.env.WHATSAPP_API_KEY;

if (!api) throw new Error("WHATSAPP_API missing");
if (!api_key) throw new Error("WHATSAPP_API_KEY missing");

export async function sendWhatsAppText(number: string, message: string) {
  const textApi = `${api}/api/whatsapp/send/text`;

  const res = await fetch(textApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": api_key!,
    },
    body: JSON.stringify({ number, message }),
  });

  return res.json();
}

export async function sendWhatsAppFile({
  files,
  number,
  group,
  caption,
}: {
  files: File[]; // max 5
  number?: string;
  group?: string;
  caption?: string;
}) {
  if (!number && !group) {
    throw new Error("Either number or group is required");
  }

  const url = `${api}/api/whatsapp/send/file`;

  const formData = new FormData();

  // append files
  files.forEach((file) => {
    formData.append("files", file as any);
  });

  if (number) formData.append("number", number);
  if (group) formData.append("group", group);
  if (caption) formData.append("caption", caption);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-KEY": api_key!,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Failed to send file: ${await res.text()}`);
  }

  return res.json();
}
