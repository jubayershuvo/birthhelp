import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import BirthRegistration from "@/models/BirthRegistration";
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
    const id = body._id;
    delete body._id;
    console.log("ID", id)
    if (id) {
      data = await BirthRegistration.updateOne(
        { _id: id },
        { $set: { ...body } }
      );
    } else {
      data = await BirthRegistration.create({
        ...body,
        user: user._id,
      });
    }
    data = await BirthRegistration.findById(id);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // console.log(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
