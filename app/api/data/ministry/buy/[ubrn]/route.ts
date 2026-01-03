import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import BdrisData from "@/models/BdrisData";
import Earnings from "@/models/Earnings";
import Reseller from "@/models/Reseller";
import Services from "@/models/Services";
import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import Spent from "@/models/Use";

// 🔹 Ministry DB connection details
const uri = process.env.MONGO_URI!;
const dbName = "bdris";
const collectionName = "people";

interface Person {
  ubrn: string;
  personNameEn: string;
  personNameBn: string;
  personBirthDate: string;
  gender: string;
  dateOfRegistration: string;
  searchText?: string;
  _id?: string;
}

// 🔹 Cache Ministry DB connection
let cachedMinistryClient: MongoClient | null = null;

// Connect to SECOND DB (Ministry DB)
async function connectMinistryDB(): Promise<MongoClient> {
  if (cachedMinistryClient) return cachedMinistryClient;

  const client = new MongoClient(uri, { maxPoolSize: 20 });
  await client.connect();
  cachedMinistryClient = client;

  return client;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ubrn: string }> }
) {
  try {
    const { ubrn } = await params;

    if (!ubrn) {
      return NextResponse.json({ error: "UBRN is required" }, { status: 400 });
    }

    // -----------------------------
    // 1️⃣ AUTH CHECK (Primary DB)
    // -----------------------------
    await connectDB();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const reseller = await Reseller.findById(user.reseller);


    // Validate service access
    const servicePath = "/data/ministry";
    const service = await Services.findOne({ href: servicePath });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const userService = user.services.find(
      (s: { service: string }) =>
        s.service.toString() === service._id.toString()
    );

    if (!userService) {
      return NextResponse.json(
        { error: "User does not have access to this service" },
        { status: 403 }
      );
    }
    const serviceCost = user.isSpecialUser
      ? userService.fee
      : userService.fee + service.fee;
    if (user.balance < serviceCost) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 402 }
      );
    }
    // -----------------------------------
    // 2️⃣ FETCH FROM MINISTRY DATABASE
    // -----------------------------------
    const ministryClient = await connectMinistryDB();
    const ministryDB = ministryClient.db(dbName);
    const collection = ministryDB.collection<Person>(collectionName);

    const person = await collection.findOne({ ubrn });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // -----------------------------------
    // 3️⃣ SAVE TO YOUR LOCAL DATABASE
    // -----------------------------------
    const { _id, ...personData } = person;

    const storedPerson = await BdrisData.create({
      ...personData,
      user: user._id,
    });
    user.balance -= serviceCost;

    await Spent.create({
      user: user._id,
      service: userService._id,
      amount: serviceCost,
      data: storedPerson._id,
      dataSchema: "MinistryData",
    });
    if (reseller && !user.isSpecialUser) {
      reseller.balance += userService.fee;
      await Earnings.create({
        user: user._id,
        reseller: reseller._id,
        service: userService._id,
        amount: userService.fee,
        data: storedPerson._id,
        dataSchema: "MinistryData",
      });
      await reseller.save();
    }

    await user.save();
    // -----------------------------------
    // 4️⃣ RETURN RESPONSE
    // -----------------------------------
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error in /api/data/ministry/buy route:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        details: error || String(error),
      },
      { status: 500 }
    );
  }
}
