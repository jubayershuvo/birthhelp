const WHATSAPP_API_URL = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

export async function sendOtpTemplate(
  to: string,
  otp: string,
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
        name: "otp_verify",
        language: { code: language },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: otp },
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
    throw new Error(
      `WhatsApp OTP Verify Error: ${JSON.stringify(data)}`
    );
  }

  return data;
}

export async function sendNewOrderToReseller(
  to: string,
  serviceName: string,
  userName: string,
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
        name: "res_odr_recipt",
        language: { code: language },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: serviceName },
              { type: "text", text: userName },
            ],
          },
        ],
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `WhatsApp Reseller Post Created Error: ${JSON.stringify(data)}`
    );
  }

  return data;
}

export async function sendUserOrderCancelledTemplate(
  to: string,
  userName: string,
  serviceName: string,
  resellerName: string,
  cancelReason: string,
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
        name: "order_cancel",
        language: { code: language },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: userName },
              { type: "text", text: serviceName },
              { type: "text", text: resellerName },
              { type: "text", text: cancelReason },
            ],
          },
        ],
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `WhatsApp User Order Cancel Error: ${JSON.stringify(data)}`
    );
  }

  return data;
}

export async function sendUserOrderAcceptedTemplate(
  to: string,
  userName: string,
  serviceName: string,
  resellerName: string,
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
        name: "order_accept",
        language: { code: language },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: userName },
              { type: "text", text: serviceName },
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
      `WhatsApp User Order Accepted Error: ${JSON.stringify(data)}`
    );
  }

  return data;
}

export async function sendOrderAcceptedTemplate(
  to: string,
  resellerName: string,
  serviceName: string,
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
        name: "res_order_actp",
        language: { code: language },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: resellerName },
              { type: "text", text: serviceName },
            ],
          },
        ],
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `WhatsApp Order Accepted Error: ${JSON.stringify(data)}`
    );
  }

  return data;
}
export async function sendOrderDeliveryTemplate(
  to: string,
  productName: string,
  storeName: string,
  invoiceNumber: string,
  documentUrl: string,
  documentFileName: string,
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
        name: "purchase_receipt",
        language: { code: language },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: productName },
              { type: "text", text: storeName },
              { type: "text", text: invoiceNumber },
            ],
          },
          {
            type: "header",
            parameters: [
              {
                type: "document",
                document: {
                  link: documentUrl,
                  filename: documentFileName,
                },
              },
            ],
          },
        ],
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`WhatsApp Delivery Error: ${JSON.stringify(data)}`);
  }

  return data;
}
