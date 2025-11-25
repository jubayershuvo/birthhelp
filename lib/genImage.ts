import QRCode from "qrcode";
import { createCanvas, Canvas } from "canvas";
import JsBarcode from "jsbarcode";

// === Type Definitions ===
interface QRBarcodeData {
  barcodeData: string;
  qrCodeData: string;
}

// === Helper Function: Clean URL ===
function cleanUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";

  // Replace all escaped slashes (\/) with /
  let cleaned = rawUrl.replace(/\\\//g, "/");

  // If the URL came from a JSON string, parse it safely
  try {
    cleaned = JSON.parse(`"${cleaned}"`);
  } catch {
    // ignore if not JSON-escaped
  }

  return cleaned;
}

// === Function 1: Generate QR Code (base64 or PNG) ===
export async function generateQRCode(data: string): Promise<string | null> {
  try {
    const qrImage = await QRCode.toDataURL(cleanUrl(data), {
      errorCorrectionLevel: "H", // High error correction
      width: 200,
    });
    return qrImage; // Base64 string
  } catch (error) {
    console.error("QR generation failed:", error);
    return null;
  }
}

// === Function 2: Generate Barcode (base64 or PNG) ===
export function generateBarcode(data: string): string | null {
  try {
    // Create a larger canvas for sharper resolution
    const canvas: Canvas = createCanvas(600, 120);

    JsBarcode(canvas, data, {
      format: "CODE128",
      displayValue: false, // ❌ hides the text under the barcode
      width: 2, // each bar width
      height: 100, // height of bars
      margin: 10, // small margin around
      background: "#ffffff",
      lineColor: "#000000",
    });

    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Barcode generation failed:", error);
    return null;
  }
}
