import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import Passport from "@/models/Passport";
import { connectDB } from "@/lib/mongodb";
import { getUser } from "@/lib/getUser";
import Reseller from "@/models/Reseller";
import Services from "@/models/Services";
import Earnings from "@/models/Earnings";
import Spent from "@/models/Use";

/* 📂 Upload directory */
const UPLOAD_DIR = path.join(process.cwd(), "upload", "passports");

/* Ensure upload dir exists */
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/* 🔹 Types */
interface PassportFormData {
  [key: string]: string;
}

interface UserType {
  _id: mongoose.Types.ObjectId;
}

/* 🔹 Save file helper */
async function saveFile(file: File): Promise<string> {
  await ensureUploadDir();

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const ext = path.extname(sanitizedName) || getExtensionFromType(file.type);
  const baseName = path.basename(sanitizedName, path.extname(sanitizedName));
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const fileName = `${timestamp}-${random}-${baseName.slice(0, 20)}${ext}`;

  const filePath = path.join(UPLOAD_DIR, fileName);
  await fs.writeFile(filePath, buffer);

  // Return relative path for web access
  return filePath;
}

function getExtensionFromType(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
  };
  return extensions[mimeType] || ".bin";
}

/* 🔹 Convert file path to base64 string */
async function pathToBase64(filePath: string): Promise<string> {
  try {
    if (!filePath) return "";

    const fullPath = filePath;
    try {
      await fs.access(fullPath);
    } catch {
      return "";
    }

    const buffer = await fs.readFile(fullPath);
    const mimeType = getMimeType(path.extname(filePath));
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("Error converting file to base64:", error);
    return "";
  }
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };
  return mimeTypes[ext.toLowerCase()] || "application/octet-stream";
}

/* 🔹 Parse form data excluding files */
function parseFormData(formData: FormData): PassportFormData {
  const data: PassportFormData = {};

  formData.forEach((value, key) => {
    if (key !== "photo" && key !== "signature" && typeof value === "string") {
      data[key] = value;
    }
  });

  return data;
}

/* ======================================================
   GET /api/passport?id=...
====================================================== */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid passport id" },
        { status: 400 }
      );
    }

    const passport = await Passport.findById(id);
    if (!passport) {
      return NextResponse.json(
        { message: "Passport not found" },
        { status: 404 }
      );
    }

    /* Convert file paths to base64 strings */
    const photoBase64 = await pathToBase64(passport.photo || "");

    const signatureBase64 = await pathToBase64(passport.signature || "");

    return NextResponse.json({
      ...passport.toObject(),
      photo: photoBase64,
      signature: signatureBase64,
    });
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

/* ======================================================
   POST /api/passport (CREATE)
====================================================== */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const servicePath = "/passport/make";

    const service = await Services.findOne({ href: servicePath });
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    const userService = user.services.find(
      (s: { service: string }) =>
        s.service.toString() === service._id.toString()
    );

    if (!userService) {
      return NextResponse.json(
        { success: false, error: "User does not have access to this service" },
        { status: 403 }
      );
    }
    const serviceCost = userService.fee + service.fee;

    if (user.balance < serviceCost) {
      return NextResponse.json(
        { success: false, error: "User does not have enough balance" },
        { status: 403 }
      );
    }

    const reseller = await Reseller.findById(user.reseller);

    const formData = await req.formData();

    let photoPath: string | undefined;
    let signaturePath: string | undefined;

    const photo = formData.get("photo") as File | null;
    const signature = formData.get("signature") as File | null;

    if (photo && photo.size > 0) {
      photoPath = await saveFile(photo);
    }

    if (signature && signature.size > 0) {
      signaturePath = await saveFile(signature);
    }

    const data = parseFormData(formData);

    const passport = await Passport.create({
      ...data,
      user: user._id,
      photo: photoPath,
      signature: signaturePath,
    });
    user.balance -= serviceCost;
    reseller.balance += userService.fee;

    await Spent.create({
      user: user._id,
      service: userService._id,
      amount: serviceCost,
      data: passport._id,
      dataSchema: "PassportMake",
    });
    await Earnings.create({
      user: user._id,
      reseller: reseller._id,
      service: userService._id,
      amount: userService.fee,
      data: passport._id,
      dataSchema: "PassportMake",
    });
    await reseller.save();
    await user.save();
    return NextResponse.json(passport, { status: 201 });
  } catch (err: unknown) {
    console.error("POST Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Create failed";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

/* ======================================================
   PUT /api/passport?id=... (UPDATE)
====================================================== */
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const user = (await getUser()) as UserType | null;
    if (!user?._id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid passport id" },
        { status: 400 }
      );
    }

    const passport = await Passport.findById(id);
    if (!passport) {
      return NextResponse.json(
        { message: "Passport not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const photo = formData.get("photo") as File | null;
    const signature = formData.get("signature") as File | null;

    // Handle photo update
    if (photo && photo.size > 0) {
      // Delete old file if exists
      if (passport.photo) {
        try {
          const oldPath = passport.photo;
          await fs.unlink(oldPath);
        } catch (error) {
          console.warn("Could not delete old photo:", error);
        }
      }
      passport.photo = await saveFile(photo);
    }

    // Handle signature update
    if (signature && signature.size > 0) {
      // Delete old file if exists
      if (passport.signature) {
        try {
          const oldPath = path.join(
            process.cwd(),
            "public",
            passport.signature
          );
          await fs.unlink(oldPath);
        } catch (error) {
          console.warn("Could not delete old signature:", error);
        }
      }
      passport.signature = await saveFile(signature);
    }

    // Update other fields
    const data = parseFormData(formData);
    Object.keys(data).forEach((key) => {
      if (key !== "photo" && key !== "signature") {
        (passport as unknown as Record<string, string>)[key] = data[key];
      }
    });
    passport.user = user._id;

    await passport.save();

    return NextResponse.json(passport);
  } catch (err: unknown) {
    console.error("PUT Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
