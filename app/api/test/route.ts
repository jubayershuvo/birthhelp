import { generateNidBarcode } from "@/lib/genImage";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const barcodeData = `<pin>19833313070000042</pin><name>we wer wer</name><DOB>2 sed 1232</DOB><FP></FP><F>Right Index</F><TYPE>A</TYPE><V>2.0</V><ds>302c02167da6b272e960dfaf8a7ccca6b031da99defe8d24c44882580f7a9b3fea93b99040f65c34e8edafe9de63</ds>`;

    const pngbuffer = await generateNidBarcode(barcodeData);

    return NextResponse.json('data:image/png;base64,'+pngbuffer?.toString("base64"), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
