;
import bwipjs from "bwip-js";

// === Type Definitions ==
// === Function 1: Generate QR Code (base64 or PNG) ===
export async function generateQRCode(data: string): Promise<string | null> {
  try {
    const png: Buffer = await bwipjs.toBuffer({
      bcid: "qrcode",
      text: data,
      scale: 4,
      version: 6,
      includetext: false,
      eclevel: "M",
      padding: 4,
    });

    // Convert buffer → base64 → Data URL
    const base64 = png.toString("base64");
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
      bcid: "code128",   // BD Birth Certificate uses Code128
      text: data,
      scale: 3,          // HD quality (3 = sharp, not thick)
      height: 30,        // line height
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
// export function generateBarcode(data: string): string | null {
//   try {
//     // Create a larger canvas for sharper resolution
//     const canvas: Canvas = createCanvas(600, 120);

//     JsBarcode(canvas, data, {
//       format: "CODE128",
//       displayValue: false, // hides the text under the barcode
//       width: 2, // each bar width
//       height: 100, // height of bars
//       margin: 10, // small margin around
//       background: "#ffffff",
//       lineColor: "#000000",
//     });

//     return canvas.toDataURL("image/png");
//   } catch (error) {
//     console.error("Barcode generation failed:", error);
//     return null;
//   }
// }

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
          // fs.writeFileSync(path, pngBuffer);
          // console.log("Saved dl-pdf417.png (size:", pngBuffer.length, "bytes)");
          // also show a data URI if you need to embed in HTML:
          // const dataUri = "data:image/png;base64," + pngBuffer.toString("base64");
          resolve(pngBuffer);
        }
      }
    );
  });
}
