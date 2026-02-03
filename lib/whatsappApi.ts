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

export async function sendWhatsAppFile(formData: FormData) {
  const url = `${api}/api/whatsapp/send/file`;
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
