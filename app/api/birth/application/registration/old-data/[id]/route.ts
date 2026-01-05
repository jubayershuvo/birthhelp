import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import BirthRegistration from "@/models/BirthRegistration";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Id not found" }, { status: 404 });
    }

    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await BirthRegistration.findById(id);
    if (!data || data.user !== user._id) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
