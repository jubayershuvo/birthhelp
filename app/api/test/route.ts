import { sendWhatsAppFile } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await sendWhatsAppFile(
      "+919330014767",
      "E:\\Node_Projects\\Web_App\\bdris\\bdris\\upload\\pdf\\691ff0f48e65e9d73a87be07\\56725194.pdf",
      "Test with File from API!"
    );

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
