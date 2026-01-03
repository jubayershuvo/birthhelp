import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import CorrectionApplication from "@/models/Currection";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!body) {
      return NextResponse.json({ message: "Data not found" }, { status: 404 });
    }
    let data;
    if (body._id) {
      const id = body._id;
      delete body._id;
      data = await CorrectionApplication.updateOne(
        { _id: id },
        { $set: { ...body } }
      );
    } else {
      delete body._id;
      data = await CorrectionApplication.create({
        ...body,
        user: user._id,
      });
    }
    data = await CorrectionApplication.findById(body._id);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
