// lib/whatsapp.ts
import axios from "axios";
import fs from "fs";
import mime from "mime-types";
import path from "path";

const API_KEY = process.env.WASENDER_API_KEY!;
const BASE_URL = "https://wasenderapi.com/api";

if (!API_KEY) throw new Error("WASENDER_API_KEY missing");

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
  },
});

/**
 * Uploads local file to WasenderAPI upload endpoint
 * Returns a public URL you can use in send-message
 */
export async function uploadMedia(
  filePath: string
): Promise<{ publicUrl: string }> {
  const buffer = fs.readFileSync(filePath);
  const mimeType = mime.lookup(filePath) || "application/octet-stream";

  const res = await api.post("/upload", buffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": buffer.length.toString(),
    },
  });

  return res.data;
}

/**
 * Sends a text message
 */
export async function sendWhatsAppText(to: string, text: string) {
  const res = await api.post(
    "/send-message",
    {
      to: to.replace(/\s+/g, ""),
      text,
    },
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  return res.data;
}

/**
 * Sends a document by URL returned from upload
 */
export async function sendWhatsAppDocument(
  to: string,
  fileUrl: string,
  fileName?: string,
  text?: string
) {
  const res = await api.post(
    "/send-message",
    {
      to: to.replace(/\s+/g, ""),
      text,
      documentUrl: fileUrl,
      fileName,
    },
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  return res.data;
}

/**
 * ONE CALL: Upload + Send doc
 */
export async function sendWhatsAppFile(
  to: string,
  filePath: string,
  text?: string
) {
  const uploaded = await uploadMedia(filePath);
  
  return sendWhatsAppDocument(
    to,
    uploaded.publicUrl,
    path.basename(filePath),
    text
  );
}
