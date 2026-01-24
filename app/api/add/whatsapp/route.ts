import { generateOtp } from "@/lib/otp";
import { sendOtpTemplate } from "@/lib/whatsAppCloude";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  phone: string;
}

interface SuccessResponse {
  message: string;
}

interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body: RequestBody = await request.json();
    const { phone } = body;

    // Validate phone is provided
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Enhanced phone validation
    const phoneRegex = /^\+\d{1,3}\d{9,15}$/; // + followed by country code (1-3 digits) and 9-15 digits
    const cleanedPhone = phone.trim();
    
    if (!phoneRegex.test(cleanedPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Please use format: +1234567890" },
        { status: 400 }
      );
    }

    // Validate country code exists (at least +1)
    if (!cleanedPhone.match(/^\+\d+/)) {
      return NextResponse.json(
        { error: "Country code is required (e.g., +1)" },
        { status: 400 }
      );
    }

    try {
      // Generate and send OTP
      const otp = generateOtp(cleanedPhone);
      await sendOtpTemplate(cleanedPhone, otp);
      
      return NextResponse.json(
        { message: "Verification code sent successfully" },
        { status: 200 }
      );
    } catch (error: unknown) {
      console.error("Failed to send WhatsApp message:", error);
      
      let errorMessage = "Failed to send verification code";
      if (error instanceof Error) {
        errorMessage = `Failed to send WhatsApp: ${error.message}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Internal server error:", error);
    
    let errorMessage = "Internal server error";
    if (error instanceof SyntaxError) {
      errorMessage = "Invalid request format";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}