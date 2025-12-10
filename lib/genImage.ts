import bwipjs from "bwip-js";

// === Function 1: Generate QR Code (base64 or PNG) ===
export async function generateQRCode(data: string): Promise<string | null> {
  try {
    const png: Buffer = await bwipjs.toBuffer({
      bcid: "qrcode",
      text: data,
      scale: 4,
      version: 6,
      includetext: false,
      eclevel: "L",
      padding: 4,
    });

    // Convert buffer → base64 → Data URL
    const base64 = png.toString("base64");
    console.log(base64)
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("QR generation failed:", error);
    return null;
  }
}
// === Function 2: Generate Barcode (base64 or PNG) ===
export async function generateBarcode(data: string): Promise<string | null> {
  try {
    const png = await bwipjs.toBuffer({
      bcid: "code128", // BD Birth Certificate uses Code128
      text: data,
      scale: 3, // HD quality (3 = sharp, not thick)
      height: 30, // line height
      includetext: false, // no text below barcode
      paddingwidth: 0,
      paddingheight: 0,
    });

    return "data:image/png;base64," + png.toString("base64");
  } catch (error) {
    console.error("Barcode generation failed:", error);
    return null;
  }
}
// === Function 3: Generate PDF417 Barcode (base64 or PNG) ===
export async function generateNidBarcode(data: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    bwipjs.toBuffer(
      {
        bcid: "pdf417", // Barcode type
        text: data, // Data to encode
        scale: 3, // 1..10 (scale of modules)
        paddingwidth: 20,
        paddingheight: 20,
        includetext: false, // PDF417 typically doesn't include human text
        width: 1364, // Width of canvas in pixels
        height: 185,
      },
      function (err: Error, pngBuffer: Buffer) {
        if (err) {
          console.error("bwip-js error:", err);
          resolve(null);
        } else {
          resolve(pngBuffer);
        }
      }
    );
  });
}
