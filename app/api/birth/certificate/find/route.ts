import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { ubrn, dob } = await req.json();
  if (!ubrn || !dob) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
      const response = await fetch(
        "https://api.fortest.top/birth_test/api/birth_verification.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "sagarmandal712103@gmail.com",
            password: "sagarmandal712103@gmail.com",
            ubrn,
            birth_date: dob,
          }),
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: "Failed to verify birth certificate" },
          { status: 404 }
        );
      }

      const jsonData = await response.json();
      if (jsonData.success === false) {
        return NextResponse.json(
          { success: false, error: jsonData.error || "No data found" },
          { status: 404 }
        );
      }
    } catch (error) {
      return NextResponse.json({ error: "faild to get data" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
