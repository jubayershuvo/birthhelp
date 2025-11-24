import axios from "axios";
import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { ubrn, dob } = await req.json();

    if (!ubrn || !dob) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let apiResponse;

    try {
      apiResponse = await axios.post(
        "https://api.fortest.top/birth_test/api/birth_verification.php",
        {
          username: "sagarmandal712103@gmail.com",
          password: "sagarmandal712103@gmail.com",
          ubrn,
          birth_date: dob,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (apiResponse.data.error || !apiResponse.data.success) {
        return NextResponse.json(
          { success: false, error: apiResponse.data.error },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error || "External API error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(apiResponse.data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error || "Server Error" },
      { status: 500 }
    );
  }
}
