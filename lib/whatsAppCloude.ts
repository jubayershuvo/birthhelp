
const WHATSAPP_API_URL = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

export async function sendOtpTemplate(
  to: string,
  otp: string,
  language = "en"
) {
  const res = await fetch(WHATSAPP_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: "otp_code",
        language: { code: language },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
        ],
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`WhatsApp OTP Error: ${JSON.stringify(data)}`);
  }

  return data;
}

export async function sendNewOrderToReseller(
  to: string,
  serviceId: string,
  resellerName: string,
  language = "en_US"
) {
  const res = await fetch(WHATSAPP_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: "delivery_confirmation_4",
        language: { code: language },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: serviceId },
              { type: "text", text: resellerName },
            ],
          },
        ],
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `WhatsApp Reseller Order Error: ${JSON.stringify(data)}`
    );
  }

  return data;
}